# Separate Garbage Collection ![English](https://img.shields.io/badge/-english-blue)
![Separate Garbage Collection - Full view](/docs/images/full-view.png)

This is a fork of [Raccolta differenziata](https://hassiohelp.eu/2019/03/17/raccolta-differenziata/) created by Enrico & Caio on [HassioHelp](https://hassiohelp.eu)

Before to follow that guide, please double check that you have all dependences.

## Dependences
1. [Garbage Collection](https://github.com/bruxy70/Garbage-Collection)
2. [Auto-entities](https://github.com/thomasloven/lovelace-auto-entities)
3. [Button-card](https://github.com/custom-cards/button-card)
4. [Card-mod](https://github.com/thomasloven/lovelace-card-mod)
5. [State-switch](https://github.com/thomasloven/lovelace-state-switch) – Optional, install it only if you use the large card

Install all required dependences, restart Home Assistant, than go in **Settings** -> **Devices & Services** than add a **Garbage Collection** helpers for each garbage, just be sure  to insert **Expire after** field after 12:00 AM on the day the garbage is picked up, that field it's about when the garbage should expire, I recommend 11:59 PM so that it expires at midnight.

- Name: The garbage name, without symbols, you'll need to use it in the style name to change color and other, spaces in the name will replaced with _
- Entity ID: The garbage item id, without space or symbols, that name will used in the name of style, like sensor.paper will be --paper in the card
- Icon: Just select an icon that you like

To install that package, just download one of yaml file and put it /config/packages in your Home Assistant:

- **garbage_collection.yaml** - with notify sent by “Centro notifiche” by HassioHelp
- **garbage_collection_telegram.yaml** - with notify sent by Telegram
- **garbage_collection_no_notifica.yaml** - without notify

Under directory **cards** you can find some card ready to use:
- **all-trashcan.yaml** - Show all garbage cans and days missing until delivery.

![Example of all-trashcan.yaml's card](/docs/images/all-trashcan.png)

- all-trashcan-only-today.yaml - Shows only the garbage cans that will be picked up on the day and buttons to switch view to all garbage cans and settings.

![Example of all-trashcan-only-today.yaml's card](/docs/images/all-trashcan-only-today.png)

- all-trashcan-all-days.yaml - Show all garbage cans and days missing until delivery and buttosn to switch view and settings.

![Example of all-trashcan-all-days.yaml's card](/docs/images/all-trashcan-all-days.png)

- icon-today.yaml - Show only one garbage can

![Example of icon-today.yaml's card](/docs/images/icon-today.png)

Be sure to copy all files under the folder **www** in **/config/www** of your Home Assistant.

Than you are finished!

Just some tips, the red calendat button on the top left shows the settings, the bar in the top center switch view from all garbage cans to today cans.
If you want to see Today/Tomorrow/Thru X days, you have to go to the settings of each garbage and activate "Verbal Status", also I recommend you to put in the field immediately following "Verbal Format" the text: In {days} days

To customize the colors for each garbage, you will have to edit the cards code where styles are defined:
```
--plastic: hue-rotate(20deg) brightness(1.2);
--humid: hue-rotate(0deg) grayscale(50%) brightness(0.7);
--paper: hue-rotate(160deg) brightness(0.7);
--allother: hue-rotate(0deg) grayscale(100%) brightness(0.7);
--glass: hue-rotate(100deg) brightness(0.7);
```

To define the style you have to use **--** followed by the **Entity ID** you gave to the garbage sensor (see at the beginning!), without symbols and with _ instead of spaces, using hue-rotate(XXXdeg) you can change the color, the values are numbers starting from 0 up to 360 (you can exceed the number but it is like starting from 0), brightness is brightness(0.0), with grayscale(0%) instead you can change  the intense or tending to black and white the color is.
**Warning:** if you change the image bin.png, the values of hue-rotate, grayscale and brightness will change according to the color of the new image!
Updated the archive to version 0.9

# Separate Garbage Collection ![Italiano](https://img.shields.io/badge/-italiano-blue)
![Separate Garbage Collection - Full view](/docs/images/full-view.png)

Questa guida si basa sull’articolo di [Raccolta differenziata](https://hassiohelp.eu/2019/03/17/raccolta-differenziata/), sui post di Caio Sweet sul [HassioHelp forum](https://forum.hassiohelp.eu/d/223-raccolta-differenziata-bisettimanale/132) e a una discussione con Caio Sweet.

Prima di iniziare assicuratevi di aver installato, tramite HACS o a mano, i seguenti custom components e custom cards:

## Dipendenze
1. [Garbage Collection](https://github.com/bruxy70/Garbage-Collection)
2. [Auto-entities](https://github.com/thomasloven/lovelace-auto-entities)
3. [Button-card](https://github.com/custom-cards/button-card)
4. [Card-mod](https://github.com/thomasloven/lovelace-card-mod)
5. [State-switch](https://github.com/thomasloven/lovelace-state-switch) – Non obbligatorio, installatela solo se si usa la card grande

Installati tutti i componenti richiesti, riavviate Home Assistant, quindi andate in **Impostazioni** -> **Integrazioni** e aggiungete un **Garbage Collection** per ogni tipo di rifiuto che volete gestire, abbiate cura di inserire nel campo "**Scade dopo**" un valore a partire dalla mezzanotte del giorno in cui il rifiuto è valido, il valore indica dopo quanto deve scadere il rifiuto, io vi consiglio 23:59 così che scada alla mezzanotte.

- Nome: Mettete il nome del rifiuto, senza simboli, lo userete come nome dello stile per assegnargli il colore, gli spazi vengono tradotti in _
- ID entità: ~~Modificate il nome da sensor.rifiuto in sensor.raccolta_rifiuto (naturalmente rifiuto sarà carta, vetro o altro) sempre senza simboli e senza spazi~~ Da adesso il nome del sensore non è più importante per le card, non usate simboli e spazi
- Icona: Potete definire un icona o lasciare che la gestisca il componente, poco importa

Per installare questo pacchetto dovete scaricare uno dei seguenti file yaml e metterli in /config/packages del vostro Home Assistant:

- **garbage_collection.yaml** - con notifica tramite il pacchetto “Centro notifiche” di HassioHelp
- **garbage_collection_telegram.yaml** - con notifica tramite Telegram
- **garbage_collection_no_notifica.yaml** - SENZA NOTIFICHE

Nella directory cards sono presenti degli esempi di schede pronte per essere incollate nella vostra interfaccia, per farlo cliccate i **tre puntini in alto a destra**, quindi selezionate **Modifica Plancia** e **aggiungete una scheda** qualsiasi, in fine, cliccate su **Modifica editor del codice**, cancellate tutto il contenuto e incollate il codice della scheda che avete scelto:
- all-trashcan.yaml - Mostra tutti i bidoni e i relativi giorni di consegna che mancano.

![Example of all-trashcan.yaml's card](/docs/images/all-trashcan.png)

- all-trashcan-only-today.yaml - Mostra solo i bidoni della giornata e i tasti in alto per cambiare la visuale e i settaggi

![Example of all-trashcan-only-today.yaml's card](/docs/images/all-trashcan-only-today.png)

- all-trashcan-all-days.yaml - Mostra tutti i bidoni e i tasti in alto per cambiare la visuale e i settaggi

![Example of all-trashcan-all-days.yaml's card](/docs/images/all-trashcan-all-days.png)

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
Aggiornato l'archivio alla versione 0.9
