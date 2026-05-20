/**
 * HA Separate Garbage Collection Card
 * v4.1.0 - 20/05/2026
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
 *
 * Multi-event days:
 *   When a day has 2+ events, the bins are merged into a single multi-color bin
 *   split into N equal slices (left/right or top/bottom). The custom `icon:` is
 *   ignored in this case — the default trashbin.svg is used so the color split
 *   stays consistent. Toggle via `merge_same_day` and `split_direction`.
 */

// Dual-path: HACS installs to /hacsfiles/<repo>/, manual install uses the legacy path.
// Detection is based on the URL of this script file at load time.
// Note: document.currentScript is null when the script is loaded as an ES module
// (HA loads Lovelace resources with type="module" by default), so we fall back
// to scanning the DOM for the <script> tag that loaded this card.
const _SCRIPT_SRC = (() => {
  if (document.currentScript && document.currentScript.src) return document.currentScript.src;
  const el = document.querySelector(
    'script[src*="ha-separate-garbage-collection-card"], link[href*="ha-separate-garbage-collection-card"]'
  );
  return el ? (el.src || el.href || '') : '';
})();
const BASE_PATH = _SCRIPT_SRC.includes('/hacsfiles/')
  ? '/hacsfiles/HA-Separate-Garbage-Collection/'   // HACS install
  : '/local/redfoxy/ha-separate-garbage-collection/'; // manual install
const TRASHBIN   = `${BASE_PATH}trashbin.svg`;
const BG_DEFAULT = `${BASE_PATH}background.png`;
// Intrinsic aspect ratio of trashbin.svg (365 wide × 718 tall).
// Used by the multi-color split so each slice equals 1/N of the bin —
// not 1/N of the (square) bounding box, where the bin occupies only a
// centered ~50%-wide strip and outer slices would be mostly empty space.
const TRASHBIN_ASPECT = 365 / 718;

const CACHE_TTL  = 5 * 60 * 1000;
const MAX_AHEAD  = 45;

