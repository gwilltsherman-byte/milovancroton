# Contributing to Milo

I welcome bug reports, feedback and small, focused pull requests. If something gets in the way of using Milo, please tell me what happened.

## Report a problem

Use the [issue forms](https://github.com/gwilltsherman-byte/milovancroton/issues/new/choose). Include your browser, device, trainer, the steps you took, and what you expected. A screenshot helps when the problem is visual. You do not need to share your workout backup or personal health details.

## Try a change locally

Serve the repository with any static web server, such as `python3 -m http.server 8000`, then open `http://localhost:8000`. There is no build step.

The page is `index.html`, and the trainers live in `app.js`. Each trainer has its own shadow root and saved data. `security.js` checks backups and HTML rendering. After changing app assets, run `node tools/update-integrity.cjs`; it updates the recorded hashes and offline cache. Check the result with `node tools/update-integrity.cjs --check` and `node --test tests/*.test.cjs`. The exercise drawings are made in `tools/visuals` (the engine, and one file of poses per body area); after editing them run `node tools/visuals/build.cjs` before the integrity tool. `node tools/visuals/check.cjs` lists any hand or foot that misses what it should rest on, and `--sheet <file>` on the build writes a page of every figure for checking poses by eye.

Before opening a pull request, exercise the flow you changed on a narrow screen and with keyboard navigation. Check that sessions and backups still work if your change touches saved data. Describe what changed and how you checked it.

For changes to training recommendations, include the source and explain its limits. Please open an issue before proposing a large redesign or changing the data format.

