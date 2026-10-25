# Wave 4 results

Today now leads with Start and the safety line. Workout prescriptions, the week schedule and program explanations expand on demand. Customization opens one section at a time and preserves expanded sections during edits. Effort abbreviations are explained in the next-set screen. Training calculations were not changed.

## Visible copy, 390 × 844

Measured with the same configured three-section fixture before and after. Counts include visible shell text, exclude closed details, and include underlying visible content when a sheet overlays it. The test is `tests/copy-browser.js`; these are scenario measurements, not universal counts for every possible user history.

| Screen / form | Before | After |
|---|---:|---:|
| Today | 514 | 110 |
| Train | 69 | 63 |
| Progress, All | 386 | 386 |
| Library | 177 | 177 |
| Settings over Library | 403 | 403 |
| Customize, folded | 548 | 40 |
| Program setup | 424 | 381 |
| Full check-in | 629 | 225 |
| Outcome goal form | 55 | 55 |
| Activity form | 68 | 68 |

The default Today and folded Customize limits are now regression assertions. Evidence and safety details retain their technical wording; not every dynamically generated sentence or sheet variant has an individual word-count assertion.

## Documentation claims corrected

- Navigation: four destinations and section filters replace the trainer-tab instructions.
- Week five: a stored performance/recovery decision, not an automatic lighter week.
- Short sessions: time constraints can trim sets; no claim that every set is preserved.
- Return after a break: lighter first-session behavior, without lowering the stored estimate.
- Readiness: an answered or skipped daily check-in is respected.
- Equipment: real racks, plate counts and configurable bars/increments; no universal machine-step claim.
- Ladder: setup-qualified proof, two successful days, movement-specific entry checks near 40% of target, load/assistance, gates and spacing.
- Muscle-to-Ladder: volume context does not certify progression.
- Data: conditioning and goals are in complete backups; CSV remains set-oriented. Encrypted backups and explicit erase are documented.
- Removed drawings, `tools/visuals`, stale current-screen images and unsupported picker-ranking claims.
- Product scope describes people training generally, not one named owner.

README is 287 words; QUICKSTART is 434; FEATURES is 1,108. No legacy “Hypertrophy Log” or “Strength Log” remains in app entry assets. Each changed behavioral claim was checked against the relevant implementation and regression tests. Physical mobile keyboard and background notification behavior remain platform verification limits.
