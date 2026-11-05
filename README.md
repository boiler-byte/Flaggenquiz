# Flaggne Quiz

Eine offlinefähige, mobilfreundliche Flaggen-Quiz-PWA mit dunklem Sci-Fi-Design.

## Funktionen

- **Modus Flagge:** Eine Flagge anzeigen, 4 Ländernamen als Antworten.
- **Modus Land:** Einen Ländernamen anzeigen, 4 Flaggen als Antworten.
- **130 Länder**, vollständig mit **lokal eingebundenen Flaggenbildern**.
- **10 Fragen** pro Runde ohne Zeitlimit, wechselnde Fragen und Antwortpositionen.
- **Score:** 100 Punkte pro richtiger Antwort und bis zu 100 Punkte Serienbonus.
- **Separate Highscores** für die beiden Modi.
- **Pause / Spiel fortsetzen** nach Schließen oder Neuladen des Browsers, sogar während einer bereits beantworteten Frage.
- **Sounds** über Web Audio API, ein-/ausschaltbar; Animationen inkl. Unterstützung für `prefers-reduced-motion`.
- **Tastatursteuerung:** `1`–`4` für Antworten, `Enter` für Weiter, `Esc` für Pause, `M` für Ton.
- **Installierbare PWA** mit Manifest, Service Worker, App-Icons und Offline-Cache.
- Keine externen CDNs, keine Cookies und kein Server-Backend.

## Sofortstart ohne Installation

Die zusätzlich mitgelieferte Datei **`Flaggne-Quiz-Sofortstart.html`** enthält Design, Spiellogik und alle Flaggen direkt in einer einzigen HTML-Datei. Sie lässt sich per Doppelklick im Browser öffnen – ohne Webserver und ohne Internet. Die Sofortstart-Datei ist **keine installierbare PWA**; dafür dient die modulare Projektversion. Browser können `localStorage` unter `file://` je nach Sicherheitseinstellung einschränken.

## Starten

Moderne Browser blockieren JavaScript-Module und Service Worker unter `file://`. Deshalb das Verzeichnis über einen lokalen Webserver öffnen:

```bash
cd Flaggne-Quiz
python -m http.server 8080
```

Dann im Browser **http://localhost:8080/** aufrufen. Für die Installation als PWA ist **HTTPS oder localhost** erforderlich. Nach dem ersten vollständigen Seitenaufruf können alle Quiz-Assets offline verwendet werden.

Auf Android/Chrome lässt sich die App über die Installationsfunktion des Browsers bzw. das Installationssymbol installieren. Auf iPhone/iPad in Safari über **Teilen → Zum Home-Bildschirm**.

## Struktur

```text
Flaggne-Quiz/
├── index.html                   HTML-Shell / Einstiegspunkt
├── Flaggne-Quiz-Sofortstart.html  Offline-Einzeldatei ohne PWA-Installation
├── manifest.webmanifest         PWA-Metadaten
├── sw.js                        Service Worker / Offline-Cache
├── css/styles.css               Responsive Sci-Fi-Design
├── js/
│   ├── data/countries.js        Länder-Datensatz und Flaggen-URLs
│   ├── core/game.js             Quizgenerierung, Punkte, Antworten
│   ├── core/storage.js          Persistenz und Validierung
│   ├── core/audio.js            Synthesizer-Sounds
│   └── ui/
│       ├── app.js               UI und Interaktionen
│       └── effects.js           Partikeleffekte
├── tests/game.test.mjs          Automatisierte Logiktests
├── package.json                 ESM-Konfiguration / Testskript
└── assets/
    ├── flags/*.webp              130 Flaggenbilder für Offline-Modus
    └── icons/*                  PWA-Icons und Favicon
```

## Tests

Mit Node.js (ohne zusätzliche Pakete):

```bash
npm test
```

## localStorage-Datenmodell

Der gesamte Spielstand liegt im gewünschten Browser-Schlüssel **`localStorage.flaggenQuiz`** (entspricht `localStorage.getItem('flaggenQuiz')`). Beispiel:

```json
{
  "version": 1,
  "lastMode": "flagge",
  "settings": { "sound": true },
  "highscore": { "flagge": 1200, "land": 900 },
  "stats": { "roundsPlayed": 2, "totalCorrect": 15, "totalAnswered": 20 },
  "game": {
    "mode": "flagge",
    "questions": [
      { "code": "de", "options": ["de", "fr", "it", "be"] }
    ],
    "index": 0,
    "score": 100,
    "correct": 1,
    "streak": 1,
    "bestStreak": 1,
    "selectedCode": "de",
    "lastPoints": 100,
    "completed": false,
    "startedHighscore": 0,
    "startedAt": "2026-11-03T12:00:00.000Z"
  }
}
```

Das Beispiel kürzt `questions` auf eine Frage; in einer echten Runde enthält es zehn Fragen. `game` ist `null`, solange keine Mission begonnen wurde. Die Daten werden nach jedem Zug gespeichert. Die Daten verlassen das Gerät nicht.

Zum Zurücksetzen im Browser `localStorage.removeItem('flaggenQuiz')` ausführen und die Seite neu laden.

## Erweiterung / Anpassung

Neue Länder in `js/data/countries.js` hinzufügen und für jeden ISO-Code eine gleichnamige Datei unter `assets/flags/` bereitstellen. Anschließend den Pfad in `sw.js` unter `OFFLINE_ASSETS` ergänzen und `CACHE_NAME` hochzählen. Rundenlänge in `js/core/game.js` (`ROUND_LENGTH`) ändern.

## Bildrechte

Die lokalen Flaggenbilder wurden aus den Flaggen-Symbolen von **Noto Color Emoji** (Google) gerendert. Quellprojekt: https://github.com/googlefonts/noto-emoji . Die Lizenz- und Copyrightinformationen stehen in `LICENSE-FLAG-ASSETS.txt`. Es werden **keine Schriftdateien** verbreitet.
