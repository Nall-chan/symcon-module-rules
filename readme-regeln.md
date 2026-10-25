# Doku-, README- und Changelog-Regeln (Symcon-Libraries)

Ergänzung zu `symcon-module-rules.md`. Gilt, sobald PHPDoc, `form.json`-Doku, READMEs, Screenshots oder der Changelog angefasst werden.

- **Dokumentation:**
  - Nutze PHPDoc für Klassen, Methoden und Variablen.
  - Beschreibe die Funktionalität und Parameter der Methoden.
  - Dokumentiere die Modulkonfiguration im form.json.
  - Feste Breiten (`width`) im form.json an der längsten Übersetzung ausrichten. Deutsche Texte sind meist länger als die englischen Originale.
  - Erstelle im Hauptordner eine README.md mit einer Anwenderbeschreibung der Library und dessen Bestandteile.
  - Der Aufbau der README.md sollte wie folgt aussehen:
    - **1. Funktionsumfang**
    - **Vorbemerkungen** <Bei Bedarf einfügen, wenn die z.B. umfange Vorbereitungen an Hardware oder Software notwenig sind, um die Library nutzen zu können. Details siehe die nächsten zwei Punkte.>
      - **Zur Library** <Kurze Leistungsabgrenzung wenn z.B. nicht der ganze Protokollstack, oder nicht alle Geräte unterstützt werden.>
      - **Zur Integration von Geräten** <Beschreibung wenn z.B. vorher bestimmte Freigaben, API-Keys, Zugangsdaten usw. benötigt werden, damit die Library genutzt werden kann.>
    - **2. Voraussetzungen**
    - **3. Software-Installation**
    - **4. Enthaltende Module**
      - <Auflistung alle Module mit Überschrift (+Link zur Dokumentation) und kurzer Beschreibung der Funktionalität>
    - **5. Anhang**
      - **1. GUID der Module**
      - **2. Changelog**
      - **3. Spenden**
    - **6. Lizenz**
  - Erstelle in jedem Ordner eine README.md mit einer Anwenderbeschreibung des Moduls und dessen Funktionalität.
  - Der Aufbau der README.md sollte wie folgt aussehen:
    - **1. Funktionsumfang**
    - **2. Voraussetzungen**
    - **3. Software-Installation**
    - **4. Einrichten der Instanzen in IP-Symcon**
    - **5. Statusvariablen**
    - **6. Visualisierung**
      - **Kachel Visualisierung**
      - **WebFront Visualisierung**
    - **7. PHP-Befehlsreferenz**
    - **8. Aktionen**
    - **9. Anhang**
      - **1. Changelog**
      - **2. Spenden**
    - **10. Lizenz**
  - Im Abschnitt **8. Aktionen** der Modul-READMEs: Wird immer einleitend folgender Standardtext verwendet:
    `**Grundsätzlich können alle bedienbaren Statusvariablen als Ziel einer [`Aktion`](https://www.symcon.de/service/dokumentation/konzepte/automationen/ablaufplaene/aktionen/) mit `Auf Wert schalten` angesteuert werden, so dass hier keine speziellen Aktionen benutzt werden müssen.**`
