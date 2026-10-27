# Contributing to Milo

Report a bug through the [issue forms](https://github.com/gwilltsherman-byte/milovancroton/issues/new/choose). Include the action, expected result, device and browser. A screenshot helps; personal workout backups and health details are not required.

## Local development

Serve the repository with `python3 -m http.server 8000 --bind 127.0.0.1`, then open `http://localhost:8000`. There is no build step or runtime dependency installation.

Use a separate local origin for test fixtures. They replace test storage temporarily and restore it when finished; do not run them against your everyday training origin.

## Code map

- `app.js`: shared training calculations, Muscle, Ladder, Strength, Together and the application shell. Section comments mark each region.
- `trainer.css`, `shell.css`, `fonts.css`: trainer surfaces, shared navigation and local fonts.
- `security.js`: backup validation, encryption, import limits, restore and HTML sanitization.
- `index.html`, `manifest.webmanifest`, `sw.js`: app entry, installation and offline cache.
- `tests/`: calculation tests and browser fixtures.
- `tools/update-integrity.cjs`: script hashes, versioned assets and offline cache identifiers.

Keep storage fields additive and preserve existing keys, exercise IDs and deep links. Escape user text and use `MiloSecurity.html` for HTML insertion. No inline handlers or external runtime services.

## Required checks

```sh
node --check app.js
node tools/update-integrity.cjs
node tools/update-integrity.cjs --check
node --test tests/*.test.cjs
bash docs/build/tools/check-all.sh "$PWD" 18820
```

The Node command includes `tests/engine.test.cjs`. The full runner requires Playwright and its Chromium browser; neither is an app dependency. It discovers `tests/browser.html` and every `*-browser.html` fixture automatically.

Alternatively, serve a dedicated test origin and open each browser fixture sequentially. Every fixture must report success. Inspect the changed flow at 390×844, at desktop width, and with keyboard navigation.

## Pull requests

Describe the concrete behavior change and validation. Preserve regression assertions; update exact wording only when the UI intentionally changes. Training changes need primary sources and an explanation of their limits. Do not claim a planning estimate is a validated physiological threshold.
