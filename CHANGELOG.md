# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [4.1.0] — 2026-05-20

### Added
- **Multi-event day rendering.** When a day has 2 or more collections, the bins are merged into a single multi-colour `trashcan.svg` split into equal `1/N` slices — one per waste type — with the event names stacked over the body of the bin. The split is calibrated to the actual silhouette of the bin (which, at the default aspect ratio of 365:718, only fills the centre of its square bounding box), so each slice always shows exactly `100/N` % of the bin itself — not of the empty surrounding box. Makes busy days visually compact instead of cluttered with side-by-side bins.
- New config option **`merge_same_day`** (bool, default `true`). Enables the merge behaviour described above. Set to `false` to keep the legacy behaviour (one bin per event, side by side).
- New config option **`split_direction`** (`vertical` | `horizontal`, default `vertical`). Controls how the multi-colour bin is divided: `vertical` = left/right slices, `horizontal` = top/bottom stripes.
- New config option **`weekday_format`** (`short` | `full`, default `short`). Choose between short (`Mon`, `Tue`…) and full (`Monday`, `Tuesday`…) weekday names under each day column.
- New config option **`full_days`** (list of 7 strings, optional). Override the full weekday names just like the existing `short_days` — useful for non-English locales when `weekday_format: full`.
- **Bundled translations**. The card now ships 12 built-in languages — `en`, `it`, `fr`, `de`, `es`, `pt`, `nl`, `hu`, `ru`, `hi`, `zh`, `ja` — covering day labels (`Today` / `Tomorrow` / `in N days`), short and full weekday names, default card title, and the "no collection" placeholder. Russian uses correct plural forms for "day" (`день` / `дня` / `дней`).
- New config option **`language`** (`null` = auto, or one of the bundled codes). Defaults to `null`, which makes the card read `hass.language` and pick the matching bundle (normalising tags like `zh-Hans` → `zh` and `en-US` → `en`, falling back to `en`). YAML overrides like `title`, `empty_text`, `day_labels`, `short_days`, `full_days` still take precedence over the bundle.
- All new options exposed in the visual config editor under "Display options".

### Changed
- Bin label rendering scales the font size based on the number of stacked events (13 → 11 → 10 → 9 px, clamped at 9 px) so multi-event labels stay legible on the same bin. **When `icon_size >= 100`** the font stays at the regular 13 px regardless of how many events are stacked — large bins have enough vertical room for full-size labels.
- Same-day events are now rendered in deterministic **alphabetical order** (case- and locale-aware), both inside the multi-colour bin (left→right or top→bottom) and when bins are shown side by side. Previously the order followed whatever the calendar API returned, which could change between fetches.

### Notes
- The per-event **`icon:`** field is ignored on merged days. The colour split only works on the default monochrome `trashcan.svg`, so custom icons are skipped when a day has multiple events. The custom icon still shows on days where that waste type is the only collection. To keep custom icons everywhere, set `merge_same_day: false`.
- Existing configurations without `merge_same_day` get the new behaviour by default — no migration required. Opt out with `merge_same_day: false`.

---

## [4.0.2] — 2026-05-19

### Fixed
- HACS install path resolution: the card now correctly detects whether it's being served from `/hacsfiles/HA-Separate-Garbage-Collection/` (HACS install) or `/local/redfoxy/ha-separate-garbage-collection/` (manual install) by inspecting its own script URL at load time.

---

## [4.0.1]

### Fixed
- Minor fixes.

---

## [4.0.0]

### Added
- Initial v4 release — rewritten as a single-file Lovelace card that reads directly from the Home Assistant calendar REST API, with no Python integration, no YAML sensors and no external dependencies. See the [README](README.md) for the full feature set.

---

[4.1.0]: https://github.com/RedFoxy/HA-Separate-Garbage-Collection/releases/tag/v4.1.0
[4.0.2]: https://github.com/RedFoxy/HA-Separate-Garbage-Collection/releases/tag/v4.0.2
[4.0.1]: https://github.com/RedFoxy/HA-Separate-Garbage-Collection/releases/tag/v4.0.1
[4.0.0]: https://github.com/RedFoxy/HA-Separate-Garbage-Collection/releases/tag/v4.0.0
