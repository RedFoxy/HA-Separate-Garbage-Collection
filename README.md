# Separate Garbage Collection
This is a fork of [Raccolta differenziata](https://hassiohelp.eu/2019/03/17/raccolta-differenziata/) created by Enrico & Caio on [HassioHelp](https://hassiohelp.eu)

Sorry but actualy that project is traslated in italian, soon will be translated in english

![Separate Garbage Collection - Full view](/docs/images/full-view.png)

Questa guida si basa sull’articolo di [Raccolta differenziata](https://hassiohelp.eu/2019/03/17/raccolta-differenziata/), sui post di Caio Sweet sul [HassioHelp forum](https://forum.hassiohelp.eu/d/223-raccolta-differenziata-bisettimanale/132) e a una discussione con Caio Sweet.

Prima di iniziare assicuratevi di aver installato, tramite HACS o a mano, i seguenti custom components e custom cards:

## Dipendenze
1. Garbage Collection – Integrazione obbligatoria
2. Auto-entities – Frontend obbligatoria
3. Button-card – Frontend obbligatoria
4. Card-mod – Frontend obbligatoria
5. State-switch – Frontend opzionale, installatela solo se si usa la card grande

Installati tutti i componenti richiesti, riavviate Home Assistant, quindi andate in **Impostazioni -> Integrazioni** e **aggiungete un “Garbage Collection”** per ogni tipo di rifiuto che volete gestire, abbiate cura di inserire nel campo "**Scade dopo**" un valore a partire dalla mezzanotte del giorno in cui il rifiuto è valido, il valore indica dopo quanto deve scadere il rifiuto, io vi consiglio 23:59 così che scada alla mezzanotte.

Inseriti i vari tipi di rifiuti, avrete un riquadro inerente a “Garbage Collection” che li elencherà, cliccate sul primo e subito dopo sul link “1 dispositivo”, quindi sul sensore relativo al tipo di rifiuto che state modificando, nella nuova schermata, nel riquadro Entità, cliccate sul rifiuto e compilate come segue i dati del sensore:

- Nome: Mettete il nome del rifiuto, senza simboli, lo userete come nome dello stile per assegnargli il colore, gli spazi vengono tradotti in _
- ID entità: Modificate il nome da sensor.rifiuto in sensor.raccolta_rifiuto (naturalmente rifiuto sarà carta, vetro o altro) sempre senza simboli e senza spazi
- Icona: Potete definire un icona o lasciare che la gestisca il componente, poco importa

Per installare questo pacchetto dovete scaricare uno dei seguenti file yaml e metterli in /config/packages del vostro Home Assistant:

- garbage_collection.yaml con notifica tramite il pacchetto “Centro notifiche” di HassioHelp
- garbage_collection_telegram.yaml con notifica tramite Telegram
- garbage_collection_no_notifica.yaml SENZA NOTIFICHE

Nella directory cards sono presenti degli esempi di cards pronte per essere incollate nella vostra interfaccia:
- all-trashcan.yaml - Mostra tutti i bidoni e i relativi giorni di consegna che mancano.
![Example of all-trashcan.yaml's card](/docs/images/all-trashcan.png)
- all-trashcan-all-days.yaml - Mostra tutti i bidoni e i tasti in alto per cambiare la visuale e i settaggi
![Example of all-trashcan-all-days.yaml's card](/docs/images/all-trashcan-all-days.png)
- all-trashcan-only-today.yaml - Mostra solo i bidoni della giornata e i tasti in alto per cambiare la visuale e i ![Example of all-trashcan-only-today.yaml's card](/docs/images/all-trashcan-only-today.png)
settaggi
- icon-today.yaml - Mostra un solo bidone, utile per metterla dentro una card singola
![Example of icon-today.yaml's card](/docs/images/icon-today.png)


In fine il contenuto della cartella www va copiato dentro /config/www di Home Assistant.

Fatto questo avete finito!

Giusto qualche nozione sull’interfaccia completa, il tasto calendario rosso con rotella in alto a sinistra mostra le impostazioni, se cliccate due volte sulla barra centrale “Portare fuori oggi”, potrete vedere la spazzatura dei prossimi giorni, vedrete sempre la spazzatura dei prossimi giorni ma in formato testuale, per questa schermata vi spiego un trucchetto: se volete vedere Oggi/Domani/Tra X giorni, dovete andare nelle impostazioni di ogni rifiuto (Impostazioni -> Integrazioni -> Riquadro Garbage Collection -> Nome del rifiuto -> tasto Configura) e mettere il segno di spunta a “Stato Verbale”, inoltre vi consiglio di inserire nel campo subito a seguire “Formato verbale” il testo: Tra {days} giorni

Per personalizzare i colori per ogni rifiuto, dovrete modificare il codice delle card (due volte per quello a griglia una volta per quello a icona) il blocco dove vengono definiti gli stili:
```
--plastica: hue-rotate(20deg) brightness(1.2);
--umido: hue-rotate(0deg) grayscale(50%) brightness(0.7);
--carta: hue-rotate(160deg) brightness(0.7);
--indif: hue-rotate(0deg) grayscale(100%) brightness(0.7);
--vetro: hue-rotate(100deg) brightness(0.7);
```
Per definire lo stile dovete usare – seguito dal nome che avete dato al rifiuto nel sensore (vedi all’inizio!), senza simboli e con _ al posto degli spazi, mentre con hue-rotate(XXXdeg) definite il colore, i valori sono dei numeri che partono da 0 fino a 360 (si può superare il numero ma è come ripartire da 0), mentre con brightness(0.0) definite la brillantezza, con grayscale(0%) invece definite quanto il colore sia intenso o tendente al bianco e nero.
Attenzione: se cambiate l’immagine bidone.png, i valori di hue-rotate, grayscale e brightness cambieranno in base al colore della nuova immagine!
Aggiornato l'archivio alla versione 0.8

