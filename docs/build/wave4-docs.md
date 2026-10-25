# Wave 4b brief: the docs (K13 docs part, review item 95)

Region: README.md, docs/FEATURES.md, a new docs/QUICKSTART.md, docs/ladder-progression.md, CONTRIBUTING.md,
PRODUCT.md, DESIGN.md (only where the one-app structure changes stated rules), RUNNING.md, docs/REDESIGN.md
(a short note that the structure changed), SECURITY.md (encrypted backups, erase everything). Not app code.

Read the code as it is now (all earlier waves are merged: `git log --oneline` from bd25f38) and describe what
it actually does. Every behavioural claim must match the code: check each one by reading the code (and run it
where cheap). In particular fix every mismatch in review item 95, and remove what no longer exists (exercise
drawings, `tools/visuals`, the trainer switcher, "five percent in Muscle and Strength" if the rule changed,
etc.).

- **README.md:** short: what Milo is, Open Milo, a 4-line start, your data, run it yourself, the checks to run
  (now including tests/engine.test.cjs and any new suites), license. Under 400 words.
- **docs/QUICKSTART.md (new):** one page for a first workout and a normal week: first run, Today, logging a set
  in the next-set screen, rest, finishing, check-in, Progress, backup, install. Under 600 words.
- **docs/FEATURES.md:** the reference, rewritten into short sections with headings (one idea per paragraph, no
  paragraph over about 120 words, no sentence over about 35): one app and navigation; Together program (dose by
  rank, day order, week 5, weekdays, fatigue, conditioning); check-in and safety (health screen, illness,
  red flags, joint pain to movements, life stage); Muscle; Strength; Ladder; the shared maths (estimated max,
  effort curves, reps-in-reserve correction, hard sets, trends); kit; data (backup, encryption, CSV, import,
  calendar, erase, privacy); accessibility; limits of the estimates; evidence. Keep the screenshots table only
  if the screenshots still match; otherwise drop the images and say they're being redone (do not fabricate).
- **docs/ladder-progression.md:** the new rules (ranges with RIR, entry checks, spacing, gates, Muscle sets as
  volume only, load/assistance as proof).
- **CONTRIBUTING.md:** remove `tools/visuals`; how to run every check (including the browser suites and the
  engine tests); where each section lives.
- **PRODUCT.md:** the one-app structure, program types, conditioning, the safety layer, the single-user
  context is not a product rule (keep it general).

Report each claim you checked that changed. No code changes; the docs builder only edits Markdown.
