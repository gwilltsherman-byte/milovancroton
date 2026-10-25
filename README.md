# Milo van Croton

**[Open Milo](https://gwilltsherman-byte.github.io/milovancroton/)** · [Quick start](docs/QUICKSTART.md) · [Feature guide](docs/FEATURES.md)

Milo plans and logs muscle, strength, calisthenics and conditioning training. It works offline after loading, needs no account, and keeps training data in your browser.

## Start

1. Open Milo and choose what you train, your days and weight units.
2. On **Today**, start your workout. The health check is optional.
3. Log the actual load, reps and effort; tap **Done**, then rest.
4. Finish the session and review **Progress**. Use **Settings** to adjust your program.

The four places are **Today**, **Train**, **Progress** and **Library**. Together combines your chosen training into one week. Muscle, Strength and Ladder can also run alone. Conditioning sessions follow lifting; outside activity has its own quick log.

## Your data

There is no account, analytics or cloud sync. Use **Settings → Your data** for backups, encrypted backups, restore, CSV tools and calendar export. A complete backup includes conditioning and goals. CSV carries workout sets rather than every setting.

Back up before clearing browser data or changing devices. Keep the passphrase for an encrypted backup: Milo cannot recover it. Installation and device-transfer instructions are in [RUNNING.md](RUNNING.md).

## Run locally

Serve this folder, then open `http://localhost:8000`:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

No build step or runtime dependencies are required.

## Check a change

```sh
node tools/update-integrity.cjs
node tools/update-integrity.cjs --check
node --test tests/*.test.cjs
bash docs/build/tools/check-all.sh "$PWD" 18820
```

The Node suite includes the shared engine, planner and data tests. The final command also runs every browser suite; its runner needs Playwright and Chromium. See [CONTRIBUTING.md](CONTRIBUTING.md).

Training recommendations and fatigue figures are estimates. Milo does not diagnose injuries or replace qualified medical advice.

[Report a problem](https://github.com/gwilltsherman-byte/milovancroton/issues/new/choose) · [Security](SECURITY.md) · [MIT license](LICENSE)
