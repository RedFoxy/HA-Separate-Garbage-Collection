# HA Separate Garbage Collection Card

> A Lovelace custom card for Home Assistant that displays your waste collection schedule directly from a calendar — no Python, no custom integration required.

[![HACS Custom][hacs-badge]][hacs-url]
[![License: GNU3.0][license-badge]][license-url]
![version](https://img.shields.io/badge/version-4.0.0-green)
![release date](https://img.shields.io/badge/relese%20date-19%2F05%2F2026-blue)

This is a fork of [Raccolta differenziata](https://hassiohelp.eu/2019/03/17/raccolta-differenziata/) created by Enrico & Caio on [HassioHelp](https://hassiohelp.eu), from which only a redesigned version of the background and trash bin remain.

<a href="https://paypal.me/redfoxydarrest" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

---

## 🇬🇧 English · [🇮🇹 Italiano](#-italiano)

---

## What it does

[![Example of 5-days-en.yaml's card](/examples/images/five-days-en.png)](/examples/5-days-en.yaml)

The card reads events from any Home Assistant calendar (Local Calendar, Google Calendar, CalDAV…) and displays upcoming garbage collection days as coloured bin icons.

- **One card, one parameter** — `days: 1` for a single-day view, `days: 5` for a 5-column view, any number in between or beyond
- **Zero dependencies** — reads the HA calendar REST API directly from the browser; no custom integration, no Python, no YAML sensors
- **Auto-coloured icons** — set `color: #4CAF50` in the calendar event description and the bin icon is automatically tinted to that colour using CSS filters calibrated to the base SVG colours (`#f68b22`)
- **Custom icons** — use `icon: filename.png` to show a completely custom image per waste type
- **Skip empty days** — with `skip_empty: true` (default) days with no collection are silently skipped; the card always shows the next N days _that have something to collect_
- **Smart label** — the waste type name is overlaid on the bin image just below the lid; multi-word names wrap to two lines; single long words are abbreviated (e.g. `Indiffer.`)
- **Day-change logic** — `show_before` defines a daily cut-off time. Before that time the card shows today's collection; after it, tomorrow's — so in the evening you always see what to prepare for the next morning
- **Fully translatable** — override day labels, short weekday names and all UI strings directly in the card YAML

---

## Requirements

| Requirement | Notes |
|---|---|
| Home Assistant ≥ 2023.4 | Needs the calendar REST endpoint |
| A calendar integration | Built-in **Local Calendar** works perfectly |
| `trashcan.svg` | Base bin icon — place in the folder below |
| `background.png` | Card background image — same folder |

Default asset folder: `/config/www/redfoxy/ha-separate-garbage-collection/`

---

## Installation

### Via HACS (recommended)

1. Open HACS → **Frontend**
2. Click ⋮ → **Custom repositories**
3. Add `https://github.com/RedFoxy/HA-Separate-Garbage-Collection` — category **Lovelace**
4. Click **Download**
5. Reload your browser

### Manual

1. Copy `ha-separate-garbage-collection-card.js`, `trashcan.svg` and `background.png` to `/config/www/redfoxy/ha-separate-garbage-collection/`
2. In HA go to **Settings → Dashboards → ⋮ → Resources → Add resource**

[![Lovelace Resources](https://my.home-assistant.io/badges/lovelace_resources.svg)](https://my.home-assistant.io/redirect/lovelace_dashboards/)

   - URL: `/local/redfoxy/ha-separate-garbage-collection/ha-separate-garbage-collection-card.js`
   - Type: **JavaScript module**
3. Hard-reload the browser (`Ctrl + Shift + R`)

---

## Setting up the calendar

### 1. Create a Local Calendar

Go to **Settings → Integrations → Add integration → Local Calendar**.  
Give it a name (e.g. `Waste`). HA will create entity `calendar.waste`.

### 2. Add recurring events

Open the **Calendar** view in HA sidebar and add one **all-day recurring event** for each waste type.

| Field | What to enter |
|---|---|
| **Title** | Waste type name — shown on the card (e.g. `Wet waste`, `Paper`, `Glass`) |
| **All day** | ✅ Yes |
| **Recurrence** | Weekly / bi-weekly / monthly as needed |
| **Description** | Metadata (see format below) |

**Event description format** (one property per line):

```
color: #4CAF50
icon: wet.png
filter: hue-rotate(92deg) saturate(42%) brightness(1.07)
```

| Key | Required | Description |
|---|---|---|
| `color` | ✅ | HEX colour used to tint `trashcan.svg` automatically |
| `icon` | ❌ | Custom image filename (in `BASE_PATH`) or absolute path starting with `/` |
| `filter` | ❌ | Manual CSS filter override — skips auto-computation |

> **Note:** if `icon` is omitted, the card displays `trashcan.svg` tinted with a CSS filter computed from `color`. The filter is calibrated to the base SVG palette (`#f68b22`).

---

## Card options

### Card type

```yaml
type: custom:ha-separate-garbage-collection-card
```

Backward-compatible aliases: `custom:garbage-collection-day`, `custom:garbage-collection-week`.

### Full option reference

| Option | Type | Default | Description |
|---|---|---|---|
| `calendar` | string | **required** | Calendar entity ID (e.g. `calendar.waste`) |
| `days` | number | `5` | Number of days / columns. `1` = single-day layout with larger icons |
| `background` | string | `…/background.png` | Background image URL |
| `show_before` | string | `"09:00"` | Cut-off time `HH:MM`. Before → show today; at or after → show tomorrow |
| `show_title` | bool | `false` | Show the card title bar |
| `title` | string | `"Waste collection"` | Card title text (only shown when `show_title: true`) |
| `show_labels` | bool | `true` | Overlay the waste type name on the bin icon |
| `show_day_labels` | bool | `true` | Show the day-offset label (Today / Tomorrow / in N days…) |
| `show_weekday` | bool | `true` | Show short weekday name (Mon, Tue…) below the offset label |
| `day_labels` | list | auto | Override day-offset labels (auto: Today, Tomorrow, in 2 days…) |
| `short_days` | list | English | Override short weekday names — exactly 7 entries, Sun → Sat |
| `skip_empty` | bool | `true` | Skip days without a collection event |
| `refresh_interval` | number | `300` | Seconds between calendar refreshes (minimum: 10) |
| `icon_size` | number | auto | Bin icon size in px (auto: 64 for `days:1`, 52 otherwise) |
| `column_width` | number | auto | Fixed column width in px. When set, each column is exactly that wide; without it columns share the available space equally |
| `empty_text` | string | `"No collection"` | Text shown in single-day view when no collection is found |
| `empty_symbol` | string | `"·"` | Symbol in empty columns (multi-day view) |

---

## Examples

### Minimal — 5-days view

```yaml
type: custom:ha-separate-garbage-collection-card
calendar: calendar.waste
```

[![Minimal — 5-days view](/examples/images/minimal-5-days-view.png)](/examples/minimal-5-days-view.yaml)

---

### Single day — large icons

```yaml
type: custom:ha-separate-garbage-collection-card
calendar: calendar.waste
days: 1
icon_size: 80
```

[![Single day — large icons](/examples/images/single-card.png)](/examples/single-card.yaml)

---

### 3-day view

```yaml
type: custom:ha-separate-garbage-collection-card
calendar: calendar.waste
days: 3
background: /local/redfoxy/ha-separate-garbage-collection/background.png
```

[![3-day view](/examples/images/3-days-view.png)](/examples/3-days-view.yaml)

---

### With title, no weekday row

```yaml
type: custom:ha-separate-garbage-collection-card
calendar: calendar.waste
days: 5
show_title: true
title: "This week's collections"
show_weekday: false
```

[![With title, no weekday row](/examples/images/with-title-no-weekday-row.png)](/examples/with-title-no-weekday-row.yaml)

---

### 7 days, slow refresh, larger icons

```yaml
type: custom:ha-separate-garbage-collection-card
calendar: calendar.waste
days: 7
icon_size: 60
refresh_interval: 3600
show_weekday: true
```

[![7 days, slow refresh, larger icons](/examples/images/7-days-slow-refresh-larger-icons.png)](/examples/7-days-slow-refresh-larger-icons.yaml)

---

### Fixed column width

```yaml
type: custom:ha-separate-garbage-collection-card
calendar: calendar.waste
days: 4
column_width: 110
```

[![Fixed column width](/examples/images/fixed-column-width.png)](/examples/fixed-column-width.yaml)

---

### Italian translation

```yaml
type: custom:ha-separate-garbage-collection-card
calendar: calendar.waste
days: 5
empty_text: "Nessuna raccolta"
empty_symbol: "—"
day_labels:
  - "Oggi"
  - "Domani"
  - "Tra 2 giorni"
  - "Tra 3 giorni"
  - "Tra 4 giorni"
short_days:
  - "Dom"
  - "Lun"
  - "Mar"
  - "Mer"
  - "Gio"
  - "Ven"
  - "Sab"
```

[![Italian translation](/examples/images/italian-translation.png)](/examples/italian-translation.yaml)

---

### French translation

```yaml
type: custom:ha-separate-garbage-collection-card
calendar: calendar.waste
days: 5
empty_text: "Pas de collecte"
day_labels:
  - "Aujourd'hui"
  - "Demain"
  - "Dans 2 j."
  - "Dans 3 j."
  - "Dans 4 j."
short_days:
  - "Dim"
  - "Lun"
  - "Mar"
  - "Mer"
  - "Jeu"
  - "Ven"
  - "Sam"
```

[![French translation](/examples/images/french-translation.png)](/examples/french-translation.yaml)

---

### Calendar event examples

**Wet waste — every Monday, Thursday, Saturday:**
```
Title:        Wet waste
All day:      ✅
Recurrence:   Weekly on Mon, Thu, Sat
Description:
  color: #4CAF50
```

**Paper and cardboard — every Tuesday:**
```
Title:        Paper
All day:      ✅
Recurrence:   Weekly on Tue
Description:
  color: #2196F3
```

![Paper and cardboard — every Tuesday](/examples//images/calendar-example.png)

**Plastic — every Wednesday:**
```
Title:        Plastic
All day:      ✅
Recurrence:   Weekly on Wed
Description:
  color: #FF9800
```

**Glass — every other Monday:**
```
Title:        Glass
All day:      ✅
Recurrence:   Every 2 weeks on Mon
Description:
  color: #8BC34A
```

**Residual waste — every Friday:**
```
Title:        Residual
All day:      ✅
Recurrence:   Weekly on Fri
Description:
  color: #9E9E9E
```

**Garden waste — every other Saturday, custom icon:**
```
Title:        Garden
All day:      ✅
Recurrence:   Every 2 weeks on Sat
Description:
  color: #795548
  icon: garden.png
```

![Wet waste and Glass - every Monday](/examples//images/calendar-with-custom-icon.png)

---

## How `show_before` works

The card has a built-in daily flip: before `show_before` it treats **today** as day 0; at or after it treats **tomorrow** as day 0. This way you always see what needs to go out next.

| Time | `show_before: "09:00"` | Day 0 |
|---|---|---|
| 07:30 | 09:00 | **Today** (collection still coming) |
| 09:01 | 09:00 | **Tomorrow** (today's pickup is done — prepare for tonight) |
| 22:00 | 09:00 | **Tomorrow** |

---

## File structure

```
/config/www/redfoxy/ha-separate-garbage-collection/
├── ha-separate-garbage-collection-card.js   ← Lovelace card (this file)
├── trashcan.svg                 ← base bin icon  (base colour: #f68b22)
├── background.png               ← card background image
└── *.png / *.svg                ← optional custom icons per waste type
```

---

## Colour system

The CSS filter is auto-calibrated to the SVG base colours:

| Part | Colour |
|---|---|
| Body | `#f68b22` |
| Dark detail | `#f07525` |
| Shadow | `#c15a28` |
| Highlight | `#fcb315` |

Setting `color: #2196F3` in the event description automatically produces  
`hue-rotate(177deg) saturate(98%) brightness(0.98)` — no manual tuning needed.

For complete control, set `filter:` directly in the description.

---

# 🇮🇹 Italiano

> Card Lovelace per Home Assistant che mostra il calendario della raccolta differenziata — senza Python, senza integrazioni custom.

---

## Cosa fa

[![Esempio della card 5-days-it.yaml](/examples/images/five-days-it.png)](/examples/5-days-it.yaml)

La card legge gli eventi da qualsiasi calendario di Home Assistant (Local Calendar, Google Calendar, CalDAV…) e mostra i prossimi giorni di raccolta come cestini colorati.

- **Una card, un parametro** — `days: 1` per la vista giornaliera, `days: 5` per 5 colonne, qualsiasi numero
- **Zero dipendenze** — legge direttamente la REST API del calendario di HA; niente Python, niente sensori YAML
- **Colorazione automatica** — scrivi `color: #4CAF50` nella descrizione dell'evento e il cestino viene tinto automaticamente con un filtro CSS calibrato sui colori base del SVG
- **Icone personalizzate** — usa `icon: nomefile.png` per mostrare un'immagine diversa per ogni tipo di rifiuto
- **Salta i giorni vuoti** — con `skip_empty: true` (default) i giorni senza raccolta vengono saltati silenziosamente; la card mostra sempre i prossimi N giorni _con qualcosa da portare fuori_
- **Etichetta intelligente** — il nome del tipo di rifiuto è sovrapposto sull'immagine del cestino, appena sotto il coperchio; i nomi con spazi vanno a capo su due righe; le parole singole troppo lunghe vengono abbreviate (es. `Indiffer.`)
- **Logica cambio giorno** — `show_before` definisce un orario di taglio giornaliero. Prima di quell'ora la card mostra la raccolta di oggi; dopo, quella di domani — così la sera vedi sempre cosa preparare
- **Completamente traducibile** — sostituisci le label dei giorni, i nomi brevi dei giorni della settimana e tutte le stringhe UI direttamente nel YAML della card

---

## Requisiti

| Requisito | Note |
|---|---|
| Home Assistant ≥ 2023.4 | Endpoint REST calendario |
| Un'integrazione calendario | **Local Calendar** integrato funziona perfettamente |
| `trashcan.svg` | Icona cestino base — mettila nella cartella indicata sotto |
| `background.png` | Sfondo della card — stessa cartella |

Cartella asset predefinita: `/config/www/redfoxy/ha-separate-garbage-collection/`

---

## Installazione

### Tramite HACS (consigliato)

1. Apri HACS → **Frontend**
2. Clicca ⋮ → **Repository personalizzati**
3. Aggiungi `https://github.com/RedFoxy/HA-Separate-Garbage-Collection` — categoria **Lovelace**
4. Clicca **Scarica**
5. Ricarica il browser

### Manuale

1. Copia `ha-separate-garbage-collection-card.js`, `trashcan.svg` e `background.png` in `/config/www/redfoxy/ha-separate-garbage-collection/`
2. In HA vai su **Impostazioni → Dashboard → ⋮ → Risorse → Aggiungi risorsa**
   - URL: `/local/redfoxy/ha-separate-garbage-collection/ha-separate-garbage-collection-card.js`
   - Tipo: **Modulo JavaScript**

[![Lovelace Resources](https://my.home-assistant.io/badges/lovelace_resources.svg)](https://my.home-assistant.io/redirect/lovelace_dashboards/)

3. Forza il refresh del browser (`Ctrl + Shift + R`)

---

## Configurare il calendario

### 1. Crea un calendario locale

Vai su **Impostazioni → Integrazioni → Aggiungi integrazione → Local Calendar**.  
Dagli un nome (es. `Spazzatura`). HA creerà l'entità `calendar.waste`.

### 2. Aggiungi gli eventi ricorrenti

Apri la vista **Calendario** nella barra laterale di HA e aggiungi un **evento tutto-il-giorno ricorrente** per ogni tipo di rifiuto.

| Campo | Cosa inserire |
|---|---|
| **Titolo** | Nome del tipo di rifiuto — viene mostrato sulla card (es. `Umido`, `Carta`, `Vetro`) |
| **Tutto il giorno** | ✅ Sì |
| **Ricorrenza** | Settimanale / bisettimanale / mensile in base al tuo Comune |
| **Descrizione** | Metadati (vedi formato sotto) |

**Formato descrizione evento** (una proprietà per riga):

```
color: #4CAF50
icon: umido.png
filter: hue-rotate(92deg) saturate(42%) brightness(1.07)
```

| Chiave | Obbligatorio | Descrizione |
|---|---|---|
| `color` | ✅ | Colore HEX per tingere `trashcan.svg` automaticamente |
| `icon` | ❌ | Nome file immagine personalizzata (in `BASE_PATH`) o path assoluto che inizia con `/` |
| `filter` | ❌ | Override manuale del filtro CSS — salta il calcolo automatico |

---

## Opzioni della card

### Tipo card

```yaml
type: custom:ha-separate-garbage-collection-card
```

Alias retrocompatibili: `custom:garbage-collection-day`, `custom:garbage-collection-week`.

### Tutte le opzioni

| Opzione | Tipo | Default | Descrizione |
|---|---|---|---|
| `calendar` | stringa | **obbligatorio** | Entity ID del calendario (es. `calendar.waste`) |
| `days` | numero | `5` | Numero di giorni/colonne. `1` = vista giornaliera con icone grandi |
| `background` | stringa | `…/background.png` | URL dell'immagine di sfondo |
| `show_before` | stringa | `"09:00"` | Orario di cambio `HH:MM`. Prima → mostra oggi; dopo → mostra domani |
| `show_title` | bool | `false` | Mostra la barra del titolo della card |
| `title` | stringa | `"Waste collection"` | Testo del titolo (visibile solo con `show_title: true`) |
| `show_labels` | bool | `true` | Mostra il nome del tipo sovrapposto sul cestino |
| `show_day_labels` | bool | `true` | Mostra la label offset del giorno (Oggi / Domani / Tra N giorni…) |
| `show_weekday` | bool | `true` | Mostra il nome breve del giorno (Lun, Mar…) sotto la label offset |
| `day_labels` | lista | auto | Sostituisce le label offset — auto: Today, Tomorrow, in 2 days… |
| `short_days` | lista | inglese | Sostituisce i nomi brevi dei giorni — esattamente 7 voci, Dom → Sab |
| `skip_empty` | bool | `true` | Salta i giorni senza raccolta |
| `refresh_interval` | numero | `300` | Secondi tra un aggiornamento e l'altro (minimo: 10) |
| `icon_size` | numero | auto | Dimensione icona cestino in px (auto: 64 per `days:1`, 52 altrimenti) |
| `column_width` | numero | auto | Larghezza fissa di ogni colonna in px. Se impostata, ogni colonna occupa esattamente quella larghezza; senza di essa le colonne si dividono lo spazio equamente |
| `empty_text` | stringa | `"No collection"` | Testo per la vista giornaliera quando non c'è raccolta |
| `empty_symbol` | stringa | `"·"` | Simbolo nelle colonne vuote (vista multi-giorno) |

---

## Esempi

### Minimale — 5 giorni

```yaml
type: custom:ha-separate-garbage-collection-card
calendar: calendar.waste
```

[![Minimale — 5 giorni](/examples/images/minimal-5-days-view.png)](/examples/minimal-5-days-view.yaml)

---

### Vista giornaliera — icone grandi

```yaml
type: custom:ha-separate-garbage-collection-card
calendar: calendar.waste
days: 1
icon_size: 80
```

[![Vista giornaliera — icone grandi](/examples/images/single-card.png)](/examples/single-card.yaml)

---

### Vista 3 giorni

```yaml
type: custom:ha-separate-garbage-collection-card
calendar: calendar.waste
days: 3
background: /local/redfoxy/ha-separate-garbage-collection/background.png
```

[![Vista 3 giorni](/examples/images/3-days-view.png)](/examples/3-days-view.yaml)

---

### Con titolo, senza riga giorno della settimana

```yaml
type: custom:ha-separate-garbage-collection-card
calendar: calendar.waste
days: 5
show_title: true
title: "Raccolta questa settimana"
show_weekday: false
```

[![Con titolo, senza riga giorno della settimana](/examples/images/with-title-no-weekday-row.png)](/examples/with-title-no-weekday-row.yaml)

---

### Traduzione italiana completa

```yaml
type: custom:ha-separate-garbage-collection-card
calendar: calendar.waste
days: 5
empty_text: "Nessuna raccolta"
empty_symbol: "—"
day_labels:
  - "Oggi"
  - "Domani"
  - "Tra 2 giorni"
  - "Tra 3 giorni"
  - "Tra 4 giorni"
short_days:
  - "Dom"
  - "Lun"
  - "Mar"
  - "Mer"
  - "Gio"
  - "Ven"
  - "Sab"
```

[![Traduzione italiana completa](/examples/images/italian-translation.png)](/examples/italian-translation.yaml)

---

### 7 giorni, aggiornamento lento, icone più grandi

```yaml
type: custom:ha-separate-garbage-collection-card
calendar: calendar.waste
days: 7
icon_size: 60
refresh_interval: 3600
show_weekday: true
```

[![7 giorni, aggiornamento lento, icone più grandi](/examples/images/7-days-slow-refresh-larger-icons.png)](/examples/7-days-slow-refresh-larger-icons.yaml)

---

### Larghezza colonne fissa

```yaml
type: custom:ha-separate-garbage-collection-card
calendar: calendar.waste
days: 5
column_width: 70
```

[![Larghezza colonne fissa](/examples/images/fixed-column-width.png)](/examples/fixed-column-width.yaml)

---

### Esempi di eventi nel calendario

**Umido — ogni lunedì, giovedì e sabato:**
```
Titolo:       Umido
Tutto il giorno: ✅
Ricorrenza:   Settimanale: Lun, Gio, Sab
Descrizione:
  color: #4CAF50
```

**Carta e Cartone — ogni martedì:**
```
Titolo:       Carta e Cartone
Tutto il giorno: ✅
Ricorrenza:   Settimanale: Mar
Descrizione:
  color: #2196F3
```

![Carta e cartone - ogni martedì](/examples//images/calendar-example.png)

**Plastica — ogni mercoledì:**
```
Titolo:       Plastica
Tutto il giorno: ✅
Ricorrenza:   Settimanale: Mer
Descrizione:
  color: #FF9800
```

**Vetro — ogni lunedì alterni:**
```
Titolo:       Vetro
Tutto il giorno: ✅
Ricorrenza:   Ogni 2 settimane: Lun
Descrizione:
  color: #8BC34A
```

**Indifferenziata — ogni venerdì:**
```
Titolo:       Indifferenziata
Tutto il giorno: ✅
Ricorrenza:   Settimanale: Ven
Descrizione:
  color: #9E9E9E
```

**Sterpaglie — ogni sabato alterni, icona personalizzata:**
```
Titolo:       Sterpaglie
Tutto il giorno: ✅
Ricorrenza:   Ogni 2 settimane: Sab
Descrizione:
  color: #795548
  icon: sterpaglie.png
```

![Umido e vetro - ogni lunedì](/examples//images/calendar-with-custom-icon.png)

---

## Come funziona `show_before`

| Orario attuale | `show_before: "09:00"` | Giorno 0 |
|---|---|---|
| 07:30 | 09:00 | **Oggi** (raccolta non ancora avvenuta) |
| 09:01 | 09:00 | **Domani** (raccolta di oggi già fatta — prepara stasera) |
| 22:00 | 09:00 | **Domani** |

---

## Struttura dei file

```
/config/www/redfoxy/ha-separate-garbage-collection/
├── ha-separate-garbage-collection-card.js   ← card Lovelace (questo file)
├── trashcan.svg                 ← icona cestino base  (colore: #f68b22)
├── background.png               ← immagine di sfondo
└── *.png / *.svg                ← icone personalizzate per tipo (opzionali)
```

---

## Sistema di colori

Il filtro CSS è auto-calibrato sui colori del SVG base:

| Parte | Colore |
|---|---|
| Body | `#f68b22` |
| Dettaglio scuro | `#f07525` |
| Ombra | `#c15a28` |
| Luce | `#fcb315` |

Impostando `color: #2196F3` nella descrizione dell'evento viene generato automaticamente  
`hue-rotate(177deg) saturate(98%) brightness(0.98)` — nessuna configurazione manuale necessaria.

Per controllo totale, scrivi `filter:` direttamente nella descrizione.

[hacs-badge]: https://img.shields.io/badge/HACS-Custom-orange.svg
[hacs-url]: https://github.com/hacs/integration
[license-badge]: https://img.shields.io/badge/License-GNU3.0-yellow.svg
[license-url]: LICENSE
