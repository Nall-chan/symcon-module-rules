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
  - **Attribute** (dauerhaft gespeicherter Zustand): `RegisterAttribute…` nur in `Create()` aufrufen, nie in `ApplyChanges()` (ein zweites Registrieren löst eine Warnung aus und lässt die Instanz im Status 101 hängen). Ein Modul-Reload führt für alle Instanzen `Create()` erneut aus, neue Attribute stehen danach auch vorhandenen Instanzen zur Verfügung. Nicht unmittelbar nach `module_reload` testen: Bis die Instanzen neu erstellt sind, melden Aufrufe „Attribute … not found“ bzw. „InstanceInterface is not available“. Das sind Reload-Effekte und keine Codefehler.
  - Der Code verlässt sich nur auf **eigene Daten** (Properties, Attribute, Buffer). Anzeigefelder wie die Zusammenfassung (`SetSummary`), der Objektname oder Variablen anderer Instanzen sind keine Datenquelle.
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
  - **Fremdquellen:** Werden Code oder Tabellen aus anderen Projekten übernommen, Lizenz prüfen und Quelle samt Copyright im Dateikopf und in der README nennen, wenn Code kopiert wurde. Protokolldetails welche zum Verständnis der Funktionsweise dienen, dürfen analysiert werden, ohne dass die Lizenz geprüft oder die Quelle genannt werden muss.
- **Statusvariablen:**
  - Der Name einer Statusvariable beschreibt genau ihren Inhalt (z. B. Zähler vs. aktueller Zustand).
  - Übersetzungen in `locale.json` eintragen und das Modul neu laden, **bevor** neue Variablen live angelegt werden. Ein Modul benennt bestehende Variablen nie selbst um; Namensänderungen kommen mit Hinweis in den Changelog.
  - Parameternamen unterscheiden sich je Darstellung, auch innerhalb von `OPTIONS` (z. B. Aufzählung `Color`, Wertanzeige `ColorActive`/`ColorValue`). `MULTILINE` gibt es nur bei Strings. Bei vielen Variablendefinitionen die Parameterlisten aus `IPS_GetPresentation` als JSON unter `tests/` ablegen und alle Definitionen per Unit-Test dagegen prüfen, ebenso, ob jede Beschriftung übersetzt ist.
  - Intervalle der Wertanzeige (`INTERVALS`) mit `GetValueFormatted` oder `symcon_tile_preview` an einer eigenen Testvariable prüfen. `GetValueFormattedEx` wendet Intervalle nicht an (Symcon 9.1 Rust-Edition) und eignet sich dafür nicht. Der Wert wird durch den `ConversionFactor` geteilt (Faktor 1000 zeigt 1500 W als 1,50 kW, Faktor 0,001 zeigt 0,5 W als 500 mW; live geprüft).
  - Nur Darstellungsparameter verwenden, die die gewählte Darstellung für den Variablentyp kennt (prüfen mit `IPS_GetPresentation`, Gruppen je Variablentyp). Fehler fallen erst auf, wenn sich die Darstellung ändert. Neue oder geänderte Darstellungen daher mit einer neu angelegten Variable testen.
  - **Symbole:** `ICON` (bzw. `IconValue` in `OPTIONS`) akzeptiert neben den klassischen Symcon-Symbolen auch Font-Awesome-Namen, z. B. `bolt`, `wifi`, `circle-check`, `circle-exclamation`, `temperature-half`, `stopwatch`, `microchip`, `barcode` (alle in der Kachel-Visualisierung geprüft). `UC_GetIconList` listet nur die klassischen Symbole; fehlt ein Name dort, ist er deshalb nicht ungültig. Neue Font-Awesome-Namen vor dem Einsatz sichtbar prüfen (`symcon_tile_preview` mit der Variable). Das klassische WebFront zeigt Font-Awesome-Symbole nicht an (in der README bei „WebFront Visualisierung“ erwähnen). Die Darstellung Datum/Uhrzeit hat keinen Parameter `ICON`; ein Symbol ginge dort nur über das Objekt-Symbol, und das gehört dem Nutzer.
  - Skalierung und Einheit jedes Rohwerts belegen: Referenzimplementierung, Herstellerdoku oder Plausibilitätsrechnung mit Live-Werten. Annahmen im Code-Kommentar und in `STATUS.md` kennzeichnen.
  - Liefert ein Gerät einen Wert nicht mit, darf er nicht als 0 oder Fehler gewertet werden, wenn das Protokoll „fehlt“ und „0“ nicht unterscheidet (z. B. Protobuf proto3). Wertvariablen behalten dann ihren letzten Wert. Status- und Alarmvariablen gehen erst nach mehreren Abfragen in Folge ohne Wert auf Alarm.
