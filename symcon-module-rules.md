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
  - Nutze keine IPS_ Funktionen direkt, sondern die Methoden der IPSModuleStrict-Klasse, außer es existiert keine entsprechende Methode. Ausnahmen sind z. B. Systeminformationen per `IPS_GetSystemLanguage()` oder `IPS_GetKernelDir()`.
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
  - Nur Darstellungsparameter verwenden, die die gewählte Darstellung für den Variablentyp kennt (prüfen mit `IPS_GetPresentation`, Gruppen je Variablentyp). Fehler fallen erst auf, wenn sich die Darstellung ändert. Neue oder geänderte Darstellungen daher mit einer neu angelegten Variable testen.
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
    - `symcon_tile_preview` kann das nicht: es nimmt nur Variablen an. Stattdessen die echte Kachel-Visualisierung (`http://127.0.0.1:3777/tile/`) verwenden. Sie zeigt nur Objekte unterhalb ihrer Basis-Kategorie und kennt keine Direktlinks (die URL ändert sich beim Navigieren nicht). Daher eine Testkategorie unterhalb der Basis anlegen (nach Rückfrage; IDs in `CLAUDE.local.md`) und darin **einen** Link, der nacheinander per `IPS_SetLinkTargetID` auf die Instanzen zeigt und per `IPS_SetName` den Instanznamen bekommt. Größe und Position der Kachel gehören zum Link und bleiben so erhalten.
    - Aufnahme mit `.claude-rules/tools/tile-screenshot.mjs` (Node ≥ 22, Edge headless über das DevTools-Protokoll): Seite laden (`wait:15000`), Kategorie-Schaltfläche klicken, Kachel maximieren, `shot`. Breite immer 1174 px. Mit Höhe 800 navigieren (bei anderer Höhe verschieben sich die Schaltflächen der Startseite) und erst vor dem Maximieren per `size:1174,3000` vergrößern. Danach `.claude-rules/tools/crop-dialog.ps1` schneidet den Dialog auf den Inhalt zu. Koordinaten vorher mit einem `shot` ermitteln. Vor der Aufnahme die Maus wegbewegen (`move`), sonst ist ein Symbol hervorgehoben. Ausgabepfad ohne Leerzeichen, danach in den Modulordner kopieren.
    - Jedes Bild vor dem Einbinden ansehen. Die Bilder zeigen echte Werte; vorher mit dem Nutzer klären, ob sensible Werte (Passwörter, externe IPs, Seriennummern, Namen) enthalten sein dürfen.
    - Beschreibungstext an das Bild angleichen (z. B. zeigen boolesche Variablen ohne Aktion einen An/Aus-Wert statt eines Schalters, HTML-Boxen und Bilder erscheinen in der Liste als Symbol zum Öffnen).
  - Jede für Nutzer sichtbare Änderung erhält einen Eintrag im Changelog der Haupt-README.
