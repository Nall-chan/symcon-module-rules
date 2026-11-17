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

## Kachel selbst maximiert öffnen und wieder schließen

- Eine Kachel kann sich per `openObject(<eigene InstanzID>)` selbst maximiert öffnen (ab Symcon 8.2). Auslöser ist ein Ereignis der Instanz per `UpdateVisualizationValue`. Nur Clients, auf denen die Kachel gerade sichtbar ist, erhalten das Ereignis.
- Die neu geöffnete, maximierte Kachel ist ein eigenes iframe. Sie erhält das Ereignis nicht, sondern nur die Daten aus `GetVisualizationTile()`. Was sie zeigen soll, gehört deshalb mit Zeitstempel in diese Daten. Sie übernimmt es nur, wenn es frisch ist (z. B. höchstens 15 s alt).
- Schließen per `history.back()`, aber nur, wenn `window.top.location.hash` noch dem Stand beim Öffnen entspricht (der Nutzer hat nicht weiter navigiert).
- Referenzumsetzung: FritzBox Anrufmonitor, `FritzBox Callmonitor/tile.js` und `FB_OpenCallPopup`.

## Neuzeichnen ohne Springen

Wird die Kachel bei neuen Daten per `innerHTML` neu aufgebaut, springen scrollbare Listen nach oben (z. B. nach jeder Bedienung). Vor dem Neuzeichnen `scrollTop`/`scrollLeft` der scrollbaren Bereiche merken und danach wiederherstellen, wenn Anzahl und Reihenfolge der Bereiche gleich geblieben sind. Referenzumsetzung: FritzBox, `libs/tile/tile.js` (`FB.draw`).