- **README-Format:**
  - Zielplattform ist GitHub ([GitHub Flavored Markdown](https://docs.github.com/de/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)). Der Symcon Module Store zeigt die README nicht an (dort gibt es nur ein eigenes Textfeld beim Einreichen).
  - Die von GitHub **gerenderte** Seite wird vom Autor per Kopieren aus dem Browser in das Symcon Community Forum übernommen. Daher:
    - Keine eingeklappten Bereiche (`<details>`): eingeklappter Inhalt wird beim Kopieren nicht mit übernommen.
    - Kein Inhalt, der nur durch GitHub-spezifisches HTML/JavaScript funktioniert. Bilder und Links werden vom Browser als absolute Adressen kopiert und sind damit unkritisch.
  - Das Inhaltsverzeichnis (`<!-- omit in toc -->`) pflegt ein VS-Code-Plugin, aber nur wenn der Autor die Datei bearbeitet. Werden Überschriften hinzugefügt, umbenannt oder entfernt, das Inhaltsverzeichnis selbst passend anpassen.
  - Hinweisboxen ([Alerts](https://docs.github.com/de/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax), Abschnitt „Alerts“) sparsam und nur für wirklich wichtige Aussagen einsetzen, nie innerhalb von Listen oder Tabellen, mit Leerzeile davor und danach:
    - `> [!NOTE]` Einschränkungen und Hintergrundinfos (z.B. Funktion aktuell nicht verfügbar).
    - `> [!TIP]` Empfohlene Vorgehensweise (z.B. Instanzen über die Discovery anlegen).
    - `> [!IMPORTANT]` Pflichtvoraussetzungen und häufige Fehlbedienungen (z.B. erwartetes Werteformat, Erreichbarkeit ohne Anmeldung, kommerzielle Nutzung).
    - `> [!WARNING]` Gefahr von Fehlfunktionen oder Datenverlust (z.B. Löschen von Statusvariablen, Testphase der Library).
    - `> [!CAUTION]` Nicht rückgängig zu machende Aktionen.
    - Der Standardtext in **8. Aktionen** bleibt fetter Fließtext und wird nicht in eine Hinweisbox gesetzt.
  - PHP-Code (Funktionssignaturen und Beispiele) immer als Codeblock mit Sprachangabe ` ```php `, nie als Inline-Code. Signaturen im Format `bool PREFIX_Funktion(integer $InstanzID, string $Wert);`, Beispiele mit der Instanz-ID `12345` und Leerzeichen nach Kommas.
  - **4. Einrichten der Instanzen:** Die Tabelle der Eigenschaften enthält die Spalten `Eigenschaft` (Beschriftung im Formular) | `Name` (Property-Name) | `Typ` | `Standardwert` | `Beschreibung`, damit Nutzer `IPS_SetProperty` verwenden können. Wertebereiche, Bedeutung von Integer-Auswahlwerten (z.B. `0` = Ping, `1` = Bedingung) und ein Beispiel mit `IPS_SetProperty` + `IPS_ApplyChanges` angeben. Werden Eigenschaften eines übergeordneten Moduls (z.B. Client Socket) benötigt oder von der Instanz verwaltet, darauf hinweisen.
  - **7. PHP-Befehlsreferenz:** Für jeden Parameter genau beschreiben, welche Werte erwartet werden und woher der Nutzer sie bekommt (z.B. welcher Teil einer URL eine ID ist, typische Präfixe, häufige Verwechslungen), welche Parameterkombinationen zulässig sind und was der Rückgabewert tatsächlich aussagt. Beispiele mit echten, getesteten Werten.
  - Reine Test- oder Entwicklerfunktionen (z.B. Senden beliebiger Rohbefehle) gehören nicht in die Endanwender-Dokumentation; sie bleiben im Code.
  - Dokumentiertes Verhalten vorher live prüfen. Nicht geprüftes Verhalten als solches kennzeichnen oder weglassen. Links in die Symcon-Dokumentation über den MCP-Server (`symcon_documentation`) verifizieren.
  - **Screenshots der Kachel Visualisierung** (eingebunden unter „Kachel Visualisierung“) zeigen die **ganze Instanz**, nicht einzelne Variablen-Kacheln:
    - `imgs/tile_list.png` (immer): die maximierte Instanz-Kachel in der Darstellung `Liste` mit allen Variablen.
    - `imgs/tile_instance.png` (nur bei besonderer Darstellung): die Instanz-Kachel im Raster, wenn sie sich von der Liste unterscheidet, z. B. eigene HTML-Kachel des Moduls, Kacheltypen wie Mediaplayer, Rollladen oder Licht, oder `Einzelnes Element` (Instanzen mit nur einer Variable). Kachel vorher auf eine passende Größe bringen (z. B. 2 × 2). Entspricht die Kachel der Liste, entfällt dieses Bild.
    - `imgs/tile_html.png` (zusätzlich bei Variablen mit Darstellung HTML-Box bzw. WebView): In der Liste erscheinen sie nur als Symbol zum Öffnen. Daher jede solche Variable zusätzlich als einzelne Kachel in passender Größe aufnehmen (Tabellen: volle Breite 4 Spalten, Höhe nach Inhalt, z. B. 4 × 3), über einen zweiten Link in der Testkategorie. Leerraum unter dem Inhalt abschneiden (`crop-dialog.ps1` funktioniert auch für Kacheln). Bei mehreren solchen Variablen `tile_html_<Ident>.png`. Ist die Liste dadurch nichtssagend (Instanz hat nur diese eine Variable), entfällt `tile_list.png`.
    - Nicht zum Modul gehörende Objekte unterhalb der Instanz (Testvariablen, Skripte des Nutzers) vor der Aufnahme nach Rückfrage ausblenden (`IPS_SetHidden`), nicht löschen.
    - `symcon_tile_preview` (`object_ids`, `theme` light/dark, `tile_width`/`tile_height` 100–1200 px) eignet sich dafür nicht: Instanzen erscheinen dort nur als ihre eigene HTML-Kachel, ohne eigene HTML-Kachel bleibt sie leer. Die Vorschau taugt zum Prüfen einzelner Variablen-Kacheln (Symbole, Suffix, Farben) und von HTML-Kacheln. Für die Instanz-Liste die echte Kachel-Visualisierung (`http://127.0.0.1:3777/tile/`) verwenden. Sie zeigt nur Objekte unterhalb ihrer Basis-Kategorie und kennt keine Direktlinks (die URL ändert sich beim Navigieren nicht). Daher eine Testkategorie unterhalb der Basis anlegen (nach Rückfrage; IDs in `CLAUDE.local.md`) und darin **einen** Link, der nacheinander per `IPS_SetLinkTargetID` auf die Instanzen zeigt und per `IPS_SetName` den Instanznamen bekommt. Größe und Position der Kachel gehören zum Link und bleiben so erhalten.
    - Aufnahme mit `.claude-rules/tools/tile-screenshot.mjs` (Node ≥ 22, Edge headless über das DevTools-Protokoll): Seite laden (`wait:15000`), Kategorie-Schaltfläche klicken, Kachel maximieren, `shot`. Breite immer 1174 px. Mit Höhe 800 navigieren (bei anderer Höhe verschieben sich die Schaltflächen der Startseite) und erst vor dem Maximieren per `size:1174,3000` vergrößern. Danach `.claude-rules/tools/crop-dialog.ps1` schneidet den Dialog auf den Inhalt zu. Koordinaten vorher mit einem `shot` ermitteln. Vor der Aufnahme die Maus wegbewegen (`move`), sonst ist ein Symbol hervorgehoben. Ausgabepfad ohne Leerzeichen, danach in den Modulordner kopieren.
  - **Screenshots WebFront** (`imgs/webfront.png`, unter „WebFront Visualisierung“): ein eigenes WebFront für Screenshots mit derselben Basis-Kategorie wie die Kachel-Visualisierung nutzen (IDs in `CLAUDE.local.md`), dann gelten dieselben Links. Aufruf `http://127.0.0.1:3777/#<WebFront-ID>` (der Hash wählt nur das WebFront, Unterseiten per Mausklick auf den Reiter, ein JavaScript-`click()` wechselt nicht; passen nicht alle Reiter in die Breite, erst über die Pfeile in der Reiterleiste weiterblättern), Breite ca. 700 px, Aufnahme mit `shotel:<Name>:<Titel>` (Rahmen `.ipsInstance` mit diesem Titel).
  - **Screenshots Konfiguration** (`imgs/config.png`, unter „4. Einrichten der Instanzen“): Die Konsole (`http://127.0.0.1:3777/console/`) ist lokal ohne Anmeldung erreichbar. Objektbaum öffnen, ID-Suche, Instanz-ID eingeben und Enter öffnet direkt die Instanzkonfiguration. `.claude-rules/tools/crop-config.ps1` schneidet von der Statuszeile bis zum Trennbalken vor den Aktionen; bei schmalen Formularen rechts auf ca. 500 px kürzen. Dabei auf Umbrüche achten (Breite im `form.json` an der längsten Übersetzung ausrichten). Nach Möglichkeit auch den Aktionsbereich (Buttons, Webhook-Adressen, Popup-Buttons) mit aufnehmen, ohne den Spendenbereich: `crop-config.ps1 -Bottom <y>` schneidet bis zur Zeile `y` des Originals (mit einem `shot` die Zeile zwischen letztem Button und Spendentext ermitteln), `-Width <px>` verbreitert den Ausschnitt, wenn lange Hinweistexte sonst abgeschnitten werden. Sensible Werte darin (z. B. IP-Adressen, Hostnamen) maskieren.
  - **Headless-Browser:** Edge gibt beim Beenden nicht alle Kindprozesse frei. Bleiben Prozesse mit dem Profil hängen, verbindet sich der nächste Lauf ggf. mit dem alten Browser (falsche Seite, z.B. Konsole statt WebFront). Das Skript beendet deshalb am Ende alle Edge-Prozesse mit seinem Profilpfad und nutzt einen zufälligen Debug-Port, damit parallele Sitzungen nicht kollidieren.
    - Jedes Bild vor dem Einbinden ansehen. Die Bilder zeigen echte Werte; vorher mit dem Nutzer klären, ob sensible Werte (Passwörter, externe IPs, Seriennummern, Namen) enthalten sein dürfen. Freigegebene Maskierung (z.B. rote Balken über Namen und Rufnummern ab der dritten Ziffer) in allen Bildern derselben Daten gleich anwenden.
    - Beschreibungstext an das Bild angleichen (z. B. zeigen boolesche Variablen ohne Aktion einen An/Aus-Wert statt eines Schalters, HTML-Boxen und Bilder erscheinen in der Liste als Symbol zum Öffnen).
  - Jede für Nutzer sichtbare Änderung erhält einen Eintrag im Changelog der Haupt-README.
  - **Aufbau eines Changelog-Abschnitts** (gruppiert, damit er im Forum schnell lesbar ist):
    1. Hinweisbox `> [!IMPORTANT]` mit allem, was Nutzer beim Update beachten müssen (geänderte Voraussetzungen, umbenannte Funktionen, geändertes Verhalten). Bis zum Release in `STATUS.md` sammeln.
    2. **Neue Module**: je Modul eine Zeile mit Link zur Modul-README und kurzer Funktionsbeschreibung.
    3. **Neue Funktionen und Aktionen**: pro Instanz (Modul) eine Zeile mit allen neuen Funktionen.
    4. **Neue Statusvariablen**: pro Gerät bzw. Instanz eine Zeile.
    5. **Geändertes Verhalten**: z. B. neue Statuscodes, andere Darstellung, automatisches Neuverbinden. Interna wie Migrationen nur allgemein („werden beim Update übernommen“).
    6. **Behobene falsche Werte in Statusvariablen**: falsche Werte bzw. Wertzuweisungen aufzählen.
    7. **Fehlerbehebungen** am Ende.
  - Gruppen als fette Zeile, leere Gruppen entfallen. Bei wenigen Einträgen darf eine Version auch eine einfache Liste bleiben.
  - Einträge beschreiben die Wirkung für den Nutzer, nicht den Code. Einzelne neue Werte einer Aufzählung nicht als eigene Zeile („Geschirrspüler: Betriebszustand `Bereit`“), sondern zusammengefasst als behobener Wert („Zustände, die der Controller meldet, wurden teilweise nicht angezeigt“) oder weglassen.
  - Rein organisatorische und interne Änderungen gehören nicht in den Changelog: Lizenz, Doku-Umbau, Repo-Struktur, Unit-Tests, Refactoring und Protokolldetails ohne sichtbare Wirkung (z. B. ein zusätzlich gesendeter Header).
