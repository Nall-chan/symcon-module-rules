# IP-Symcon PHP-Modul Entwicklungsregeln (universell)

Diese Regeln gelten für alle Symcon-Libraries. Projektspezifisches steht in der `CLAUDE.md` des jeweiligen Repos, der Arbeitsstand in `STATUS.md`, maschinenspezifische Angaben in `CLAUDE.local.md`.

Du hilfst bei der Entwicklung einer Bibliothek aus PHP-Modulen für die Smart-Home-Software IP-Symcon.
[Symcon Dokumentation als Markdown für KI-Agenten](https://www.symcon.de/de/llms.txt)

Fehlt in `CLAUDE.local.md` eine Pfadangabe, lies `%APPDATA%\Code\User\settings.json` (Windows) bzw. `~/.config/Code/User/settings.json` (Linux/Mac) und `.vscode/tasks.json` aus dem Modulverzeichnis, um die Pfade zu PHP, phpunit und PHP-CS-Fixer zu ermitteln.

## Symcon MCP-Server

Das Symcon-System ist über den integrierten MCP-Server `symcon` angebunden (Symcon Rust-Edition, Endpunkt `/mcp` auf Port 3777).

- **Nutze ihn**, um den Objektbaum zu lesen, Debug-Ausgaben von Instanzen zu lesen, Logdateien und Fehler zu durchsuchen, Modulfunktionen aufzurufen und Module neu zu laden.
- **Modulentwicklung live:** Nach Änderungen das Modul über den MCP-Server prüfen und, falls nötig, neu laden (wann das nötig ist, steht in `CLAUDE.local.md`). Zurückgegebene Syntax- oder Ladefehler auswerten, bevor du weitermachst.
- **Hintergrundwissen** (Konzepte, Modulreferenz, SDK) holt der MCP-Server selbst von symcon.de; nutze das, statt Funktionen zu raten.
- **Rückfrage vor schreibenden Aktionen** auf dem Live-System: Objekte anlegen, umbenennen, verschieben oder löschen, Instanzkonfigurationen ändern, Skripte ausführen, Geräte schalten. Umbenennen und Umstrukturieren im Objektbaum hat keine Rückgängig-Funktion.
- Zugangsdaten in Instanzkonfigurationen erscheinen als `[hidden]` und bleiben beim Zurückschreiben erhalten. Versuche nicht, sie auszulesen.
- Das Token selbst steht nie in Dateien dieses Repos.

## Regeln

- **Klassenstruktur:**
  - Alle Symcon Module erben von `IPSModuleStrict`.
  - Nutze sinnvolle Vererbung der Klassen um Code-Duplikate zu vermeiden.
  - Nutze die globale Helper Klassen, welche per eval in den jeweiligen Namensraum des Moduls geladen werden, um die Funktionalität zu erweitern und sich nicht gegenseitig zu stören. Diese Helper-Klassen sind nicht veränderbar und liegen als Submodul unter `/libs/helper`.  Verwende zum laden der Helper-Klassen folgendes Schema (Beispiel DebugHelper): `eval('declare(strict_types=1);namespace <HIER_DEN_MODUL_NAMESPACE_EINTRAGEN> {?>' . file_get_contents(dirname(__DIR__) . '/libs/helper/DebugHelper.php') . '}');`.
  - Fehlen die Helper-Klassen, so müssen sie per Kommandozeile und mit git geclont werden (als Submodule, Branch `strict` ). Nur dann ist die Quelle `https://github.com/Nall-chan/SymconModulHelper` zu nutzen. Die Helper-Klassen sind nicht Bestandteil der Library und werden nur als Hilfsmittel genutzt, um die Entwicklung zu vereinfachen.
- **Dateistruktur:**
  - Der Aufbau ist hier genauer beschrieben: `https://www.symcon.de/de/llms/developer/sdk-tools/sdk-php.md`
  - `module.json`: Modul-Metadaten (GUIDs, Name, Typ).
  - `form.json`: Konfigurationsformular für die Console.
  - `module.php`: Hauptklasse des Moduls.
  - `locale.json`: Übersetzungen.
- **Lebenszyklus-Methoden:**
  - Der Aufbau ist hier genauer beschrieben: `https://www.symcon.de/de/llms/developer/sdk-tools/sdk-php/module.md`
  - `Create()`: Properties mit `$this->RegisterPropertyString(...)` etc. registrieren. Timer und Attribute registrieren. Buffer initialisieren.
  - `ApplyChanges()`: Einstellungen anwenden, Timer & Messages registrieren. Eventuell die Verbindung zu einem Gerät aufbauen. Status setzen. Statusvariablen anlegen. Buffer initialisieren.
  - **Buffer:** Laufzeitzustand wird über den BufferHelper (`/libs/helper/BufferHelper.php`) als Eigenschaft der Klasse gehalten (`$this->Name = ...`), nicht über `GetBuffer`/`SetBuffer` direkt. Jede Eigenschaft im Klassen-Docblock als `@property <typ> $Name` deklarieren und in `Create()` **und** `ApplyChanges()` initialisieren (`= []`, `= 0`, `= ''`). Arrays und Objekte werden serialisiert gespeichert, kein `json_encode` nötig.
- **Konventionen:**
  - Nutze `$this->SendDebug('Headline', 'Data', 0)` für Logging.
  - Nutze `$this->SetStatus(...)` für Modulzustände (z. B. 102 = Aktiv; Werte ab 200 aufwärts sind verschiedene Fehlerzustände, z. B. `IS_EBASE + 1`).
  - Nutze keine IPS_ Funktionen direkt, sondern die Methoden der IPSModuleStrict-Klasse, außer es existiert keine entsprechende Methode. Ausnahmen sind z. B. Systeminformationen per `IPS_GetSystemLanguage()` oder `IPS_GetKernelDir()` sowie das Lesen fremder Instanzen in Konfigurator und Discovery (`IPS_GetInstance`, `IPS_GetInstanceListByModuleID`). Statt `IPS_Sleep` PHPs `usleep` verwenden.
  - Sandboxing: Zugriff auf Symcon Objekte außerhalb der eigenen Modulinstanz ist nur lesend erlaubt, Ausnahme ist das Schalten von Variablen mit RequestAction.
  - Nutze anständige Namenskonventionen für Variablen, Methoden und Klassen.
  - Deklariere wiederkehrende Strings als Konstanten, um Tippfehler zu vermeiden.
  - Wahrung der Hoheit des Nutzers: Die Module sollen so entwickelt werden, dass der Nutzer die volle Kontrolle über die Konfiguration und Nutzung der Module hat. Es sollten keine versteckten Funktionen oder Abhängigkeiten implementiert werden, die den Nutzer einschränken oder die Nutzung der Module behindern. Ebenso dürfen keine Objektnamen (auch Symcon Statusvariablen sind Objekte) ohne Zustimmung des Nutzers geändert werden.
  - Sollen Objekte aus dem Symcon Objektbaum gelöscht werden, so muss der Nutzer dies explizit bestätigen bzw. vorher darauf hingewiesen werden. Das gilt für den Modulcode ebenso wie für deine eigenen Aktionen über den MCP-Server.
  - **Sensible Daten:** Schlüsselmaterial, Passwörter, WLAN-Zugangsdaten und Tokens nie im Klartext per `SendDebug` ausgeben (maskieren, ggf. nur die Länge). Funktionen, die solche Daten setzen oder auslesen, nur umsetzen, wenn sie einen klaren Mehrwert haben, sonst in den Backlog.
  - **Fremdquellen:** Werden Code, Tabellen oder Protokolldetails aus anderen Projekten übernommen, Lizenz prüfen und Quelle samt Copyright im Dateikopf und in der README nennen.
- **Statusvariablen:**
  - Der Name einer Statusvariable beschreibt genau ihren Inhalt (z. B. Zähler vs. aktueller Zustand).
  - Übersetzungen in `locale.json` eintragen und das Modul neu laden, **bevor** neue Variablen live angelegt werden. Ein Modul benennt bestehende Variablen nie selbst um; Namensänderungen kommen mit Hinweis in den Changelog.
  - Parameternamen unterscheiden sich je Darstellung, auch innerhalb von `OPTIONS` (z. B. Aufzählung `Color`, Wertanzeige `ColorActive`/`ColorValue`). `MULTILINE` gibt es nur bei Strings. Bei vielen Variablendefinitionen die Parameterlisten aus `IPS_GetPresentation` als JSON unter `tests/` ablegen und alle Definitionen per Unit-Test dagegen prüfen, ebenso, ob jede Beschriftung übersetzt ist.
  - Nur Darstellungsparameter verwenden, die die gewählte Darstellung für den Variablentyp kennt (prüfen mit `IPS_GetPresentation`, Gruppen je Variablentyp). Fehler fallen erst auf, wenn sich die Darstellung ändert. Neue oder geänderte Darstellungen daher mit einer neu angelegten Variable testen.
  - **Symbole:** `ICON` (bzw. `IconValue` in `OPTIONS`) akzeptiert neben den klassischen Symcon-Symbolen auch Font-Awesome-Namen, z. B. `bolt`, `wifi`, `circle-check`, `circle-exclamation`, `temperature-half`, `stopwatch`, `microchip`, `barcode` (alle in der Kachel-Visualisierung geprüft). `UC_GetIconList` listet nur die klassischen Symbole; fehlt ein Name dort, ist er deshalb nicht ungültig. Neue Font-Awesome-Namen vor dem Einsatz sichtbar prüfen (`symcon_tile_preview` mit der Variable). Das klassische WebFront zeigt Font-Awesome-Symbole nicht an (in der README bei „WebFront Visualisierung“ erwähnen). Die Darstellung Datum/Uhrzeit hat keinen Parameter `ICON`; ein Symbol ginge dort nur über das Objekt-Symbol, und das gehört dem Nutzer.
  - Skalierung und Einheit jedes Rohwerts belegen: Referenzimplementierung, Herstellerdoku oder Plausibilitätsrechnung mit Live-Werten. Annahmen im Code-Kommentar und in `STATUS.md` kennzeichnen.
  - Liefert ein Gerät einen Wert nicht mit, darf er nicht als 0 oder Fehler gewertet werden, wenn das Protokoll „fehlt“ und „0“ nicht unterscheidet (z. B. Protobuf proto3). Wertvariablen behalten dann ihren letzten Wert. Status- und Alarmvariablen gehen erst nach mehreren Abfragen in Folge ohne Wert auf Alarm.
- **Namenskonventionen:**
  - Klassenname = Modulname (z. B. `MyModule`).
  - Methoden in CamelCase (z. B. `GetStatus()`).
  - Variablen in CamelCase (z. B. `$myVariable`).
  - Klassenkonstanten in CamelCase (z. B. `public const PowerLimit = 'pLim';`). Konstanten werden thematisch in eigenen Klassen gruppiert (z. B. `Property`, `Variables`, `Timer`, `Attribute`, `Locks`), bei modulübergreifender Nutzung in einer gemeinsamen Datei unter `/libs`.
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
    - `> [!NOTE]` Einschränkungen und Hintergrundinfos (z.B. „Wird nicht von allen Quellen unterstützt!“, Funktion aktuell nicht verfügbar).
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
- **Code-Qualität:**
  - Vermeide unnötige Abhängigkeiten und externe Bibliotheken, außer es ist zwingend notwendig.
  - Nutze sinnvolle Kommentare, um den Code verständlich zu machen.
  - Als Style für PHP-CS-Fixer wird die unter `./.style` vorhandene Konfiguration verwendet, welche als [Submodule](https://github.com/Nall-chan/StylePHP) eingebunden wird.
  - Nutze den im Ordner `./.style` vorhanden Stil für die Codeformatierung. Die Ausführung erfolgt über die Tasks in Visual Studio Code, welche in `.vscode/tasks.json` als `CS-Fixer (fix)` und `CS-Fixer (check)` vorhanden sind. Außerhalb von VS Code den in diesen Tasks hinterlegten Befehl direkt im Terminal ausführen.
  - PHP-CS-Fixer (auch `fix`) nur mit einzelnen Dateinamen aufrufen, nie auf ein Verzeichnis wie `libs/`: sonst ändert er die Submodule (`libs/helper`). Versehentliche Änderungen dort mit `git -C libs/helper checkout -- .` zurücknehmen.
  - Vor **jedem** Commit PHP-CS-Fixer im Check-Modus über alle geänderten PHP-Dateien laufen lassen; der GitHub-Check (`action-style@strict`) ist maßgeblich. Fehlt `.style/.php-cs-fixer.php`, das Submodul aktualisieren (`git submodule update --init -- .style`). Unter Windows auf UNC-Pfaden meldet der Fixer Dateien mit CRLF-Zeilenenden fälschlich; das ist kein Fehler im Repo.
  - Schreibe Unit-Tests für die Module, um die Funktionalität zu gewährleisten (im Ordner `./tests`, Symcon-Stubs als Submodul unter `./tests/stubs`).
  - Protokoll-Code (Parser, Encoder, Verschlüsselung) ohne Symcon-Abhängigkeit in lib-Klassen halten und mit Referenzvektoren aus anderen Implementierungen oder echten Mitschnitten testen.
  - Entsprechende Tasks sind in Visual Studio Code vorhanden, durch den Einsatz eines [Submodul unter `./.vscode`](https://github.com/Nall-chan/SymconVSCTasks.git)
- **Allgemeine Anforderungen an eine Library**
  - Die Instanzen sollen vom User einfach eingerichtet werden können, ohne dass tiefgehende Programmierkenntnisse erforderlich sind.
  - Entsprechend sind Discovery-Instanzen (automatische Erkennung von Geräten im Netzwerk) vorgesehen, die dem User die Einrichtung erleichtern.
  - Sowie Konfigurator-Instanzen, welche dem User bei der Anlage und Einrichtung der jeweiligen Geräte-Instanzen unterstützen.
  - Die Library sollte modular aufgebaut sein, um die Erweiterbarkeit zu gewährleisten.
  - Die Library sollte eine klare Trennung zwischen der Logik der Module und der Benutzeroberfläche (Formulare) haben.
  - Die Library sollte eine konsistente Fehlerbehandlung implementieren, um die Stabilität der Module zu gewährleisten.
  - Die Library sollte eine umfassende Dokumentation enthalten, um die Nutzung und Erweiterung der Module zu erleichtern.
- **Fehlerbehandlung:**
  - Fehlermeldungen landen immer beim Aufrufer.
  - Fehler werden per `trigger_error(..., E_USER_NOTICE)` gemeldet und die Funktion gibt `false` zurück; interne Fehler landen so automatisch im Log. `E_USER_NOTICE` statt `E_USER_WARNING`, weil eine Notice das aufrufende Skript nicht abbricht.
  - Bei Bedienaktionen aus dem Frontend (`RequestAction` einer Statusvariable) muss der Fehler dem Nutzer angezeigt werden. Dafür setzt `RequestAction` per `set_error_handler([$this, 'ModulErrorHandler'], E_USER_NOTICE | E_USER_WARNING)` einen Handler, der die Meldung per `echo` ausgibt, ruft den eigentlichen Action-Handler auf und stellt den Handler im `finally` wieder her. So bleibt es im Code einheitlich bei `trigger_error`.
  - Symcon verwirft den Rückgabewert einer Instanz-Funktion, sobald sie eine Fehlermeldung erzeugt (auch `E_USER_NOTICE`); der Aufrufer erhält dann `false`. Hinweise, bei denen das Ergebnis trotzdem ankommen soll (z.B. veraltete Funktionsnamen), daher per `$this->LogMessage(..., KL_WARNING)` statt `trigger_error`.
  - Rückgabewerte von Instanz-Funktionen sind auf 1 MB begrenzt („Output-Buffer exceeds Limit“, Rückgabe `false`). Große Listen nur seitenweise liefern (Funktionen mit Start/Anzahl) oder auf die nötigen Felder kürzen.
  - Jede Ausgabe (auch `echo`) in `ApplyChanges` wird von Symcon als Fehler gewertet. Das ist gewollt, wenn das Gerät nicht erreichbar ist: Für nicht dauerhaft erreichbare Geräte konfiguriert der Nutzer Watchdog/Bedingung.
  - Folgeanfragen nach einem fehlgeschlagenen Verbindungsaufbau unterlassen, damit keine Doppelmeldungen entstehen.
  - Jede Fehlermeldung mit `$this->Translate()` ausgeben und in `locale.json` übersetzen.
  - Ungültige Parameterkombinationen in öffentlichen Funktionen vor dem Senden abfangen und melden.
  - Wertebereiche von Stellwerten aus Gerätedoku oder Referenzimplementierung übernehmen (z. B. Leistungslimit 2–100 %), nicht aus der Darstellung der Variable.
  - Fehler bei optionalen Zusatzabfragen (z. B. Diagnosedaten, die nicht jedes Gerät oder jede Firmware unterstützt) nur per `SendDebug` ausgeben. Sie ändern weder den Instanzstatus noch erzeugen sie Log-Meldungen.
- **Allgemeine Anforderungen an die Module**
  - Discovery und Konfigurator-Instanzen erzeugen Output für ein Configurator-Element. Diese Instanzen müssen GetConfigurationForm() so implementieren, dass die Ergebnisse (suche Geräte und gleiche mit vorhandenen Instanzen in Symcon ab) im Configurator Element korrekt im Feld Values als Tabelle dargestellt werden.

## Arbeitsabläufe

- **Textersetzungen per Skript:** Das Zeilenende der Datei übernehmen (Repos enthalten oft CRLF und LF gemischt), sonst passen Suchmuster nicht und Diffs werden unlesbar. In READMEs die zwei Leerzeichen am Zeilenende (harter Umbruch, z. B. in Changelog-Listen) erhalten. Texte mit Backslashes nicht über Shell-Heredocs mit Ersetzung schreiben.
- **Live-Dateien:** Die Moduldateien liegen direkt im Modulverzeichnis von Symcon und sind sofort aktiv. Voneinander abhängige Änderungen (z.B. neue Konstante in einer lib-Datei und deren Nutzung in `module.php`) erst vollständig vorbereiten und dann in einem Schritt schreiben, die definierende Datei zuerst. Danach `php -l` und, wenn nötig, `module_reload` über den MCP-Server.
- **Live-Tests:** Instanzfunktionen über `symcon_call` bzw. `IPS_RunScriptTextWait` aufrufen (Rückgabewert per `var_dump`, Statusvariablen per `GetValueFormatted` prüfen). `symcon_call` ist nicht in jeder Server-Version verfügbar; `IPS_RunScriptTextWait` benötigt eine Erlaubnisregel in den Claude-Code-Einstellungen (nicht in Symcon). Debug-Ausgaben mit `IPS_EnableDebug(ID, Sekunden)` aktivieren und mit `symcon_debug` lesen. Tests mit Geräten nur auf den in `CLAUDE.md`/`CLAUDE.local.md` freigegebenen Testinstanzen.
- **Prüfung vor Abschluss:** `php -l`, PHP-CS-Fixer (Konfiguration `./.style`, Option `--allow-risky=yes`), JSON-Dateien (`locale.json`, `form.json`) auf Gültigkeit prüfen, Unit-Tests ausführen.
- **Modul neu laden:** `module_reload` verbindet alle Instanzen neu. Verbindungsfehler direkt während des Reloads (z. B. Zeitüberschreitung, nicht erreichbares Gerät) sind keine Codefehler; danach Log und Debug der nächsten Zyklen prüfen.
- **Versionierung:** Jede veröffentlichte Version erhält eine neue Versionsnummer (`library.json`: `version`, `build`, `date`) und einen eigenen Changelog-Abschnitt. Eine bereits im Store veröffentlichte Version wird nicht nachträglich geändert.
- **Umbenannte öffentliche Funktionen:** Der alte Name bleibt als Alias erhalten, ruft die neue Funktion auf und meldet per `LogMessage(..., KL_WARNING)`, in welcher Version er entfernt wird. Entfernt wird frühestens mit der nächsten Minor-Version (z.B. 3.10 → 3.20). Termin in `STATUS.md` vermerken.
- **Testdaten von Nutzern:** Debug-Logs, Mitschnitte und Screenshots von Nutzern enthalten oft Seriennummern oder Netzwerkdaten. Nie einchecken (per `.gitignore` ausschließen) und in `STATUS.md` nur anonymisiert zitieren.
- Commits nur auf ausdrücklichen Wunsch des Nutzers.

## Arbeitsstand pflegen

- Lies zu Beginn einer Aufgabe `STATUS.md` im Hauptordner des Projekts.
- Aktualisiere `STATUS.md`, wenn eine Aufgabe erledigt, eine Option verworfen (mit Begründung) oder eine neue offene Aufgabe erkannt wurde.

## Sparsamer Umgang mit Kontext

- **Debug lesen (`symcon_debug`):** Immer mit `contains` filtern (z. B. Befehl oder Meldungsname), `limit` klein halten und über `since` nur neue Einträge lesen. Rohe Statusmeldungen von Geräten nicht ungefiltert abrufen.
- **Log (`symcon_log`):** Immer mit `sender_ids` der eigenen Instanzen bzw. `sender` und `types` filtern.
- **Objektbaum (`symcon_tree`):** Bei Instanzen mit großen Variablen (HTML-Boxen, JSON) `values:false` verwenden; Werte gezielt per `GetValueFormatted` lesen.
- **Suchen und Lesen:** Erst zählen (`grep -c`, `output_mode: count`), dann gezielt einzelne Stellen lesen. Große Dateien nur abschnittsweise lesen.
- **Werkzeugausgaben kürzen:** PHPUnit, PHP-CS-Fixer und Skripte nur mit `| tail -n …` bzw. `grep` auf das Ergebnis ausgeben; CS-Fixer ohne `--diff`, außer der Diff wird gebraucht.
- **Mehrzeilige Ersetzungen:** Nicht per `php -r`, Heredoc oder `sed` mit Backslashes, sondern über eine Skriptdatei im Scratchpad (Suchtext und Ersatz als Nowdoc). Das vermeidet Fehlversuche durch Shell-Quoting.
- **STATUS.md schlank halten:** Sie wird bei jedem Sitzungsstart und nach jeder Änderung vollständig geladen. Erledigte Umsetzungsprotokolle nach dem Commit in `STATUS-Archiv.md` verschieben (nicht in CLAUDE.md eingebunden); in STATUS.md nur offene Punkte, Entscheidungen und Testhinweise behalten.
- **Lange Live-Tests:** Abfragen in kurzen Schritten (unter ca. 60 s je Aufruf) statt einer langen Schleife, sonst bricht der MCP-Aufruf mit Timeout ab.
