# Changelog (Italiano)

Qui trovi le modifiche importanti del progetto, tradotte da [CHANGELOG.md](CHANGELOG.md). Se i due file non coincidono, fa fede quello inglese.

Il formato segue [Keep a Changelog](https://keepachangelog.com/it-IT/1.1.0/)
e il progetto usa il [Versionamento Semantico](https://semver.org/lang/it/spec/v2.0.0.html).

---

## [4.1.1] — 2026-11-06

### Corretto
- Con l'aggiornamento di Home Assistant che ha portato HACS dentro il Marketplace integrato erano spariti i cestini e lo sfondo. La card decideva dove cercare gli asset guardando se il suo URL conteneva `/hacsfiles/`. Se non lo trovava (Marketplace, oppure risorse `/local/community/…` delle vecchie installazioni HACS) andava nella cartella dell'installazione manuale, dove `trashbin.svg` e `background.png` non ci sono e il server risponde 404. Adesso la card prende gli asset dalla stessa cartella del suo file JS, che ricava dall'URL dello script, dallo stack di errore o dalla voce di rete. Il percorso di installazione non conta più.
- Se l'immagine di un cestino non si carica, sopra la card non compare più il testo di riserva (`alt=""`). Tanto il nome del rifiuto c'è già nell'etichetta e nel tooltip.
- Al primo caricamento la card scaricava il calendario due volte di fila. Ora lo scarica una volta sola.
- `skip_empty` e `show_weekday` seguono la stessa regola delle altre opzioni booleane: si disattivano solo con un `false` esplicito.
- Se una lista `day_labels` personalizzata è più corta dei giorni mostrati, le etichette mancanti usano la lingua attiva invece di un testo inglese fisso.
- Un evento senza titolo mostra un nome predefinito nella lingua attiva invece del nome italiano fisso `Raccolta`.
- L'errore `"calendar" is required.` è in inglese sia nello YAML sia nell'editor visuale.
- README: l'icona base si chiama `trashbin.svg`, non `trashcan.svg`. Sono stati tolti gli alias `custom:garbage-collection-day` e `custom:garbage-collection-week`, che la card non ha mai registrato. Sono stati corretti i link agli esempi e l'esempio del filtro colore (`brightness(1.18)`).
- `examples/3-days-view.yaml` non contiene più il percorso dello sfondo dell'installazione manuale, quindi funziona anche con HACS.
- La card ora fa l'escape HTML di titoli degli eventi, valori della descrizione (`icon`, `filter`) e testi dello YAML. Un titolo con `"`, `<` o `&` non rompe più la card.
- Il timer di aggiornamento riparte quando Home Assistant ricollega la card senza un nuovo `hass` (per esempio dopo un cambio di vista). Non possono più girare due timer insieme.
- La configurazione predefinita creata dall'editor visuale non imposta più `icon_size: 82`. Le card nuove usano la dimensione automatica (64 px con `days: 1`, 52 px negli altri casi), come dice la documentazione.

### Modificato
- Ho riorganizzato il codice senza cambiare nulla di visibile. `setConfig` normalizza i valori predefiniti una volta sola, la vista giornaliera e la griglia usano lo stesso CSS e la stessa funzione di disegno, e l'abbreviazione delle etichette sta in un'unica funzione. Ho tolto il codice che non serviva più (`CACHE_TTL`, `_fetched` e alcune variabili) e ho aggiornato il commento iniziale del file, ora in inglese.
- Ho riscritto i testi di README e CHANGELOG in un linguaggio più semplice, in inglese e in italiano.

---

## [4.1.0] — 2026-05-20

### Aggiunto
- Quando un giorno ha due o più raccolte, la card disegna un solo `trashbin.svg` diviso in fette uguali da `1/N`, una per tipo di rifiuto, con i nomi impilati sul cestino. La divisione segue la sagoma reale del cestino: con proporzioni 365:718 il cestino occupa solo il centro del suo riquadro quadrato, quindi ogni fetta è il `100/N` % del cestino e non dello spazio vuoto intorno. Così un giorno pieno occupa lo spazio di un cestino solo, non di tanti messi in fila.
- Nuova opzione `merge_same_day` (bool, default `true`). Attiva il comportamento descritto sopra. Con `false` si torna al layout precedente, un cestino per evento, uno accanto all'altro.
- Nuova opzione `split_direction` (`vertical` | `horizontal`, default `vertical`). `vertical` divide in fette sinistra/destra, `horizontal` in strisce alto/basso.
- Nuova opzione `weekday_format` (`short` | `full`, default `short`). Sceglie se sotto ogni colonna compare il nome breve (`Lun`, `Mar`…) o completo (`Lunedì`, `Martedì`…) del giorno.
- Nuova opzione `full_days` (lista di 7 stringhe, facoltativa). Sostituisce i nomi completi dei giorni, come `short_days` fa con quelli brevi. Serve se la tua lingua non è inclusa e usi `weekday_format: full`.
- Traduzioni incluse in 12 lingue: `en`, `it`, `fr`, `de`, `es`, `pt`, `nl`, `hu`, `ru`, `hi`, `zh`, `ja`. Coprono le etichette dei giorni (`Oggi` / `Domani` / `Tra N giorni`), i nomi brevi e completi dei giorni, il titolo predefinito della card e il testo "nessuna raccolta". Il russo usa le forme plurali corrette di "giorno" (`день` / `дня` / `дней`).
- Nuova opzione `language` (`null` per il rilevamento automatico, oppure uno dei codici inclusi). Con il default `null` la card legge `hass.language` e sceglie la traduzione corrispondente. Riduce codici come `zh-Hans` a `zh` e `en-US` a `en`, e se non trova la lingua usa `en`. I valori YAML di `title`, `empty_text`, `day_labels`, `short_days` e `full_days` hanno comunque la precedenza sulla traduzione.
- L'editor visuale mostra tutte le nuove opzioni nella sezione "Display options".

### Modificato
- Il carattere dell'etichetta sul cestino si rimpicciolisce quando gli eventi impilati aumentano (13, 11, 10, poi 9 px, mai sotto i 9 px), così i nomi stanno ancora su un solo cestino. Con `icon_size >= 100` il carattere resta a 13 px qualunque sia il numero di eventi, perché i cestini grandi hanno spazio per le etichette a grandezza piena.
- La card disegna gli eventi dello stesso giorno in ordine alfabetico (tenendo conto di maiuscole e lingua), sia dentro il cestino unico (da sinistra a destra o dall'alto in basso) sia quando i cestini sono affiancati. Prima seguiva l'ordine dell'API del calendario, che poteva cambiare da un aggiornamento all'altro.

### Note
- Nei giorni uniti la card ignora il campo `icon:` dei singoli eventi, perché la divisione per colori funziona solo sul `trashbin.svg` base. L'icona personalizzata compare comunque nei giorni in cui quel tipo di rifiuto è l'unica raccolta. Imposta `merge_same_day: false` per tenere le icone personalizzate ovunque.
- Chi non ha `merge_same_day` nella configurazione riceve il nuovo comportamento senza dover cambiare nulla. Per tornare indietro basta `merge_same_day: false`.

---

## [4.0.2] — 2026-05-19

### Corretto
- Percorso di installazione HACS: al caricamento la card controlla il proprio URL per capire se gira da `/hacsfiles/HA-Separate-Garbage-Collection/` (HACS) o da `/local/redfoxy/ha-separate-garbage-collection/` (installazione manuale).

---

## [4.0.1]

### Corretto
- Correzioni minori.

---

## [4.0.0]

### Aggiunto
- Prima release della v4. La card ora è un'unica card Lovelace in un solo file, che legge direttamente la REST API del calendario di Home Assistant, senza integrazione Python, senza sensori YAML e senza dipendenze esterne. Tutte le funzioni sono descritte nel [README](README.md).

---

[4.1.1]: https://github.com/RedFoxy/HA-Separate-Garbage-Collection/releases/tag/v4.1.1
[4.1.0]: https://github.com/RedFoxy/HA-Separate-Garbage-Collection/releases/tag/v4.1.0
[4.0.2]: https://github.com/RedFoxy/HA-Separate-Garbage-Collection/releases/tag/v4.0.2
[4.0.1]: https://github.com/RedFoxy/HA-Separate-Garbage-Collection/releases/tag/v4.0.1
[4.0.0]: https://github.com/RedFoxy/HA-Separate-Garbage-Collection/releases/tag/v4.0.0
