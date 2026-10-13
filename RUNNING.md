# Run Milo on Mac and iPhone

## Open the GitHub Pages app

Open [Milo](https://gwilltsherman-byte.github.io/milovancroton/) in a browser on
your Mac, or in Safari on your iPhone. On iPhone, choose Share, Add to Home
Screen, then Add. If Safari offers Open as Web App, leave it enabled.

Open the Home Screen icon before setting up workouts. Safari and an installed
web app may use separate storage. Use Milo's backup and restore controls to
move workouts between devices. They do not sync automatically.

## Run a local copy on Mac

Install Python 3 if `python3 --version` is unavailable, then run:

```sh
git clone https://github.com/gwilltsherman-byte/milovancroton.git
cd milovancroton
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://localhost:8000`. Keep Terminal open; Control-C stops the server.
There is no dependency installation or build step.

To open that copy on your iPhone, stop the server and run:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Connect both devices to the same Wi-Fi. Find the Mac's IP address in System
Settings, Wi-Fi, Details, TCP/IP, then open `http://MAC_IP:8000` in Safari,
replacing `MAC_IP` with that address. Allow the local server in the Mac
firewall if prompted. The Mac must stay awake. Offline installation requires
HTTPS or localhost, so use the GitHub Pages address for offline iPhone use.

## Publish updates on GitHub

The repository already has Pages enabled. In Settings, Pages, use Deploy from
a branch with `main` and `/(root)`. GitHub publishes the static files.
After changes to app assets, run the integrity tool described in the README.