- **Code-Qualität:**
  - Vermeide unnötige Abhängigkeiten und externe Bibliotheken, außer es ist zwingend notwendig.
  - Nutze sinnvolle Kommentare, um den Code verständlich zu machen.
  - Als Style für PHP-CS-Fixer wird die unter `./.style` vorhandene Konfiguration verwendet, welche als [Submodule](https://github.com/Nall-chan/StylePHP) eingebunden wird.
  - Nutze den im Ordner `./.style` vorhanden Stil für die Codeformatierung. Die Ausführung erfolgt über die Tasks in Visual Studio Code, welche in `.vscode/tasks.json` als `CS-Fixer (fix)` und `CS-Fixer (check)` vorhanden sind. Außerhalb von VS Code den in diesen Tasks hinterlegten Befehl direkt im Terminal ausführen.
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
  - Bei Bedienaktionen aus dem Frontend (`RequestAction` einer Statusvariable) wird der Fehler per `echo` ausgegeben, damit er dem Nutzer angezeigt wird.
  - Bei allen anderen Aufrufern (Skripte, Timer, interne Abläufe) per `trigger_error(..., E_USER_NOTICE)` und Rückgabe `false`; interne Fehler landen so automatisch im Log.
  - Jede Ausgabe (auch `echo`) in `ApplyChanges` wird von Symcon als Fehler gewertet. Das ist gewollt, wenn das Gerät nicht erreichbar ist: Für nicht dauerhaft erreichbare Geräte konfiguriert der Nutzer Watchdog/Bedingung.
  - Folgeanfragen nach einem fehlgeschlagenen Verbindungsaufbau unterlassen, damit keine Doppelmeldungen entstehen.
  - Jede Fehlermeldung mit `$this->Translate()` ausgeben und in `locale.json` übersetzen.
  - Ungültige Parameterkombinationen in öffentlichen Funktionen vor dem Senden abfangen und melden.
  - Wertebereiche von Stellwerten aus Gerätedoku oder Referenzimplementierung übernehmen (z. B. Leistungslimit 2–100 %), nicht aus der Darstellung der Variable.
  - Fehler bei optionalen Zusatzabfragen (z. B. Diagnosedaten, die nicht jedes Gerät oder jede Firmware unterstützt) nur per `SendDebug` ausgeben. Sie ändern weder den Instanzstatus noch erzeugen sie Log-Meldungen.
- **Allgemeine Anforderungen an die Module**
  - Discovery und Konfigurator-Instanzen erzeugen Output für ein Configurator-Element. Diese Instanzen müssen GetConfigurationForm() so implementieren, dass die Ergebnisse (suche Geräte und gleiche mit vorhandenen Instanzen in Symcon ab) im Configurator Element korrekt im Feld Values als Tabelle dargestellt werden.

## Arbeitsabläufe

- **Live-Dateien:** Die Moduldateien liegen direkt im Modulverzeichnis von Symcon und sind sofort aktiv. Voneinander abhängige Änderungen (z.B. neue Konstante in einer lib-Datei und deren Nutzung in `module.php`) erst vollständig vorbereiten und dann in einem Schritt schreiben, die definierende Datei zuerst. Danach `php -l` und, wenn nötig, `module_reload` über den MCP-Server.
- **Live-Tests:** Instanzfunktionen über `symcon_call` bzw. `IPS_RunScriptTextWait` aufrufen (Rückgabewert per `var_dump`, Statusvariablen per `GetValueFormatted` prüfen). `symcon_call` ist nicht in jeder Server-Version verfügbar; `IPS_RunScriptTextWait` benötigt eine Erlaubnisregel in den Claude-Code-Einstellungen (nicht in Symcon). Debug-Ausgaben mit `IPS_EnableDebug(ID, Sekunden)` aktivieren und mit `symcon_debug` lesen. Tests mit Geräten nur auf den in `CLAUDE.md`/`CLAUDE.local.md` freigegebenen Testinstanzen.
- **Prüfung vor Abschluss:** `php -l`, PHP-CS-Fixer (Konfiguration `./.style`, Option `--allow-risky=yes`), JSON-Dateien (`locale.json`, `form.json`) auf Gültigkeit prüfen, Unit-Tests ausführen.
- **Modul neu laden:** `module_reload` verbindet alle Instanzen neu. Verbindungsfehler direkt während des Reloads (z. B. Zeitüberschreitung, nicht erreichbares Gerät) sind keine Codefehler; danach Log und Debug der nächsten Zyklen prüfen.
- **Versionierung:** Jede veröffentlichte Version erhält eine neue Versionsnummer (`library.json`: `version`, `build`, `date`) und einen eigenen Changelog-Abschnitt. Eine bereits im Store veröffentlichte Version wird nicht nachträglich geändert.
- **Testdaten von Nutzern:** Debug-Logs, Mitschnitte und Screenshots von Nutzern enthalten oft Seriennummern oder Netzwerkdaten. Nie einchecken (per `.gitignore` ausschließen) und in `STATUS.md` nur anonymisiert zitieren.
- Commits nur auf ausdrücklichen Wunsch des Nutzers.

## Arbeitsstand pflegen

- Lies zu Beginn einer Aufgabe `STATUS.md` im Hauptordner des Projekts.
- Aktualisiere `STATUS.md`, wenn eine Aufgabe erledigt, eine Option verworfen (mit Begründung) oder eine neue offene Aufgabe erkannt wurde.
