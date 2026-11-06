# Changelog

All notable changes to this project are listed in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [4.1.1] — 2026-11-06

### Fixed
- Bin icons and background were missing after the Home Assistant update that moved HACS into the built-in Marketplace. The card picked its asset folder by looking for `/hacsfiles/` in its own URL. Any other path (the Marketplace, or `/local/community/…` resources from older HACS installs) fell back to the manual-install folder, where `trashbin.svg` and `background.png` return 404. The card now loads its assets from the folder of its own JS file. It finds that folder from the script URL, the error stack or the network entry, so every install path works.
- A bin image that fails to load no longer shows its fallback text over the card (`alt=""`). The bin name is already in the label and the tooltip.
- The card no longer fetches the calendar a second time right after the first load.
- `skip_empty` and `show_weekday` follow the same rule as the other boolean options: only an explicit `false` turns them off.
- When a custom `day_labels` list is shorter than the visible range, the missing labels use the active language instead of fixed English text.
- An event without a title shows a default name in the active language instead of the fixed Italian `Raccolta`.
- The `"calendar" is required.` error is in English for both the YAML and the visual editor.
- README: the base icon is `trashbin.svg`, not `trashcan.svg`. The `custom:garbage-collection-day` and `custom:garbage-collection-week` aliases are gone, because the card never registered them. Broken example links and the colour filter example (`brightness(1.18)`) are fixed.
- `examples/3-days-view.yaml` no longer hard-codes the manual-install background path, so it works with HACS too.
- Event titles, description values (`icon`, `filter`) and YAML texts are HTML-escaped before rendering. A title with `"`, `<` or `&` no longer breaks the card.
- The refresh timer restarts when Home Assistant attaches the card again without a new `hass` update (for example after a view change). Two timers can no longer run at the same time.
- The default config from the visual editor no longer sets `icon_size: 82`. New cards use the automatic size (64 px for `days: 1`, 52 px otherwise), as the documentation says.

### Changed
- Internal refactor with no visible change. Configuration defaults are normalised once in `setConfig`. The single-day and grid views share one CSS block and one render helper. Label shortening lives in one function. Unused code is removed (`CACHE_TTL`, `_fetched`, unused variables). The header comment of the card file is up to date and in English.
- README and CHANGELOG text rewritten in plainer language, in English and Italian.

---

## [4.1.0] — 2026-05-20

### Added
- Days with more than one collection. When a day has two or more collections, the card draws one `trashbin.svg` split into equal `1/N` slices, one per waste type, with the names stacked on the bin. The split follows the real outline of the bin: at its 365:718 aspect ratio the bin fills only the centre of its square box, so each slice is `100/N` % of the bin and not of the empty space around it. Busy days take the room of one bin instead of several side by side.
- New option `merge_same_day` (bool, default `true`). It turns on the behaviour above. Set it to `false` for the old layout, one bin per event, side by side.
- New option `split_direction` (`vertical` | `horizontal`, default `vertical`). `vertical` gives left/right slices, `horizontal` gives top/bottom stripes.
- New option `weekday_format` (`short` | `full`, default `short`). It picks short (`Mon`, `Tue`…) or full (`Monday`, `Tuesday`…) weekday names under each column.
- New option `full_days` (list of 7 strings, optional). It overrides the full weekday names, like `short_days` does for the short ones. Useful for languages that are not bundled when `weekday_format: full`.
- Bundled translations in 12 languages: `en`, `it`, `fr`, `de`, `es`, `pt`, `nl`, `hu`, `ru`, `hi`, `zh`, `ja`. They cover the day labels (`Today` / `Tomorrow` / `in N days`), short and full weekday names, the default card title and the "no collection" text. Russian uses the right plural forms for "day" (`день` / `дня` / `дней`).
- New option `language` (`null` for auto, or one of the bundled codes). With the default `null` the card reads `hass.language` and picks the matching bundle. It reduces tags such as `zh-Hans` to `zh` and `en-US` to `en`, and falls back to `en`. YAML values for `title`, `empty_text`, `day_labels`, `short_days` and `full_days` still win over the bundle.
- The visual editor shows all new options under "Display options".

### Changed
- The bin label font gets smaller as more events are stacked (13, 11, 10, then 9 px, never below 9 px), so the names still fit on one bin. With `icon_size >= 100` the font stays at 13 px whatever the number of events, because large bins have room for full-size labels.
- Events on the same day are drawn in alphabetical order (case- and locale-aware), both inside the merged bin (left to right or top to bottom) and when bins are side by side. Before, the order was whatever the calendar API returned, and it could change between fetches.

### Notes
- The per-event `icon:` field is ignored on merged days. The colour split only works on the plain `trashbin.svg`, so custom icons are skipped when a day has several events. The custom icon still shows on days where that waste type is the only collection. Set `merge_same_day: false` to keep custom icons everywhere.
- Existing configurations without `merge_same_day` get the new behaviour automatically, with no migration. Set `merge_same_day: false` to opt out.

---

## [4.0.2] — 2026-05-19

### Fixed
- HACS install path: the card checks its own script URL at load time to tell whether it runs from `/hacsfiles/HA-Separate-Garbage-Collection/` (HACS) or from `/local/redfoxy/ha-separate-garbage-collection/` (manual install).

---

## [4.0.1]

### Fixed
- Minor fixes.

---

## [4.0.0]

### Added
- First v4 release. The card is now a single-file Lovelace card that reads the Home Assistant calendar REST API directly, with no Python integration, no YAML sensors and no external dependencies. See the [README](README.md) for all features.

---

[4.1.1]: https://github.com/RedFoxy/HA-Separate-Garbage-Collection/releases/tag/v4.1.1
[4.1.0]: https://github.com/RedFoxy/HA-Separate-Garbage-Collection/releases/tag/v4.1.0
[4.0.2]: https://github.com/RedFoxy/HA-Separate-Garbage-Collection/releases/tag/v4.0.2
[4.0.1]: https://github.com/RedFoxy/HA-Separate-Garbage-Collection/releases/tag/v4.0.1
[4.0.0]: https://github.com/RedFoxy/HA-Separate-Garbage-Collection/releases/tag/v4.0.0
