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
  - Bei Modulübergreifenden Konstanten sollten diese in einer eigenen Datei und Klasse definiert werden.
- **Dateistruktur:**
  - Der Aufbau ist hier genauer beschrieben: `https://www.symcon.de/de/llms/developer/sdk-tools/sdk-php.md`
  - `module.json`: Modul-Metadaten (GUIDs, Name, Typ).
  - `form.json`: Konfigurationsformular für die Console.
  - `module.php`: Hauptklasse des Moduls.
  - `locale.json`: Übersetzungen.
- **Lebenszyklus-Methoden:**
  - Der Aufbau ist hier genauer beschrieben: `https://www.symcon.de/de/llms/developer/sdk-tools/sdk-php/module.md`
  - `Create()`: Properties mit `$this->RegisterPropertyString(...)` etc. registrieren. Timer und Attribute registrieren. Buffer initialisieren.
  - `ApplyChanges()`: Einstellungen anwenden, Timer & Messages registrieren. Eventuell die Verbindung zu einem Gerät aufbauen. Status setzen. Statusvariablen anlegen.
- **Konventionen:**
  - Nutze `$this->SendDebug('Headline', 'Data', 0)` für Logging.
  - Nutze `$this->SetStatus(...)` für Modulzustände (z. B. 102 = Aktiv, 201 = Fehler).
  - Nutze keine IPS_ Funktionen direkt, sondern die Methoden der IPSModuleStrict-Klasse, außer es existiert keine entsprechende Methode.
  - Sandboxing: Zugriff auf Symcon Objekte außerhalb der eigenen Modulinstanz ist nur lesend erlaubt, Ausnahme ist das Schalten von Variablen mit RequestAction.
  - Nutze anständige Namenskonventionen für Variablen, Methoden und Klassen.
  - Deklariere wiederkehrende Strings als Konstanten, um Tippfehler zu vermeiden.
  - Wahrung der Hoheit des Nutzers: Die Module sollen so entwickelt werden, dass der Nutzer die volle Kontrolle über die Konfiguration und Nutzung der Module hat. Es sollten keine versteckten Funktionen oder Abhängigkeiten implementiert werden, die den Nutzer einschränken oder die Nutzung der Module behindern. Ebenso dürfen keine Objektnamen (auch Symcon Statusvariablen sind Objekte) ohne Zustimmung des Nutzers geändert werden.
  - Sollen Objekte aus dem Symcon Objektbaum gelöscht werden, so muss der Nutzer dies explizit bestätigen bzw. vorher darauf hingewiesen werden. Das gilt für den Modulcode ebenso wie für deine eigenen Aktionen über den MCP-Server.
- **Namenskonventionen:**
  - Klassenname = Modulname (z. B. `MyModule`).
  - Methoden in CamelCase (z. B. `GetStatus()`).
  - Variablen in CamelCase (z. B. `$myVariable`).
  - Konstanten in UPPER_CASE (z. B. `MY_CONSTANT`).
- **Dokumentation:**
  - Nutze PHPDoc für Klassen, Methoden und Variablen.
  - Beschreibe die Funktionalität und Parameter der Methoden.
  - Dokumentiere die Modulkonfiguration im form.json.
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
  - Jede für Nutzer sichtbare Änderung erhält einen Eintrag im Changelog der Haupt-README.
- **Code-Qualität:**
  - Vermeide unnötige Abhängigkeiten und externe Bibliotheken, außer es ist zwingend notwendig.
  - Nutze sinnvolle Kommentare, um den Code verständlich zu machen.
  - Als Style für PHP-CS-Fixer wird die unter `./.style` vorhandene Konfiguration verwendet, welche als [Submodule](https://github.com/Nall-chan/StylePHP) eingebunden wird.
  - Nutze den im Ordner `./.style` vorhanden Stil für die Codeformatierung. Die Ausführung erfolgt über die Tasks in Visual Studio Code, welche in `.vscode/tasks.json` als `CS-Fixer (fix)` und `CS-Fixer (check)` vorhanden sind. Außerhalb von VS Code den in diesen Tasks hinterlegten Befehl direkt im Terminal ausführen.
  - Schreibe Unit-Tests für die Module, um die Funktionalität zu gewährleisten (im Ordner `./tests`, Symcon-Stubs als Submodul unter `./tests/stubs`).
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
- **Allgemeine Anforderungen an die Module**
  - Discovery und Konfigurator-Instanzen erzeugen Output für ein Configurator-Element. Diese Instanzen müssen GetConfigurationForm() so implementieren, dass die Ergebnisse (suche Geräte und gleiche mit vorhandenen Instanzen in Symcon ab) im Configurator Element korrekt im Feld Values als Tabelle dargestellt werden.

## Arbeitsabläufe

- **Live-Dateien:** Die Moduldateien liegen direkt im Modulverzeichnis von Symcon und sind sofort aktiv. Voneinander abhängige Änderungen (z.B. neue Konstante in einer lib-Datei und deren Nutzung in `module.php`) erst vollständig vorbereiten und dann in einem Schritt schreiben, die definierende Datei zuerst. Danach `php -l` und, wenn nötig, `module_reload` über den MCP-Server.
- **Live-Tests:** Instanzfunktionen über `symcon_call` bzw. `IPS_RunScriptTextWait` aufrufen (Rückgabewert per `var_dump`, Statusvariablen per `GetValueFormatted` prüfen). Debug-Ausgaben mit `IPS_EnableDebug(ID, Sekunden)` aktivieren und mit `symcon_debug` lesen. Tests mit Geräten nur auf den in `CLAUDE.md`/`CLAUDE.local.md` freigegebenen Testinstanzen.
- **Prüfung vor Abschluss:** `php -l`, PHP-CS-Fixer (Konfiguration `./.style`, Option `--allow-risky=yes`), JSON-Dateien (`locale.json`, `form.json`) auf Gültigkeit prüfen, Unit-Tests ausführen.
- Commits nur auf ausdrücklichen Wunsch des Nutzers.

## Arbeitsstand pflegen

- Lies zu Beginn einer Aufgabe `STATUS.md` im Hauptordner des Projekts.
- Aktualisiere `STATUS.md`, wenn eine Aufgabe erledigt, eine Option verworfen (mit Begründung) oder eine neue offene Aufgabe erkannt wurde.
