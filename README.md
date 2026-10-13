# Milo van Croton

[Run on Mac and iPhone](RUNNING.md), including GitHub hosting options.

Track workouts for muscle growth, strength and calisthenics. Milo works offline after the first load, needs no account, and saves your training data in your browser.

**[Try Milo](https://gwilltsherman-byte.github.io/milovancroton/)** · [Feature guide](docs/FEATURES.md) · [Report a problem](https://github.com/gwilltsherman-byte/milovancroton/issues/new/choose)

<img src="docs/screenshots/banner.jpg" alt="Milo van Croton with previews of its Muscle, Strength and Ladder trainers" width="100%">

## Start a workout

1. [Open Milo](https://gwilltsherman-byte.github.io/milovancroton/) on your phone or computer.
2. Choose **Muscle**, **Strength** or **Ladder** and set up a plan or goal.
3. Start a session and tick off your sets as you train.

Use **Together** to plan a week across the trainers. Each trainer also works on its own.

On iPhone, open Milo in Safari and choose **Share → Add to Home Screen**. On Android, use your browser's **Install app** or **Add to Home screen** option. Load it once while connected, then use it offline.

## Pick what you want to train

| Trainer | What it helps you track |
| --- | --- |
| **Muscle** | Hypertrophy blocks, hard sets per muscle, effort and recovery. |
| **Strength** | Equipment-based plans, working weights, rep records and estimated maxes. |
| **Ladder** | Calisthenics goals, exercise progressions and the mobility or balance they need. |
| **Together** | A shared week, daily check-ins and training volume across the other trainers. |

Sessions can be resumed, edited or deleted. Exercise instructions and research references are available inside the app. See the [feature guide](docs/FEATURES.md) for the details and the limits of its training estimates.

## Your data

Workout data stays in your browser. Milo has no account system, analytics or cloud sync. The backup button at the top exports your data so you can restore it in another browser or on another device.

**Back up before clearing browser data or switching devices.** Browsers can remove local storage. Fonts are bundled locally; loading the app makes no Google Fonts requests.

## Run it yourself

Download the [latest release](https://github.com/gwilltsherman-byte/milovancroton/releases/latest), extract it, and serve the folder with any static web server. For example, if Python is installed:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. There is no build step or package installation. GitHub Pages can serve `main` from `/(root)`.

## Help improve Milo

Try it during one workout, then [share feedback](https://github.com/gwilltsherman-byte/milovancroton/issues/new/choose): what you tried, where you got stuck, and whether you would use it again. Contributions are welcome; start with [CONTRIBUTING.md](CONTRIBUTING.md).

If you find Milo useful, a GitHub star helps other people find it.

## About the project

Milo is named after Milo of Croton, the wrestler said to have carried a calf every day as it grew into a bull. The app is plain JavaScript in `app.js`, with separate shadow roots for the trainers. `security.js` validates imports and protects HTML rendering. `sw.js` caches it for offline use, and `manifest.webmanifest` makes it installable.

Milo is a training log, not medical advice. Stop if an exercise hurts and seek qualified advice when needed.

## License

[MIT](LICENSE), copyright 2026 gwilltsherman-byte.

## Security and development checks

Backups accept only Milo's own storage keys and supported versions, with a 2 MB import limit.
Every section is validated before restore. Original workout data is saved before replacement,
and a storage failure rolls back the restore. Do not import backups from people you do not trust.

The page permits only scripts matching its recorded hashes; inline handlers and third-party
scripts are blocked. Fonts and offline caches belong to this app. `_headers` also supplies
framing and MIME protections on hosts that support it; GitHub Pages uses the page's meta CSP
and does not apply `_headers`.

After changing `app.js` or `security.js`, run:

```sh
node tools/update-integrity.cjs
node tools/update-integrity.cjs --check
node --test tests/*.test.cjs
```

Serve the repository and open `tests/browser.html` for the browser regression suite.
The integrity tool also changes the offline cache whenever app assets change. After an app
update, reload once to use the new offline cache. See [SECURITY.md](SECURITY.md)
for private reporting and hosting/account controls. Bundled font licenses are in `assets/fonts/`.

