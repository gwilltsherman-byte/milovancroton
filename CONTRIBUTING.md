# Contributing to Milo

Bug reports, feedback and small focused pull requests are welcome.

## Report a problem

Use the [issue forms](https://github.com/gwilltsherman-byte/milovancroton-clean/issues/new/choose). Include your browser, device, trainer, the steps you took, and what you expected. A screenshot helps when the problem is visual. You do not need to share your workout backup or personal health details.

## Try a change locally

Serve the repository with any static web server, such as `python3 -m http.server 8000`, then open `http://localhost:8000`. There is no build step.

The app lives in `index.html`. Each trainer has its own shadow root and saved data. `sw.js` handles offline caching. When you change `index.html`, increment the cache version in `sw.js` so installed copies receive the update.

Before opening a pull request, exercise the flow you changed on a narrow screen and with keyboard navigation. Check that sessions and backups still work if your change touches saved data. Describe what changed and how you checked it.

For changes to training recommendations, include the source and explain its limits. Please open an issue before proposing a large redesign or changing the data format.
