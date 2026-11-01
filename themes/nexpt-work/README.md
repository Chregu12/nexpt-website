# Nexpt Ghost-Theme

Der produktive Auftritt von **nexpt.ch**. Ghost rendert die Handlebars-Seiten direkt;
für dieses Theme sind weder Node-Abhängigkeiten noch ein Build nötig.

## Lokal ansehen und prüfen

Vom Repository-Stamm aus:

```sh
python3 scripts/preview-nexpt-theme.py
python3 scripts/check-nexpt-theme.py
node scripts/test-nexpt-interactions.cjs
```

Vorschau: `http://127.0.0.1:8766/work/`. Sie verwendet die Standardtexte aus
`package.json`. Sie bildet keine Ghost-Datenbank, Kontakt-API oder Redaktion ab.

## Änderungen

- `partials/work-stories.hbs`: Produktkarussell, Vorteilskacheln und fünf Modals.
- `partials/motion-{work,hr,outline}.hbs`: selbst gestaltete SVG-Produktansichten.
- `assets/product-motion.js`: pausierbare Zeitachsen für die drei Ansichten.
- `assets/work-stories.js`: Produktauswahl, Play/Pause, Fortschritt, Dialoge.
- `partials/header.hbs` und `assets/navigation.js`: kontextabhängiges Produktmenü.
- `partials/subpage-footer.hbs`: gemeinsamer Kontaktbereich und Footer.
- `hr.hbs`, `outline.hbs`, `funktionen.hbs`: Produktseiten.

Die Animationen verwenden Beispieldaten und erklären Abläufe. Sie sind keine
Aufzeichnung der vollständigen Produktoberfläche und keine Verfügbarkeitszusage.
Sie starten automatisch im Sichtbereich, zeigen den zeitlichen Fortschritt und
lassen sich mit Pause/Play anhalten und fortsetzen. Ausserhalb des Sichtbereichs
und in Hintergrund-Tabs pausieren sie; bei reduzierter Bewegung bleiben sie statisch.
Die alten generierten Clips werden nicht geladen.
Der Gründerfilm bleibt als eigenes Video mit manuellen Bedienelementen enthalten.

## Ghost bereitstellen

Den Inhalt dieses Verzeichnisses als ZIP mit `package.json` an der Archivwurzel
packen und in Ghost unter **Einstellungen → Design → Theme ändern** hochladen.
Vorher das aktive Theme exportieren. Die Routen in `routes.yaml` müssen in Ghost
unter den erweiterten Einstellungen ebenfalls eingerichtet sein.

Die Produktion verwendet bereits die Routen `/work/`, `/work/hr/`, `/work/outline/`
und die weiteren Seiten aus `routes.yaml`. Die gemeinsame Navigation und die sechs
Custom-Texte bleiben erhalten.

Das Kontaktformular erwartet die bestehende serverseitige Kontakt-API unter
`/api/contact/`. Das Theme allein installiert diesen Dienst nicht. Zugangsdaten,
Ghost-Datenbank und Serverkonfiguration gehören nicht in dieses Repository.

## Verhältnis zum Next.js-Frontend

`frontend/` ist das vorhandene Headless-Frontend mit Puck-Seiteneditor. Es liegt im
selben Repository, ist aber ein anderer Renderer. Änderungen im Puck-Editor ändern
dieses Ghost-Theme nicht. Eine spätere Umstellung muss die Nexpt-Seiten als
Next.js-/Puck-Komponenten übernehmen und die bestehenden URLs erhalten.
