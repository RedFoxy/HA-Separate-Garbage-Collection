/**
 * HA Separate Garbage Collection Card
 * v4.0.1 - 19/05/2026
 * Author: Massimo "RedFoxy Darrest" Cicciò
 * Git   : https://github.com/RedFoxy/ha-separate-garbage-collection
 *
 *   days: 1  → daily view (large icons, no background)
 *   days: 3  → 3 columns with background
 *   days: 5  → 5 columns with background (default)
 *
 * Descrizione evento calendario (una per riga):
 *   color: #4CAF50        HEX color for the trash bin (optional, default is grey)
 *   icon:  wetwaste.png     custom image (optional, default icon is trashbin.svg)
 *   filter: hue-rotate(120deg) brightness(0.8)   manual override of the CSS filter to apply to the default icon (optional, auto-computed from color if not set)
 */

// Dual-path: HACS installs to /hacsfiles/<repo>/, manual install uses the legacy path.
// Detection is based on the URL of this script file at load time.
const _SCRIPT_SRC = (document.currentScript || {}).src || '';
const BASE_PATH = _SCRIPT_SRC.includes('/hacsfiles/')
  ? '/hacsfiles/HA-Separate-Garbage-Collection/'   // HACS install
  : '/local/redfoxy/ha-separate-garbage-collection/'; // manual install
const TRASHBIN   = `${BASE_PATH}trashbin.svg`;
const BG_DEFAULT = `${BASE_PATH}background.png`;

const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYS_FULL  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const CACHE_TTL  = 5 * 60 * 1000;
const MAX_AHEAD  = 45;

// Computes a calibrated CSS filter based on the real trash can colors (trashbin.svg).
// Base color: #f68b22  →  hsl(30°, 92%, 55%)
// Formula:
//   hue-rotate = target_hue - 30   (shifts from orange to the target hue)
//   saturate   = target_sat / 92   (proportional saturation adjustment)
//   brightness = target_lig / 55   (proportional lightness adjustment)
// For greys (saturation < 5%): use grayscale + brightness only.
const BASE_HUE = 30;   // hue of #f68b22
const BASE_SAT = 92;   // saturation of #f68b22
const BASE_LIG = 55;   // lightness of #f68b22

function colorToFilter(hex) {
  hex = hex.replace('#','');
  if (hex.length===3) hex=hex.split('').map(c=>c+c).join('');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return '';
  const r=parseInt(hex.slice(0,2),16)/255,
        g=parseInt(hex.slice(2,4),16)/255,
        b=parseInt(hex.slice(4,6),16)/255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
  let h=0,s=0; const l=(max+min)/2;
  if(d>0){
    s=l>.5?d/(2-max-min):d/(max+min);
    switch(max){
      case r:h=((g-b)/d+(g<b?6:0))/6;break;
      case g:h=((b-r)/d+2)/6;break;
      case b:h=((r-g)/d+4)/6;break;
    }
  }
  const hDeg=Math.round(h*360),sPct=Math.round(s*100),lPct=Math.round(l*100);

  if (sPct < 5) {
    return `grayscale(100%) brightness(${Math.min(2.5, lPct/BASE_LIG*1.2).toFixed(2)})`;
  }

  const hueRot = hDeg - BASE_HUE;
  const satMul = Math.round(sPct / BASE_SAT * 100);  // relative to base saturation
  const brigMul = (lPct / BASE_LIG).toFixed(2);

  const brigBoosted = Math.min(2.5, (lPct / BASE_LIG * 1.2)).toFixed(2);
  return `hue-rotate(${hueRot}deg) saturate(${satMul}%) brightness(${brigBoosted})`;
}

class HASeparateGarbageCollectionCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._cache      = {};
    this._fetched    = 0;
    this._ready      = false;
    this._lastTarget = null;
    this._interval   = null;
  }

  setConfig(cfg) {
    if (!cfg.calendar) throw new Error('"calendar" è obbligatorio.');
    this._cfg = {
      days             : 5,
      show_before      : '09:00',
      show_title       : false,   // show/hide the card title bar
      show_header      : false,   // alias for show_title (backward compat)
      title            : '',      // card title text (default: "Waste collection")
      show_labels      : true,    // show garbage type name overlaid on the bin
      show_day_labels  : true,    // show the day-offset label (Today / Tomorrow / in N days…)
      show_weekday     : true,    // show the short weekday name (Mon, Tue…) below the offset label
      day_labels       : null,    // override offset labels — auto-generated if null
                                  //   auto: ["Today","Tomorrow","in 2 days","in 3 days",…]
      short_days       : null,    // override short weekday names (7 entries, Sun–Sat)
                                  //   default: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
      skip_empty       : true,    // skip days with no collection
      refresh_interval : 300,     // seconds between calendar re-fetches
      icon_size        : null,    // px — auto-sized based on days count if null
      column_width     : null,    // px — fixed column width; null = distribute equally (1fr)
      empty_text       : 'No collection',
      empty_symbol     : '·',
      ...cfg,
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._ready) {
      this._ready = true;
      this._start();
      return;
    }
    // Re-fetch only if the target date changed (midnight or show_before threshold)
    const t = this._localDateStr(this._targetDate());
    if (t !== this._lastTarget) {
      this._lastTarget = t;
      this._fetch();
    }
  }

  disconnectedCallback() {
    // Clean up the refresh timer when the card is removed from DOM
    clearInterval(this._interval);
    this._ready = false;
  }

  _start() {
    this._fetch();  // initial load
    const ms = Math.max(10, this._cfg.refresh_interval) * 1000;
    this._interval = setInterval(() => this._fetch(), ms);
  }

  get _fetchDays() {
    return this._cfg.skip_empty ? MAX_AHEAD : (this._cfg.days || 5) + 1;
  }

  async _fetch() {
    if (!this._hass) return;
    const t0 = this._targetDate();
    const t1 = new Date(t0);
    t1.setDate(t1.getDate() + this._fetchDays);

    const fmt = d => {
      const ds = this._localDateStr(d);
      return `${ds}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:00`;
    };

    try {
      const raw = await this._hass.callApi('GET',
        `calendars/${this._cfg.calendar}?start=${fmt(t0)}&end=${fmt(t1)}`);
      this._cache = {};
      for (const ev of (raw || [])) {
        const ds = ev.start?.date || ev.start?.dateTime?.slice(0,10);
        if (!ds) continue;
        (this._cache[ds] = this._cache[ds] || []).push(this._parse(ev));
      }
      this._fetched = Date.now();
    } catch(e) {
      console.error('[GarbageCollection] Calendar fetch error:', e);
    }
    this._render();
  }

  _parse(ev) {
    const name = (ev.summary || 'Raccolta').trim();
    // Parse description: each line can be "key: value" or "key = value"
    const meta = {};
    for (const line of (ev.description || '').split(/\r?\n/)) {
      const m = line.match(/^([a-zA-Z_]+)\s*[:=]\s*(.+)$/);
      if (m) meta[m[1].toLowerCase().trim()] = m[2].trim();
    }
    const color   = meta.color || '#888';
    const iconRaw = meta.icon  || null;
    const iconUrl = iconRaw
      ? (iconRaw.startsWith('/') ? iconRaw : `${BASE_PATH}${iconRaw}`)
      : null;
    // Use manual filter from description, or auto-compute from color
    const cssFilter = meta.filter
      ? meta.filter
      : (color ? colorToFilter(color) : '');
    return { name, color, iconUrl, cssFilter };
  }

  _localDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  _targetDate() {
    const [sh, sm] = (this._cfg.show_before || '09:00').split(':').map(Number);
    const now = new Date();
    const after = now.getHours()*60 + now.getMinutes() >= sh*60 + (sm||0);
    const d = new Date(now);
    if (after) d.setDate(d.getDate() + 1);
    d.setHours(0,0,0,0);
    return d;
  }

  // Returns offset labels: ["Today","Tomorrow","in 2 days",...] — auto or user-defined
  _dayLabels() {
    if (Array.isArray(this._cfg.day_labels) && this._cfg.day_labels.length) {
      return this._cfg.day_labels;
    }
    const out = ['Today', 'Tomorrow'];
    for (let i = 2; i < MAX_AHEAD; i++) out.push(`in ${i} days`);
    return out;
  }

  // Returns short weekday names (Sun–Sat) — user-overridable via short_days config
  _shortDays() {
    return (Array.isArray(this._cfg.short_days) && this._cfg.short_days.length === 7)
      ? this._cfg.short_days
      : DAYS_SHORT;
  }

  // Day selection — skips empty days when skip_empty is true
  _getDays() {
    const count  = this._cfg.days || 5;
    const skip   = this._cfg.skip_empty !== false;
    const target = this._targetDate();
    const result = [];
    let offset   = 0;

    const shortNames = this._shortDays();
    const labels     = this._dayLabels();

    while (result.length < count && offset < MAX_AHEAD) {
      const d     = new Date(target);
      d.setDate(d.getDate() + offset);
      const ds    = this._localDateStr(d);
      const types = this._cache[ds] || [];

      if (!skip || types.length > 0) {
        result.push({
          ds,
          short      : shortNames[d.getDay()],
          full       : DAYS_FULL[d.getDay()],
          offsetLabel: labels[offset] ?? `in ${offset} days`,
          isToday    : offset === 0,
          isTomorrow : offset === 1,
          types,
        });
      }
      offset++;
    }
    return result;
  }

  _binHTML(type, size) {
    const showLbl = this._cfg.show_labels !== false;
    const src     = type.iconUrl || TRASHBIN;
    const filter  = (!type.iconUrl && type.cssFilter) ? `filter:${type.cssFilter};` : '';
    // Label overlaid on the image, just below the lid area (top 36%).
    // Strategy:
    //   - Multi-word names (with spaces): allow 2-line wrap, clamp to 2 lines.
    //   - Single long words (no space, too wide): abbreviate with "." e.g. "Indiffer."
    const _maxCpl = Math.floor(size / 8.5);  // approx chars per line at 13px bold
    const _name   = type.name;
    const _hasSpace = _name.includes(' ');
    const _tooLong  = _name.length > _maxCpl;
    // Single word too long → abbreviate: keep maxCpl-1 chars + "."
    const _display  = (!_hasSpace && _tooLong)
      ? _name.slice(0, _maxCpl - 1) + '.'
      : _name;
    const lbl = showLbl ? `
      <span style="
        position:absolute; top:36%; left:0; right:0;
        font-size:13px; font-weight:700; text-align:center;
        color:#fff; line-height:1.15;
        display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
        overflow:hidden; word-break:break-word;
        padding:0 2px; box-sizing:border-box;
        text-shadow:0 1px 3px rgba(0,0,0,0.85), 0 0 6px rgba(0,0,0,0.6);
        pointer-events:none;
      ">${_display}</span>` : '';

    return `<div class="bin">
      <div style="position:relative;width:${size}px;height:${size}px;flex-shrink:0">
        <img src="${src}" width="${size}" height="${size}"
          style="object-fit:contain;${filter}" title="${type.name}">
        ${lbl}
      </div>
    </div>`;
  }

  _render() {
    const count = this._cfg.days || 5;
    const days  = this._getDays();

    if (count === 1) {
      this._renderSingle(days[0]);
    } else {
      this._renderGrid(days, count);
    }
  }

  // Single-day view (days: 1) — shows one large icon with overlaid text, no background
  _renderSingle(day) {
    const sz    = this._cfg.icon_size || 64;
    const bg    = this._cfg.background || BG_DEFAULT;
    const showT = this._cfg.show_title || this._cfg.show_header;
    const title = this._cfg.title || day?.offsetLabel || 'Today';
    const empty = this._cfg.empty_text || 'No collection';

    if (!day) {
      this.shadowRoot.innerHTML = `
        <ha-card style="background:url('${bg}') center/cover no-repeat;padding:16px;border-radius:var(--ha-card-border-radius,12px)">
          <span style="color:#fff;font-style:italic">${empty}</span>
        </ha-card>`;
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card {
          background: url('${bg}') center/cover no-repeat;
          padding: 12px; box-sizing: border-box;
          border-radius: var(--ha-card-border-radius, 12px);
          overflow: hidden;
        }
        .card-title {
          font-size: 12px; font-weight: 700; letter-spacing: .07em;
          text-transform: uppercase; color: #fff;
          text-shadow: 0 1px 4px rgba(0,0,0,.85); margin-bottom: 8px;
        }
        .row {
          display: flex; flex-wrap: wrap; gap: 10px;
          align-items: flex-end; min-height: ${sz+4}px;
        }
        .bin { display: flex; flex-direction: column; align-items: center; }
        .empty { font-size: 13px; color: rgba(255,255,255,.7); font-style: italic; }
      </style>
      <ha-card>
        ${showT ? `<div class="card-title">${title}</div>` : ''}
        <div class="row">
          ${day.types.length
            ? day.types.map(t => this._binHTML(t, sz)).join('')
            : `<span class="empty">${empty}</span>`}
        </div>
      </ha-card>`;
  }

  // Grid view (days: 2+) — shows multiple columns with day labels and background
  _renderGrid(days, count) {
    const sz      = this._cfg.icon_size || 52;
    const bg      = this._cfg.background || BG_DEFAULT;
    const showTop = this._cfg.show_day_labels !== false;
    const showSub = this._cfg.show_weekday === true;
    const empty   = this._cfg.empty_symbol || '·';
    const ncols   = days.length || count;

    const cols = days.map(day => {
      const top = day.offsetLabel;  // e.g. "Today", "Tomorrow", "in 2 days"…
      const _cw = this._cfg.column_width;
      const _colStyle = _cw ? `style="width:${_cw}px;min-width:${_cw}px;flex:none"` : '';
      return `
        <div class="col" ${_colStyle}>
          ${showTop || showSub ? `<div class="col-head">
            ${showTop ? `<div class="lbl-top">${top}</div>` : ''}
            ${showSub ? `<div class="lbl-sub">${day.short}</div>` : ''}
          </div>` : ''}
          <div class="bins">
            ${day.types.length
              ? day.types.map(t => this._binHTML(t, sz)).join('')
              : `<span class="none">${empty}</span>`}
          </div>
        </div>`;
    }).join('');

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card {
          background: url('${bg}') center/cover no-repeat;
          padding: 8px; overflow: hidden; box-sizing: border-box;
          border-radius: var(--ha-card-border-radius, 12px);
        }
        .card-title {
          font-size: 12px; font-weight: 700; letter-spacing: .07em;
          text-transform: uppercase; color: #fff;
          text-shadow: 0 1px 4px rgba(0,0,0,.85); margin-bottom: 6px;
        }
        .grid {
          display: flex;
          flex-wrap: nowrap;
          gap: 5px;
          align-items: end;
        }
        .col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; min-width: 0; }
        .col-head {
          width: 100%; text-align: center;
          background: rgba(0,0,0,.52); border-radius: 6px; padding: 4px 3px 3px;
          backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px);
        }
        .lbl-top { font-size: 11px; font-weight: 700; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,.9); white-space: nowrap; }
        .lbl-sub { font-size: 9px; color: rgba(255,255,255,.8); text-shadow: 0 1px 2px rgba(0,0,0,.9); }
        .bins { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .bin  { display: flex; flex-direction: column; align-items: center; gap: 3px; }
        .none { font-size: 18px; color: rgba(255,255,255,.3); }
      </style>
      <ha-card>
        ${(this._cfg.show_title || this._cfg.show_header)
          ? `<div class="card-title">${this._cfg.title || 'Waste collection'}</div>`
          : ''}
        <div class="grid">${cols}</div>
      </ha-card>`;
  }

  // Height hint for the masonry view (1 unit ≈ 50 px)
  getCardSize() { return (this._cfg?.days || 5) === 1 ? 2 : 3; }

  // Grid options for the sections view
  getGridOptions() {
    const days = this._cfg?.days || 5;
    return {
      columns    : days <= 3 ? 6 : 12,
      rows       : days === 1 ? 2 : 3,
      min_columns: 3,
      min_rows   : 2,
    };
  }

  static getStubConfig() {
    return {
      calendar        : 'calendar.waste',
      days            : 5,
      show_before     : '09:00:00',
      show_title      : false,
      title           : '',
      show_labels     : true,
      show_day_labels : true,
      show_weekday    : true,
      skip_empty      : true,
      refresh_interval: 300,
      empty_text      : 'No collection',
      empty_symbol    : '·',
      icon_size       : 82,
    };
  }

  static getConfigForm() {
    return {
      schema: [
        // ── Required ────────────────────────────────────────────────────────
        {
          name    : 'calendar',
          required: true,
          selector: { entity: { domain: 'calendar' } },
        },

        // ── Layout ──────────────────────────────────────────────────────────
        {
          type  : 'grid',
          name  : '',
          schema: [
            {
              name    : 'days',
              selector: { number: { min: 1, max: 45, step: 1, mode: 'box' } },
            },
            {
              name    : 'show_before',
              selector: { time: {} },
            },
          ],
        },
        {
          name    : 'background',
          selector: { text: {} },
        },

        // ── Title ────────────────────────────────────────────────────────────
        {
          type   : 'expandable',
          name   : '',
          title  : 'Title',
          flatten: true,
          schema : [
            {
              type  : 'grid',
              name  : '',
              schema: [
                {
                  name    : 'show_title',
                  selector: { boolean: {} },
                },
                {
                  name    : 'title',
                  selector: { text: {} },
                },
              ],
            },
          ],
        },

        // ── Display ──────────────────────────────────────────────────────────
        {
          type   : 'expandable',
          name   : '',
          title  : 'Display options',
          flatten: true,
          schema : [
            {
              type  : 'grid',
              name  : '',
              schema: [
                {
                  name    : 'show_labels',
                  selector: { boolean: {} },
                },
                {
                  name    : 'show_day_labels',
                  selector: { boolean: {} },
                },
                {
                  name    : 'show_weekday',
                  selector: { boolean: {} },
                },
                {
                  name    : 'skip_empty',
                  selector: { boolean: {} },
                },
              ],
            },
          ],
        },

        // ── Empty state ───────────────────────────────────────────────────────
        {
          type   : 'expandable',
          name   : '',
          title  : 'Empty state',
          flatten: true,
          schema : [
            {
              type  : 'grid',
              name  : '',
              schema: [
                {
                  name    : 'empty_text',
                  selector: { text: {} },
                },
                {
                  name    : 'empty_symbol',
                  selector: { text: {} },
                },
              ],
            },
          ],
        },

        // ── Advanced ──────────────────────────────────────────────────────────
        {
          type   : 'expandable',
          name   : '',
          title  : 'Advanced',
          flatten: true,
          schema : [
            {
              type  : 'grid',
              name  : '',
              schema: [
                {
                  name    : 'icon_size',
                  selector: { number: { min: 16, max: 200, step: 1, mode: 'box', unit_of_measurement: 'px' } },
                },
                {
                  name    : 'column_width',
                  selector: { number: { min: 20, max: 400, step: 1, mode: 'box', unit_of_measurement: 'px' } },
                },
                {
                  name    : 'refresh_interval',
                  selector: { number: { min: 10, max: 3600, step: 10, mode: 'box', unit_of_measurement: 's' } },
                },
              ],
            },
          ],
        },
      ],

      computeLabel: (schema) => {
        const labels = {
          calendar        : 'Calendar entity',
          days            : 'Days to show',
          show_before     : 'Show next day after',
          background      : 'Background image path',
          show_title      : 'Show title',
          title           : 'Title text',
          show_labels     : 'Show bin labels',
          show_day_labels : 'Show day labels',
          show_weekday    : 'Show weekday name',
          skip_empty      : 'Skip empty days',
          empty_text      : 'Empty day text (single-day view)',
          empty_symbol    : 'Empty day symbol (grid view)',
          icon_size       : 'Icon size',
          column_width    : 'Fixed column width',
          refresh_interval: 'Refresh interval',
        };
        return labels[schema.name] ?? undefined;
      },

      computeHelper: (schema) => {
        const helpers = {
          calendar        : 'The HA calendar entity to read waste collection events from.',
          days            : '1 = single large icon; 2+ = multi-column grid (default: 5).',
          show_before     : 'After this time, show tomorrow instead of today.',
          background      : `Leave empty to use the default (${BG_DEFAULT}).`,
          title           : 'Shown only when "Show title" is enabled.',
          show_labels     : 'Overlay the event name on each bin icon.',
          show_day_labels : 'Show "Today / Tomorrow / in N days" above each column.',
          show_weekday    : 'Show the short weekday name (Mon, Tue…) below the day label.',
          skip_empty      : 'Skip days with no collection so only busy days fill the columns.',
          empty_text      : 'Text shown in the single-day view when there is no collection.',
          empty_symbol    : 'Symbol shown in a grid column when that day has no collection.',
          icon_size       : 'Override icon size in px. Leave empty for automatic sizing.',
          column_width    : 'Fix each column to this width in px. Leave empty to distribute equally.',
          refresh_interval: 'How often to re-fetch the calendar, in seconds (default: 300).',
        };
        return helpers[schema.name] ?? undefined;
      },

      assertConfig: (config) => {
        if (!config.calendar) {
          throw new Error('"calendar" is required.');
        }
      },
    };
  }
}

customElements.define('ha-separate-garbage-collection-card', HASeparateGarbageCollectionCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type            : 'ha-separate-garbage-collection-card',
  name            : 'Separate Garbage Collection',
  description     : 'Waste collection calendar card.',
  preview         : true,
  documentationURL: 'https://github.com/RedFoxy/HA-Separate-Garbage-Collection',
});