# Nexpt Website

Der Webauftritt von **[nexpt.ch](https://nexpt.ch/work/)** für Nexpt Work, Nexpt HR
und Nexpt Outline. Nexpt wird als flexibles Arbeitsinstrument für Projekte,
Menschen und Wissen vorgestellt – mit eigenen Begriffen und Abläufen je Team.

Repository: [Chregu12/nexpt-website](https://github.com/Chregu12/nexpt-website)

## Produktiver Auftritt

Das Ghost-Theme unter [`themes/nexpt-work/`](themes/nexpt-work/) rendert die
öffentlichen Seiten direkt. Es verwendet Handlebars, CSS und JavaScript und
benötigt weder ein Node-Build noch externe UI-Bibliotheken.

- Produktseiten für **Work**, **HR** und **Outline**, dazu Arbeitsmodell,
  Einsatzbereiche, häufige Fragen, Gründer und Kontakt.
- Desktop-Megamenü sowie mobile Navigation mit animiertem Hamburger.
- Lokale Suche über alle acht Seiten; Suchbegriffe bleiben im Browser.
- SVG-Produktvorschauen mit Autoplay, Pause/Play und Fortschrittsanzeige.
- Gezeichnete Pencil-Akzente: Kreise, Unterstreichungen und Häkchen.
- Vorteilskacheln mit Dialogen, Gründerfilm und gemeinsamer Kontaktbereich.
- Tastaturbedienung und Unterstützung für reduzierte Bewegung.

Die Produktvorschauen erklären Abläufe anhand von Beispieldaten. Den aktuellen
Funktionsumfang und mögliche Anbindungen klären wir im persönlichen Gespräch.

## Lokal ansehen

```sh
git clone https://github.com/Chregu12/nexpt-website.git
cd nexpt-website
python3 scripts/preview-nexpt-theme.py
```

Die Vorschau läuft unter <http://127.0.0.1:8766/work/>. Sie verwendet die
Standardtexte des Themes; Ghost-Datenbank und Kontakt-API werden nicht gestartet.

Nach Änderungen an Seitentexten den Suchindex aktualisieren:

```sh
python3 scripts/build-nexpt-search.py
```

## Prüfen

```sh
python3 scripts/check-nexpt-theme.py
node scripts/test-nexpt-interactions.cjs
```

Die Checks prüfen Seiten, Assets, interne Links, ARIA-Verweise, Dialoge und den
Suchindex sowie Navigation, Suche und Animationssteuerung. GitHub Actions prüft
zusätzlich das Headless-Frontend und die Integration mit Ghost.

## Projektstruktur

| Pfad | Aufgabe |
|---|---|
| [`themes/nexpt-work/`](themes/nexpt-work/) | Produktives Ghost-Theme für nexpt.ch |
| [`scripts/`](scripts/) | Vorschau, Suchindex, Tests und Betriebsskripte |
| [`frontend/`](frontend/) | Separates Next.js-Frontend mit Puck-Seiteneditor |
| [`mcp/`](mcp/) | Ghost-API-Zugriff für Agenten |
| [`docker/`](docker/) | Compose-Konfiguration für das Headless-Projekt |
| [`docs/`](docs/) | Redaktion, Deployment und Updates des Headless-Projekts |

## Änderungen und Bereitstellung

Seitentexte und Layouts liegen in den `.hbs`-Vorlagen des Themes, gemeinsame
Bausteine in `partials/`, Gestaltung und Interaktionen in `assets/`. Die sechs
Ghost-Custom-Texte sind in `package.json` definiert.

Für eine Veröffentlichung das aktive Theme sichern, die Theme-Version erhöhen
und die geprüfte Version in Ghost bereitstellen. Die vorhandenen URLs und
`routes.yaml` müssen erhalten bleiben. Das Kontaktformular verwendet die bereits
betriebene API unter `/api/contact/`.

Details: **[Theme-Dokumentation](themes/nexpt-work/README.md)**.
Zugangsdaten, Datenbanken, Serverkonfiguration und Backups gehören nicht ins Git.

## Headless-Frontend und Seiteneditor

Das bestehende Next.js-/Puck-Projekt bleibt als separater Renderer erhalten.
Änderungen im Seiteneditor wirken derzeit auf dieses Frontend; für den
produktiven Nexpt-Auftritt werden die Ghost-Theme-Vorlagen geändert.

- [Headless-Deployment](docs/DEPLOYMENT.md)
- [Redaktion und Inhaltsmodell](docs/REDAKTION.md)
- [Updates und Integrationsprüfung](docs/UPGRADE.md)
- [MCP-Server](mcp/README.md)
- [Ursprüngliche Headless-Anforderungen](ANFORDERUNGEN.md)
