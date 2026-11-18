# Unit-Tests mit den Symcon-Stubs

Die [SymconStubs](https://github.com/symcon/SymconStubs) bilden Kernel, Objektbaum, Instanzen, Variablen, Archiv, Debug und Log in PHP nach. Damit lassen sich Module als echte Instanzen testen, ohne Live-System und ohne Eingriff in den Objektbaum des Nutzers (z. B. Migrationen, Variablen anlegen/verschieben, Datenfluss). Eingebunden als Submodul unter `tests/stubs`.

## Aufbau eines Tests

```php
<?php

declare(strict_types=1);

include_once __DIR__ . '/stubs/autoload.php';

use PHPUnit\Framework\TestCase;

class MyModuleTest extends TestCase
{
    private const ModuleID = '{…}'; // GUID aus module.json

    public function setUp(): void
    {
        IPS\Kernel::reset();                                                   // leerer Kernel je Test
        IPS\ModuleLoader::loadLibrary(__DIR__ . '/../library.json');           // eigene Library
        IPS\ModuleLoader::loadLibrary(__DIR__ . '/stubs/CoreStubs/library.json'); // Archiv, WebFront, Kachel-Visu …
        IPS\ModuleLoader::loadLibrary(__DIR__ . '/stubs/IOStubs/library.json');   // nur bei Bedarf (ClientSocket, VirtualIO …)
        IPS\ActionPool::loadActions(__DIR__ . '/../actions');                  // nur, wenn die Library Aktionen hat
        parent::setUp();
        IPS_CreateVariableProfile('~Switch', VARIABLETYPE_BOOLEAN);           // genutzte Systemprofile selbst anlegen
    }

    public function testSomething(): void
    {
        $Iid = IPS_CreateInstance(self::ModuleID);                   // ruft Create() auf
        IPS_SetConfiguration($Iid, json_encode(['Property' => 1]));
        IPS_ApplyChanges($Iid);                                      // ruft ApplyChanges() auf
        $Intf = IPS\InstanceManager::getInstanceInterface($Iid);     // Objekt der Modulklasse
        // öffentliche Methoden direkt aufrufen, z.B. $Intf->ReceiveData(…), $Intf->Migrate(…), $Intf->Translate(…)
    }
}
```

## Was sich so prüfen lässt

- **Objektbaum:** `IPS_CreateVariable`, `IPS_SetParent`, `IPS_SetIdent`, `IPS_SetName`, `IPS_GetObjectIDByIdent`, `IPS_GetChildrenIDs`, `IPS_GetObject` arbeiten wie im Kernel. Damit Ausgangslagen nachbauen (z. B. Variablen alter Versionen) und das Ergebnis prüfen.
- **Migration:** `$Intf->Migrate($JSON)` mit den gespeicherten Daten einer alten Version aufrufen (`{"configuration": {…}, "attributes": {…}}`, fehlende Attribute = alte Instanz). Rückgabe `''` = keine Änderung. Attribute einer Instanz: `$Intf->GetPersistence()['attributes']`. Referenzumsetzung: FritzBox, `tests/LegacySubVariablesMigrateTest.php`.
- **Datenfluss:** Nachrichten direkt an `$Intf->ReceiveData(json_encode([...]))` geben. Eine echte MessageSink gibt es nicht; Zustände, die sonst eine Meldung setzt, im Test selbst setzen (z. B. Buffer). Referenzumsetzung: Zigbee2MQTT, `tests/DumpInclude.php` (Dump aus dem Debug einer echten Instanz als Testdaten).
- **Variablen und Darstellungen:** Werte mit `GetValue`, Darstellung mit `IPS_GetVariable(…)['VariablePresentation']` prüfen.
- **Debug und Log:** `IPS\DebugServer::getDebugMessages($Iid)` und `IPS\LogServer::getLogMessages(…)` liefern die gesendeten Meldungen (vorher Debug per `IPS_EnableDebug` aktivieren, falls nötig).

## Fallstricke

- Instanzen nur über `IPS_CreateInstance` erzeugen. Mit `ReflectionClass::newInstanceWithoutConstructor()` fehlt das interne Modul der Stub-Basisklasse: Jeder Aufruf, der bis `IPSModule`/`IPSModuleStrict` durchgeht (z. B. `parent::Migrate`), bricht mit „must not be accessed before initialization“ ab. Reine Hilfslogik ohne Kernel lieber in lib-Klassen auslagern und direkt testen.
- `IPS\Kernel::reset()` in `setUp()`, sonst hängen Objekte vorheriger Tests im Baum.
- Systemprofile (`~Switch`, `~Temperature` …) gibt es in den Stubs nicht von selbst; die vom Modul genutzten in `setUp()` anlegen.
- Die Sprache für `Translate` ist die der Stubs; erwartete Texte daher über `$Intf->Translate(…)` bilden statt fest einzutragen.
- Kein Zugriff auf Geräte oder Netzwerk: Antworten von Geräten über `ReceiveData` bzw. die IOStubs einspielen, Funktionen mit echtem Netzwerkzugriff nicht im Test aufrufen.
- Die Stubs werden aktualisiert (`git submodule update --remote tests/stubs`); bricht danach ein Test, erst prüfen, ob sich das Verhalten der Stubs geändert hat.
