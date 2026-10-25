# Milo build plan: every user-facing change from the review

Read this whole file before you start. The review it implements is
`docs/build/review.md`
(items are numbered 1–96, radical changes K1–K14). Read the items in your scope there; they cite `app.js` lines
as of commit bd25f38, so lines may have moved.

## Who this is for

One person uses Milo: the owner. They use all four sections (Together plans their week; Muscle, Strength and
Ladder run its parts) and type weights with a dot. They asked for **every change the user would experience**
from the review, including all the radical ones, and to leave out behind-the-scenes code changes.

**Out of scope (do not do these):** items 1, 4, 14, 15, 17, 18, 19, 20, 21, 22, 23, 24, 25, and K2, K11, K12
(storage limits and the load-wipe fix, undo size, multi-tab locking, backup size limits, backup keys,
service worker, fonts, render performance, file size and splitting, hosting origin, sanitizer internals,
code de-duplication, CI/type-checking). Do not refactor for its own sake.
Also impossible here: Apple Health / Health Connect (needs a native app) and automatic cloud sync (no server):
K10 is done as files the user moves (CSV, encrypted backup, .ics), not sync.

## Hard rules

1. Plain JavaScript, no build step, no new runtime dependencies, works offline. Match the surrounding code:
   its dense style, naming, and comments written as plain sentences that say why.
2. **Never break saved data.** Keep every localStorage key and keep old saved data loading: new fields are
   additive with defaults; old records without them still work. Deep links `index.html?m=lift|str|cal|mix`
   keep working. New storage keys must be added to `security.js` STATE_KEYS or SHELL_KEYS only if a feature
   needs them backed up (with validation).
3. Security: escape user text (`esc`), insert HTML through the existing `MiloSecurity.html` paths, no inline
   handlers, no new external requests (CSP is `default-src 'self'`).
4. After changing app.js, security.js, index.html, shell.css, trainer.css or fonts.css, run
   `node tools/update-integrity.cjs` (it rewrites hashes in index.html and the cache name in sw.js).
5. Test with `docs/build/tools/check-all.sh <your repo dir> <your port>`
   (syntax, integrity, 45+ Node tests, 4 browser suites, about a minute). Everything must pass before you
   finish. When a behaviour change is intended, update the affected test expectation minimally and say so in
   the commit message; never delete a test to get green. Add Node unit tests (tests/*.test.cjs) for new
   calculations; tests slice app.js at `/* ==== NAME ====` comment markers, so keep existing markers.
6. On-screen text: short, plain, one line where possible; reasons and studies go behind the existing
   "Why?" / evidence chips. Never invent a citation; if you add a source, it must be one you verified with
   WebSearch (PubMed via curl is blocked; WebSearch/WebFetch work).
7. Stay inside your assigned regions (below). If you truly need a change elsewhere, keep it to a few lines
   and list it in your report. Exercise instructions you add for new exercises go in your own region as
   `Object.assign(window.HOWTO, {...})`, not in the shared instruction block.
8. Commit when done, with a clear message, ending with:
   `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and
   `Claude-Session: https://claude.ai/code/session_01V4jDFnkdEPtAWETjaMsrAd`. Never put a model name
   anywhere else in the repo.

## Regions of app.js (approximate; find them by their section comments)

- Shared: 1–37 MiloDesign; 38–1187 HOWTO instructions; 1188–1540 Back, OpenSets, Parked, Prefs, SAME_LIFT,
  GROWTH, Lift, TakeBack, Safe, plus whatever wave 0 adds (Num, Day, Kit, Body, …).
- Muscle (`MOD_INIT.lift`): ~1541–5402; its evidence library is the `EVIDENCE` object (~1715–1787).
- Ladder (`MOD_INIT.cal`): ~5403–8389; its evidence library ~6260–6393.
- Strength (`MOD_INIT.str`): ~8390–10358; its evidence library ~8527–8601.
- Together: ~10359–12142.
- Shell: ~12142–end. `index.html` holds the shell markup and each trainer's template and CSS.

## Waves (each wave starts from the merged result of the previous one)

- **Wave 0, shared engine** (one builder): Num, Day, Lift, Kit, Body (see the wave-0 brief). Also the
  cross-cutting mechanical fixes: decimal commas everywhere (3), clock-change-safe dates everywhere (13),
  and rewiring both roundLoad functions to Kit.
- **Wave 1, per-section science and logic** (five builders in parallel, separate worktrees):
  Muscle, Strength, Ladder, Together, Content (instructions + evidence libraries).
- **Wave 2, one app and the session screen** (two builders, one after the other): Shell/one-app (K1, K14 and
  the navigation, onboarding and Today layout items), then Session screen (K3 and the logging, accessibility
  and rest-timer items).
- **Wave 3, new features** (two builders in parallel): Conditioning (K7), Data out and habits (K10, 76, 90).
- **Wave 4, words** (two builders in parallel): on-screen copy (K13, 78) and the docs.
- **Wave 5, verification**: reviewers walk the app and check the maths; fixes; push.
