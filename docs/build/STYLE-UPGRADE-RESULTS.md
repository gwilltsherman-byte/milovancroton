# Cached stylesheet upgrade regression

The 25 October 2026 screenshot still showed the pre-fix Muscle heading under the iPhone clock. The previous verification checked fresh browser loads and deployed file hashes. It did not prove that an installed app using an older worker would load the new CSS.

The shell used content-versioned scripts but plain stylesheet URLs. A cache-first older worker could fetch a new HTML page and new scripts while returning its old `shell.css` and `trainer.css`. The generator now versions fonts, shell and trainer stylesheet URLs by content, including links inside templates. Worker installation precaches those exact URLs for offline use.

`docs/build/tools/check-upgrade.cjs` starts a disposable local server and browser context, using the old worker and styles captured from commit `12a69a1`. It first reproduces the duplicate heading with a saved unfinished workout. The server then supplies the current page while the old worker remains active. Checks verify the corrected layout with a simulated 59px inset, preserved workout identity/sets, offline reload before worker replacement, exact CSS precaching after replacement, and another offline reload. Nine upgrade checks pass. This scenario is included in the full check script.

The regular syntax, integrity, Node and browser suites also pass. An already-open document still needs navigation/reopening to load new markup and stylesheet URLs. No cache reset, app-data clearing or workout migration is required. Physical iPhone behavior was not directly tested.