// Bundled translations. Each language exposes:
//   today           — label for the current day
//   tomorrow        — label for day +1
//   in_n_days(n)    — template function for day +N (handles plural forms where the
//                     language requires it, e.g. Russian)
//   short_days[7]   — Sun → Sat
//   full_days[7]    — Sun → Sat
//   title           — default card title (shown when show_title:true and title is blank)
//   no_collection   — default empty_text for the single-day view
//
// Selection logic (see _currentLang): explicit `language:` config wins, otherwise
// the card reads `hass.language` (normalised to the base tag — "zh-Hans" → "zh",
// "en-US" → "en"), and falls back to `en` if no match. Per-string overrides in YAML
// (title, empty_text, day_labels, short_days, full_days) always win over the bundle.
const I18N = {
  en: {
    today: 'Today',
    tomorrow: 'Tomorrow',
    in_n_days: (n) => `in ${n} days`,
    short_days: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
    full_days: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    title: 'Waste collection',
    no_collection: 'No collection',
  },
  it: {
    today: 'Oggi',
    tomorrow: 'Domani',
    in_n_days: (n) => `Tra ${n} giorni`,
    short_days: ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'],
    full_days: ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'],
    title: 'Raccolta differenziata',
    no_collection: 'Nessuna raccolta',
  },
  fr: {
    today: "Aujourd'hui",
    tomorrow: 'Demain',
    in_n_days: (n) => `Dans ${n} jours`,
    short_days: ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'],
    full_days: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
    title: 'Collecte des déchets',
    no_collection: 'Pas de collecte',
  },
  de: {
    today: 'Heute',
    tomorrow: 'Morgen',
    in_n_days: (n) => `In ${n} Tagen`,
    short_days: ['So','Mo','Di','Mi','Do','Fr','Sa'],
    full_days: ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'],
    title: 'Müllabfuhr',
    no_collection: 'Keine Abholung',
  },
  es: {
    today: 'Hoy',
    tomorrow: 'Mañana',
    in_n_days: (n) => `En ${n} días`,
    short_days: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
    full_days: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
    title: 'Recogida de residuos',
    no_collection: 'Sin recogida',
  },
  pt: {
    today: 'Hoje',
    tomorrow: 'Amanhã',
    in_n_days: (n) => `Em ${n} dias`,
    short_days: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
    full_days: ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'],
    title: 'Coleta de lixo',
    no_collection: 'Sem coleta',
  },
  nl: {
    today: 'Vandaag',
    tomorrow: 'Morgen',
    in_n_days: (n) => `Over ${n} dagen`,
    short_days: ['Zo','Ma','Di','Wo','Do','Vr','Za'],
    full_days: ['Zondag','Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag'],
    title: 'Afvalinzameling',
    no_collection: 'Geen inzameling',
  },
  hu: {
    today: 'Ma',
    tomorrow: 'Holnap',
    in_n_days: (n) => `${n} nap múlva`,
    short_days: ['Vas','Hét','Ke','Sze','Csü','Pén','Szo'],
    full_days: ['Vasárnap','Hétfő','Kedd','Szerda','Csütörtök','Péntek','Szombat'],
    title: 'Hulladékgyűjtés',
    no_collection: 'Nincs gyűjtés',
  },
  ru: {
    today: 'Сегодня',
    tomorrow: 'Завтра',
    // Russian plurals: 1 → "день", 2-4 → "дня", 5+ → "дней" (with exceptions on -11/-14)
    in_n_days: (n) => {
      const mod10 = n % 10, mod100 = n % 100;
      if (mod10 === 1 && mod100 !== 11) return `Через ${n} день`;
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `Через ${n} дня`;
      return `Через ${n} дней`;
    },
    short_days: ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],
    full_days: ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'],
    title: 'Вывоз мусора',
    no_collection: 'Сбора нет',
  },
  hi: {
    today: 'आज',
    tomorrow: 'कल',
    in_n_days: (n) => `${n} दिनों में`,
    short_days: ['रवि','सोम','मंगल','बुध','गुरु','शुक्र','शनि'],
    full_days: ['रविवार','सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'],
    title: 'कचरा संग्रहण',
    no_collection: 'कोई संग्रह नहीं',
  },
  zh: {
    today: '今天',
    tomorrow: '明天',
    in_n_days: (n) => `${n}天后`,
    short_days: ['日','一','二','三','四','五','六'],
    full_days: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
    title: '垃圾分类收集',
    no_collection: '无收集',
  },
  ja: {
    today: '今日',
    tomorrow: '明日',
    in_n_days: (n) => `${n}日後`,
    short_days: ['日','月','火','水','木','金','土'],
    full_days: ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'],
    title: 'ごみ収集',
    no_collection: '収集なし',
  },
};

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
      title            : null,    // card title text — falls back to the localised default
      show_labels      : true,    // show garbage type name overlaid on the bin
      show_day_labels  : true,    // show the day-offset label (Today / Tomorrow / in N days…)
      show_weekday     : true,    // show the weekday name below the offset label
      weekday_format   : 'short', // 'short' (Mon, Tue…) | 'full' (Monday, Tuesday…)
      language         : null,    // force a language code (e.g. 'it'); null = auto from hass.language
      day_labels       : null,    // override offset labels — auto-generated if null
                                  //   auto: localised "Today/Tomorrow/in N days"
      short_days       : null,    // override short weekday names (7 entries, Sun–Sat)
      full_days        : null,    // override full weekday names (7 entries, Sun–Sat)
      skip_empty       : true,    // skip days with no collection
      refresh_interval : 300,     // seconds between calendar re-fetches
      icon_size        : null,    // px — auto-sized based on days count if null
      column_width     : null,    // px — fixed column width; null = distribute equally (1fr)
      empty_text       : null,    // single-day "no collection" text — falls back to localised default
      empty_symbol     : '·',
      merge_same_day   : true,        // merge 2+ events into a single multi-color bin
      split_direction  : 'vertical',  // 'vertical' (left/right) | 'horizontal' (top/bottom)
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
      // Sort each day's events alphabetically by name so the rendering order is
      // deterministic (left→right or top→bottom in the multi-color bin, and
      // left→right when bins are shown side by side).
      for (const ds in this._cache) {
        this._cache[ds].sort((a, b) => a.name.localeCompare(b.name));
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

  // Resolves the active language. Priority: explicit `language:` config →
  // `hass.language` (normalised to its base tag) → 'en' fallback.
  _currentLang() {
    const forced = this._cfg.language;
    if (forced && I18N[forced]) return forced;
    const haLang = this._hass?.language || this._hass?.selectedLanguage || 'en';
    const base   = String(haLang).toLowerCase().split('-')[0];
    return I18N[base] ? base : 'en';
  }

  // Returns the bundled translation object for the active language.
  _i18n() {
    return I18N[this._currentLang()] || I18N.en;
  }

  // Returns offset labels: [today, tomorrow, "in 2 days", …] — auto or user-defined
  _dayLabels() {
    if (Array.isArray(this._cfg.day_labels) && this._cfg.day_labels.length) {
      return this._cfg.day_labels;
    }
    const t = this._i18n();
    const out = [t.today, t.tomorrow];
    for (let i = 2; i < MAX_AHEAD; i++) out.push(t.in_n_days(i));
    return out;
  }

  // Returns short weekday names (Sun–Sat) — user-overridable via short_days config
  _shortDays() {
    if (Array.isArray(this._cfg.short_days) && this._cfg.short_days.length === 7) {
      return this._cfg.short_days;
    }
    return this._i18n().short_days;
  }

  // Returns full weekday names (Sun–Sat) — user-overridable via full_days config
  _fullDays() {
    if (Array.isArray(this._cfg.full_days) && this._cfg.full_days.length === 7) {
      return this._cfg.full_days;
    }
    return this._i18n().full_days;
  }

  // Day selection — skips empty days when skip_empty is true
  _getDays() {
    const count  = this._cfg.days || 5;
    const skip   = this._cfg.skip_empty !== false;
    const target = this._targetDate();
    const result = [];
    let offset   = 0;

    const shortNames = this._shortDays();
    const fullNames  = this._fullDays();
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
          full       : fullNames[d.getDay()],
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

  // Dispatcher: when merge_same_day is on and the day has 2+ events,
  // produce a single multi-color bin; otherwise fall back to N separate bins.
  _binsForDay(types, size) {
    if (this._cfg.merge_same_day !== false && types.length >= 2) {
      return this._multiBinHTML(types, size);
    }
    return types.map(t => this._binHTML(t, size)).join('');
  }

  // Multi-color bin: stacks N copies of the default trashbin.svg, each clipped
  // to its own vertical or horizontal slice and tinted with the event's CSS filter.
  // Custom per-event icons are intentionally ignored — the split only works on the
  // default monochrome SVG.
  _multiBinHTML(types, size) {
    const dir   = this._cfg.split_direction === 'horizontal' ? 'h' : 'v';
    const n     = types.length;
    const src   = TRASHBIN;
    const showLbl = this._cfg.show_labels !== false;

    // With object-fit:contain in a square box, the trashbin (aspect 365:718)
    // fills the full height but only a centered ~50%-wide strip horizontally.
    // For vertical splits we therefore clip the bin's actual horizontal range
    // so each slice equals 1/N of the bin (not 1/N of the box, which would
    // make outer slices mostly empty space). For horizontal splits the bin
    // fills the full height, so the 0-100% range is correct.
    const binStartPct = dir === 'v' ? (1 - TRASHBIN_ASPECT) / 2 * 100 : 0;
    const binEndPct   = dir === 'v' ? (1 + TRASHBIN_ASPECT) / 2 * 100 : 100;
    const binSpan     = binEndPct - binStartPct;

    const layers = types.map((t, i) => {
      const startPct = binStartPct + (i     / n) * binSpan;
      const endPct   = 100 - (binStartPct + ((i + 1) / n) * binSpan);
      const clip = dir === 'v'
        ? `inset(0 ${endPct}% 0 ${startPct}%)`
        : `inset(${startPct}% 0 ${endPct}% 0)`;
      const filter = t.cssFilter ? `filter:${t.cssFilter};` : '';
      return `<img src="${src}" width="${size}" height="${size}" alt=""
        style="position:absolute;inset:0;object-fit:contain;clip-path:${clip};${filter}">`;
    }).join('');

    const labels = showLbl ? this._stackedLabelsHTML(types, size) : '';
    const tip    = types.map(t => t.name).join(' / ');

    return `<div class="bin">
      <div style="position:relative;width:${size}px;height:${size}px;flex-shrink:0"
           title="${tip}">
        ${layers}
        ${labels}
      </div>
    </div>`;
  }

  // Stacked labels for the multi-color bin: one <span> per event, vertically stacked,
  // positioned over the body of the bin (top:36%) — same anchor as the single-event label.
  // Font size: stays at the regular 13px when the bin is large enough (size >= 100px),
  // otherwise shrinks gracefully as event count grows so multi-event labels stay legible
  // on smaller bins. Single-line with ellipsis.
  _stackedLabelsHTML(types, size) {
    const maxCpl = Math.floor(size / 8.5);
    const fontPx = size >= 100
      ? 13
      : Math.max(9, Math.round(13 - (types.length - 1) * 1.5));

    const items = types.map(t => {
      const hasSpace = t.name.includes(' ');
      const tooLong  = t.name.length > maxCpl;
      const display  = (!hasSpace && tooLong)
        ? t.name.slice(0, maxCpl - 1) + '.'
        : t.name;
      return `<span style="
        display:block;
        font-size:${fontPx}px; font-weight:700; line-height:1.1;
        overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
        padding:0 2px;
      ">${display}</span>`;
    }).join('');

    return `<div style="
      position:absolute; top:36%; left:0; right:0;
      text-align:center; color:#fff;
      text-shadow:0 1px 3px rgba(0,0,0,0.85), 0 0 6px rgba(0,0,0,0.6);
      pointer-events:none;
      display:flex; flex-direction:column; gap:1px;
      box-sizing:border-box;
    ">${items}</div>`;
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
    const t     = this._i18n();
    const title = this._cfg.title || day?.offsetLabel || t.today;
    const empty = this._cfg.empty_text || t.no_collection;

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
            ? this._binsForDay(day.types, sz)
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

    const useFullWeekday = this._cfg.weekday_format === 'full';

    const cols = days.map(day => {
      const top = day.offsetLabel;  // e.g. "Today", "Tomorrow", "in 2 days"…
      const wd  = useFullWeekday ? day.full : day.short;
      const _cw = this._cfg.column_width;
      const _colStyle = _cw ? `style="width:${_cw}px;min-width:${_cw}px;flex:none"` : '';
      return `
        <div class="col" ${_colStyle}>
          ${showTop || showSub ? `<div class="col-head">
            ${showTop ? `<div class="lbl-top">${top}</div>` : ''}
            ${showSub ? `<div class="lbl-sub">${wd}</div>` : ''}
          </div>` : ''}
          <div class="bins">
            ${day.types.length
              ? this._binsForDay(day.types, sz)
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
          ? `<div class="card-title">${this._cfg.title || this._i18n().title}</div>`
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
      show_labels     : true,
      show_day_labels : true,
      show_weekday    : true,
      skip_empty      : true,
      refresh_interval: 300,
      empty_symbol    : '·',
      icon_size       : 82,
      merge_same_day  : true,
      split_direction : 'vertical',
      weekday_format  : 'short',
      // language: null  → auto-detect from hass.language
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
                {
                  name    : 'merge_same_day',
                  selector: { boolean: {} },
                },
                {
                  name    : 'split_direction',
                  selector: { select: { mode: 'dropdown', options: [
                    { value: 'vertical',   label: 'Vertical (left/right)' },
                    { value: 'horizontal', label: 'Horizontal (top/bottom)' },
                  ] } },
                },
                {
                  name    : 'weekday_format',
                  selector: { select: { mode: 'dropdown', options: [
                    { value: 'short', label: 'Short (Mon, Tue…)' },
                    { value: 'full',  label: 'Full (Monday, Tuesday…)' },
                  ] } },
                },
                {
                  name    : 'language',
                  selector: { select: { mode: 'dropdown', options: [
                    { value: '',   label: 'Auto (from Home Assistant)' },
                    { value: 'en', label: 'English' },
                    { value: 'it', label: 'Italiano' },
                    { value: 'fr', label: 'Français' },
                    { value: 'de', label: 'Deutsch' },
                    { value: 'es', label: 'Español' },
                    { value: 'pt', label: 'Português' },
                    { value: 'nl', label: 'Nederlands' },
                    { value: 'hu', label: 'Magyar' },
                    { value: 'ru', label: 'Русский' },
                    { value: 'hi', label: 'हिन्दी' },
                    { value: 'zh', label: '中文' },
                    { value: 'ja', label: '日本語' },
                  ] } },
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
          merge_same_day  : 'Merge same-day events',
          split_direction : 'Split direction',
          weekday_format  : 'Weekday name format',
          language        : 'Language',
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
          merge_same_day  : 'Combine multiple events on the same day into a single multi-color bin.',
          split_direction : 'How the multi-color bin is divided when merging same-day events.',
          weekday_format  : 'Short (Mon, Tue…) or full (Monday, Tuesday…) name shown under each day. Localise via short_days / full_days.',
          language        : 'Force the UI language. Leave on "Auto" to follow the Home Assistant interface language. Per-string overrides in YAML still win.',
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