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
- `partials/pencil-*.hbs` und `assets/pencil.{css,js}`: Kreise, Unterstreichungen und Häkchen, die beim Scrollen einmal gezeichnet werden.
- `partials/header.hbs` und `assets/navigation.js`: kontextabhängiges Produktmenü.
- Mobil: Navigation über die Bildschirmhöhe, animierter Hamburger und Tastatursteuerung.
- `partials/site-search.hbs` und `assets/site-search.js`: lokale Suche über alle neun Seiten.
- `partials/subpage-footer.hbs`: gemeinsamer Kontaktbereich und Footer.
- `hr.hbs`, `outline.hbs`, `funktionen.hbs`: Produktseiten.
- `integration.hbs`, `partials/integration-flow.hbs` und `assets/integration.css`: eigene Integrationsseite mit End-to-End-Abläufen für Eintritt, Wechsel und Austritt.
- `seo.json` und die `pageTitle`-Blöcke: Beschreibungen, Seitentitel und Angaben für strukturierte Daten.
- `partials/seo/`: erzeugte Metadaten für die neun öffentlichen Seiten und die Kontakt-Bestätigung.

Die Animationen verwenden Beispieldaten und erklären Abläufe. Sie sind keine
Aufzeichnung der vollständigen Produktoberfläche und keine Verfügbarkeitszusage.
Sie starten automatisch im Sichtbereich, zeigen den zeitlichen Fortschritt und
lassen sich mit Pause/Play anhalten und fortsetzen. Ausserhalb des Sichtbereichs
und in Hintergrund-Tabs pausieren sie; bei reduzierter Bewegung bleiben sie statisch.
Die alten generierten Clips werden nicht geladen.
Der Gründerfilm bleibt als eigenes Video mit manuellen Bedienelementen enthalten.

Nach Textänderungen zuerst `python3 scripts/build-nexpt-seo.py`, dann
`python3 scripts/build-nexpt-search.py` ausführen. SEO-Ausgaben, KI-Texte und Suchindex
werden aus den Seitenvorlagen erzeugt; die Theme-Prüfung erkennt veraltete Ausgaben.
Suchanfragen bleiben im Browser und werden an keinen Suchanbieter übertragen.

Die nativen Seiten erhalten eigene Titel, Beschreibungen, kanonische URLs,
OG-/Twitter-Vorschauen und JSON-LD für Organisation, Website, Seite und Navigation.
Die drei Produktseiten ergänzen SoftwareApplication ohne Preis- oder Bewertungsangaben.
Normale Ghost-Posts und -Seiten behalten die Ghost-Metadaten. Die Kontakt-Bestätigung
ist nicht zur Indexierung vorgesehen. `assets/nexpt-llms*.txt` werden aus den
öffentlichen Seitentexten erzeugt; der Nginx-Include im Repository stellt sie unter
`/llms.txt` und `/llms-full.txt` bereit. Die Dateien ersetzen keine technische
Indexierbarkeit und garantieren keine Aufnahme in Such- oder KI-Antworten.

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
