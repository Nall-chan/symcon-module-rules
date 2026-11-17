# Eigene Instanz-Kacheln (HTML-SDK, Kachel-Visualisierung)

Ergänzung zu `symcon-module-rules.md`. Gilt für Module mit eigener HTML-Kachel (`SetVisualizationType(1)`, `GetVisualizationTile()`), die die Kachel-Visualisierung als iframe unter `/visu/<InstanzID>` lädt.

## Browser-„Zurück“ schließt die maximierte Kachel nicht

**Fehlerbild:** Nach dem Maximieren einer eigenen HTML-Kachel schließt das erste „Zurück“ im Browser den Dialog nicht. Stattdessen überlagert der Titel der Visu den Inhalt der Kachel. Erst ein weiteres „Zurück“ schließt den Dialog. Normale Kacheln (ohne eigenes HTML) sind nicht betroffen. Beobachtet an FritzBox und YouTube Music (Symcon 9.1, Chrome).

**Ursache:** Beim Maximieren setzt die Visu die `src` des **vorhandenen** iframes neu. Dabei ändert sich nur der Parameter `margintop` (Raster `15`, maximiert `60`). Das legt einen eigenen Eintrag im Browserverlauf an. Das erste „Zurück“ lädt deshalb nur den alten iframe-Inhalt (Navigationstyp `back_forward`, `margintop=15`), statt den Dialog zu schließen. Eigentlich ein Fehler der Kachel-Visualisierung (Meldung an Symcon steht aus).

**Workaround:** Ganz am Anfang des Kachel-Skripts, vor allem anderen, prüfen, ob der Inhalt per „Zurück“ geladen wurde und nicht mehr zur aktuellen Adresse des iframes passt. Dann selbst einen Schritt weiter zurückgehen und den Rest des Skripts nicht ausführen:

```js
(function () {
  'use strict';
  try {
    const nav = performance.getEntriesByType('navigation')[0];
    const frame = window.frameElement;
    if (nav && nav.type === 'back_forward' && frame && frame.src &&
        new URL(frame.src, location.href).search !== location.search) {
      history.back();
      return;
    }
  } catch (e) { /* ohne Zugriff auf das iframe: nichts tun */ }
  // … restliches Kachel-Skript
})();
```

Danach schließt ein einziges „Zurück“ den Dialog. Geprüft in Chrome: Kachel maximieren, in die Kachel klicken, Zurück. Referenzumsetzung: FritzBox, `libs/tile/tile.js`.

## Fehlermeldungen der Visu über einer HTML-Kachel nicht bedienbar

**Fehlerbild:** Erzeugt eine Bedienaktion der Kachel eine Fehlermeldung (rote Leiste unten, „Fehler bei …“), lässt sich die Meldung nicht schließen, solange die (maximierte) HTML-Kachel darunter liegt. Klicks auf „Mehr“ oder das X kommen nicht an.

**Ursache:** Die Kachel-Visualisierung ist eine Flutter-Web-App und zeichnet ihre Oberfläche (auch die Fehlermeldung) in ein Canvas. Die HTML-Kachel ist ein echtes iframe darüber. Sichtbar liegt die Meldung oben, den Klick erhält aber das iframe (`document.elementFromPoint` an der Stelle des X liefert das iframe). In Chrome nachgestellt (2026-11-17, FritzBox Host Filter). Fehler der Kachel-Visualisierung, aus der Kachel nicht zu beheben (ein iframe kann Klicks nicht an die Flutter-Oberfläche weitergeben). Meldung an Symcon steht aus.

**Umgang:** Fehler, die vorhersehbar sind, schon in der Kachel vermeiden (z. B. nicht zulässige Auswahl gar nicht anbieten), statt sie per Fehlermeldung zu melden. Abhilfe für Nutzer: Kachel verkleinern oder schließen.

## Kachel selbst maximiert öffnen und wieder schließen

- Eine Kachel kann sich per `openObject(<eigene InstanzID>)` selbst maximiert öffnen (ab Symcon 8.2). Auslöser ist ein Ereignis der Instanz per `UpdateVisualizationValue`. Nur Clients, auf denen die Kachel gerade sichtbar ist, erhalten das Ereignis.
- Die neu geöffnete, maximierte Kachel ist ein eigenes iframe. Sie erhält das Ereignis nicht, sondern nur die Daten aus `GetVisualizationTile()`. Was sie zeigen soll, gehört deshalb mit Zeitstempel in diese Daten. Sie übernimmt es nur, wenn es frisch ist (z. B. höchstens 15 s alt).
- Schließen per `history.back()`, aber nur, wenn `window.top.location.hash` noch dem Stand beim Öffnen entspricht (der Nutzer hat nicht weiter navigiert).
- Per `openObject` geöffnet erkennt die Kachel an `window.top.location.hash`, der dann auf `/<InstanzID>` endet (manuell maximiert endet er auf die ID des Links). Nur so geöffnete Kacheln dürfen die Anzeige aus ihren ersten Daten übernehmen: Beim Schließen des Dialogs baut die Visu die Kachel im Raster neu auf (neues iframe). Übernimmt diese die noch frische Anzeige, geht sie beim nächsten `history.back()` einen Schritt zu weit zurück.
- Referenzumsetzung: FritzBox Anrufmonitor, `FritzBox Callmonitor/tile.js` (Eigenschaft `OpenTileOnRing`: Vollbild bei eingehendem Anruf, schließt sich wieder, sobald er nicht mehr klingelt). Das Ereignis erst nach den neuen Daten der Kachel senden (gleicher Ablauf, z. B. direkt nach `PushTile`), sonst findet die Kachel den Anruf noch nicht.

## Neuzeichnen ohne Springen

Wird die Kachel bei neuen Daten per `innerHTML` neu aufgebaut, springen scrollbare Listen nach oben (z. B. nach jeder Bedienung). Vor dem Neuzeichnen `scrollTop`/`scrollLeft` der scrollbaren Bereiche merken und danach wiederherstellen, wenn Anzahl und Reihenfolge der Bereiche gleich geblieben sind. Referenzumsetzung: FritzBox, `libs/tile/tile.js` (`FB.draw`).
