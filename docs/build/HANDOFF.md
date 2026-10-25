# Build handoff: making every change from the review

This folder lets a new chat continue the build without this conversation. Start here.

## What this is
In October 2026 the owner asked for a full review of Milo. That review is in `review.md`: items 1–96 and
radical changes K1–K14. They then asked for **every change a user would experience**, including all the radical
ones, leaving out behind-the-scenes code changes. Each finished wave is merged into `main` right away, so the
live app (GitHub Pages serves `main`) gets it immediately.

About the owner:
- They are the only person using Milo.
- They use all four sections (Together plans their week; Muscle, Strength and Ladder run its parts).
- They type weights with a dot.

**Out of scope, by the owner's choice:** review items 1, 4, 14, 15, 17, 18 and 19–25, and K2, K11 and K12. That
covers storage limits and the load-wipe fix, undo size, multi-tab locking, backup size limits and backup keys, the
service worker, fonts, render performance, splitting files, hosting, sanitizer internals, de-duplication and CI.
Also impossible here: Apple Health and automatic cloud sync. `PLAN.md` holds the full rules every builder follows.

## Status

Done and merged into `main`:

| Wave | What | Pull request |
| --- | --- | --- |
| 0 | Shared engine: `Num` (decimal commas), `Day` (clock-change-safe dates), `Lift` (curves by exercise type, smoothed estimate with a range, trend, reps-in-reserve model, effective loads), `Kit` (plates, bars, racks), `Body` (one bodyweight log). API in `API.md`. | #42 |
| 1 content | Every citation links to its paper; corrected evidence cards; safety cues in the instructions. | #43 |
| 1 strength | Estimate that can't inflate, back-offs from the real top set, kit settings, progression by plates, new lifts. | #44 |
| 1 ladder + data | Recovery spacing, progress that sticks, load and help levels, hold timer, gates; CSV export, Strong/Hevy import, coach summary, calendar, encrypted backups, privacy, erase everything. | #45 |
| 1 together | Pain adjusts the right lifts, decided week 5, fixed day order, weekdays, safety layer (health check, illness, red flags, life stage). | #46 |
| 1 muscle | Blocks from weekly targets, assisted and weighted loads, survey per muscle, RIR check during the set, adductors. | #47 |

In progress when this was written (25 October 2026, 02:30 UTC). Check `git log --oneline origin/main` for
"Merge wave 2" to see whether they landed:
- **Wave 2a, one app** (brief `wave2-shell.md`): one navigation (Today · Train · Progress · Library), one Settings,
  program types instead of separate trainers, start in two taps.
- **Wave 2b, next-set screen** (brief `wave2-session.md`): focus mode, logging and accessibility fixes, rest-timer
  alerts.

If they did not land, run both again from `main`. They are independent; run them side by side.

Left to do, in order:
1. **Wave 3, in parallel:** `wave3-conditioning.md` (K7, a fourth section for cardio) and `wave3-data.md` (outcome
   goals and the weekly summary). Both build on wave 2's navigation, Progress and Settings.
2. **Wave 4, in parallel:** `wave4-copy.md` (shorter on-screen text, K13) and `wave4-docs.md` (README, a new
   QUICKSTART, the FEATURES reference, ladder-progression, CONTRIBUTING, PRODUCT).
3. **Wave 5, verification** (no brief yet; write it from this list):
   - Reviewers walk every flow at phone size (390×844, touch) starting from data saved by the original app
     (commit bd25f38): first run, Today, a full Together day through all sections, focus-mode logging, finish,
     Progress, Library, Settings, backup with encryption, CSV export and import, conditioning, goals.
   - A maths reviewer simulates months of training through the final engine: no estimate ratchet; weekly sets
     meet targets; progression with every plate setup; lighter weeks are not decided by chance.
   - A checklist reviewer goes through every in-scope review item and K change: done, partly or missing.
   - Fix what they find, run every check, merge to `main`.
4. When everything is merged: ask the owner whether to delete this `docs/build` folder.

## How each wave was run
Per brief:
1. A **builder** works in its own git worktree on a branch named `waveN-name`, commits at checkpoints, and runs
   `docs/build/tools/check-all.sh <worktree> <port>`. That script runs syntax, integrity, every Node test and every
   browser suite; each builder uses its own port so browser storage doesn't collide.
2. **Two reviewers** check it, one against the brief and the science, one for regressions with old saved data
   in Chromium.
3. A **fixer** applies the confirmed findings in the same worktree.

`workflows/section-workflow.js` is the Workflow script that does this. Run it with
`{name, brief, port, wave}`. `workflows/continue-workflow.js` resumes a builder that was cut off; it takes the
extra `worktree` and `skipBuild` arguments.

Merging, done by the main session:
1. `git merge --no-ff waveN-name` into the work branch.
2. `python3 docs/build/tools/resolve-integrity.py .` settles conflicts that are only in generated hashes (index.html,
   sw.js, _headers) and regenerates them. Resolve any other conflict by hand, keeping both sides' intent.
3. Run `check-all.sh` on the result.
4. Open a pull request to `main` and merge it with a merge commit.
5. Fast-forward the work branch to `main`.

The machine had 4 cores, so expect browser suites to be slow while several builders run.

## Lessons worth keeping
- **Look for cross-section bugs at merge time.** Builders can't see each other's changes. One example from
  wave 1: Strength started storing estimates for split squats, goblet squats and back extensions as totals that
  include bodyweight. Together's new planner then prescribed those totals as box weight until the merge added
  `boxOf`. When a merge combines a change in one section with a caller in another, read both sides.
- **Usage limits stop agents.** Builders commit "Work in progress" checkpoints, so `continue-workflow.js` can
  resume from them.
- **The data-wipe risk is still there by choice** (item 1). Wave 1's import therefore caps each section at what
  still loads (`MiloSecurity.room`). Don't add features that could grow one section's saved data past about
  100,000 JSON nodes without a similar guard.

## Starting a new chat
Attach this repository, then say:

> Read `docs/build/HANDOFF.md` and continue the build from the next unfinished wave. Merge each wave into
> main as soon as it passes every check.