- **Namenskonventionen:**
  - Klassenname = Modulname (z. B. `MyModule`).
  - Methoden in CamelCase (z. B. `GetStatus()`).
  - Variablen in CamelCase (z. B. `$myVariable`).
  - Klassenkonstanten in CamelCase (z. B. `public const PowerLimit = 'pLim';`). Konstanten werden thematisch in eigenen Klassen gruppiert (z. B. `Property`, `Variables`, `Timer`, `Attribute`, `Locks`), bei modulübergreifender Nutzung in einer gemeinsamen Datei unter `/libs`.
- **Dokumentation (PHPDoc, READMEs, Screenshots, Changelog):** Details in `.claude-rules/readme-regeln.md`. Diese Datei vor jeder Arbeit an einer README, an Screenshots oder am Changelog lesen. Kurzfassung: PHPDoc für Klassen, Methoden und Variablen; jede für Nutzer sichtbare Änderung bekommt einen Changelog-Eintrag in der Haupt-README; Zielplattform der READMEs ist GitHub.
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
  - Fehler werden per `echo $this->Translate('…') . PHP_EOL;` gemeldet und die Funktion gibt `false` zurück. In der Symcon Rust-Edition gilt jede Ausgabe innerhalb eines Funktionsaufrufs als Fehler dieses Aufrufs, jeder Aufruf wird einzeln betrachtet (PHP-SDK-Änderung). Der Aufrufer erhält nur den Text, ohne Dateinamen und Zeilennummer. Kein `trigger_error` verwenden: Es hängt Dateiname und Zeile an (`Notice: … in …\module.php on line N`) und macht die Meldung unnötig lang.
  - Der Fehler geht automatisch an den Aufrufer: bei einer Bedienaktion (`RequestAction` einer Statusvariable) an das Frontend, bei Timern in das Log, bei Skripten und Ereignissen zurück an das Skript bzw. Ereignis und von dort in das Log. Es ist kein eigener Fehler-Handler in `RequestAction` nötig.
  - Symcon verwirft den Rückgabewert einer Instanz-Funktion, sobald sie eine Ausgabe (Fehlermeldung) erzeugt; der Aufrufer erhält dann `false`. Hinweise, bei denen das Ergebnis trotzdem ankommen soll (z.B. veraltete Funktionsnamen), daher per `$this->LogMessage(..., KL_WARNING)` statt `echo`.
  - Gewollte Ausgaben (z. B. die Rückmeldung eines Formular-Buttons oder ein Link) dürfen nicht per `echo` innerhalb der Funktion erfolgen, sie wären ein Fehler. Die Funktion gibt den Text zurück, das Formular gibt ihn aus: `"onClick": "echo PREFIX_Funktion($id);"` (Beispiel: paresy/Viessmann, Commit 2ea013b). Ein `echo` direkt im `onClick` (Skript des Formulars) ist keine Funktion und unkritisch.
  - Rückgabewerte von Instanz-Funktionen sind auf 1 MB begrenzt („Output-Buffer exceeds Limit“, Rückgabe `false`). Große Listen nur seitenweise liefern (Funktionen mit Start/Anzahl) oder auf die nötigen Felder kürzen.
  - Jede Ausgabe (auch `echo`) in `ApplyChanges` wird von Symcon als Fehler gewertet. Das ist gewollt, wenn das Gerät nicht erreichbar ist: Für nicht dauerhaft erreichbare Geräte konfiguriert der Nutzer Watchdog/Bedingung.
  - Folgeanfragen nach einem fehlgeschlagenen Verbindungsaufbau unterlassen, damit keine Doppelmeldungen entstehen.
  - Jede Fehlermeldung mit `$this->Translate()` ausgeben und in `locale.json` übersetzen.
  - Ungültige Parameterkombinationen in öffentlichen Funktionen vor dem Senden abfangen und melden.
  - Wertebereiche von Stellwerten aus Gerätedoku oder Referenzimplementierung übernehmen (z. B. Leistungslimit 2–100 %), nicht aus der Darstellung der Variable.
  - Fehler bei optionalen Zusatzabfragen (z. B. Diagnosedaten, die nicht jedes Gerät oder jede Firmware unterstützt) nur per `SendDebug` ausgeben. Sie ändern weder den Instanzstatus noch erzeugen sie Log-Meldungen.
- **Allgemeine Anforderungen an die Module**
  - Discovery und Konfigurator-Instanzen erzeugen Output für ein Configurator-Element. Diese Instanzen müssen GetConfigurationForm() so implementieren, dass die Ergebnisse (suche Geräte und gleiche mit vorhandenen Instanzen in Symcon ab) im Configurator Element korrekt im Feld Values als Tabelle dargestellt werden.
  - **Zusammenfassung (`SetSummary`):** Konfiguratoren, Splitter und IOs zeigen in der Zusammenfassung entweder ihren eigenen Host bzw. ihre eigene Schnittstelle (z. B. IP/Port, serieller Port) oder die des jeweiligen Parent an. Die Zusammenfassung ist nur eine Anzeige und keine Datenquelle (siehe Lebenszyklus-Methoden).

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
