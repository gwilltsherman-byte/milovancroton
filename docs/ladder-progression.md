# Ladder progression and evidence

The catalog now separates related progressions from movement alternatives. Weighted pulling and one-arm pulling have different paths; hip extension and Nordic knee flexion are separate; ring dips, straight-bar dips and front-lever rows can train alongside a main skill. Assisted movements, support heights and shorter levers bridge larger jumps.

## How readiness is established

- Record the actual reps or seconds. Form is assumed clean unless you clear the box. Logging a blank set records the target it shows.
- Setup (load, assistance, height, range or leverage) is not measured. Sets of the same movement count together whatever setup was used.
- Repeat the current target on two distinct training days within 42 days, then check the actual next movement with control. Entry checks usually use three reps or five seconds, bounded by the exercise target.
- Goals and supporting standards require the exact exercise and value. A later position in a path never substitutes for an earlier 12-rep or 60-second standard.
- Recent proof and specific user confirmations are considered for 90 days. After a layoff, reconfirm the standard. Existing achieved goals and all historical records are retained.

These counts and time windows are conservative product defaults based on coaching judgment. Research does not validate them as universal readiness thresholds or guarantee acquisition of the next skill. Body proportions, training history, technique and recovery affect progression.

## Training toward a goal

Prescribed targets can grow by one rep or five seconds after two successful days, up to the relevant goal or supporting standard. This allows a 15-second handstand practice target to develop toward a 30-second goal or 60-second supporting standard.

Change one demand gradually. Reduce assistance or starting height where appropriate, or increase load, controlled range or leverage. Keep the movement controllable. The same approach continues at the final step.

Volume days use explicitly related movements, not whichever exercise happens to precede one in the catalog. Unmet earlier standards remain scheduled even if placement is farther along. Completed supporting qualities receive rotating maintenance. Balance and power practice come before demanding strength work; brief balance practice can be frequent, while challenging planche and lever work still needs recovery.

## Compatibility

Existing exercise IDs and numeric rung indices are unchanged. New exercises are appended, and routes reference exercise IDs. Workouts, open sets, active sessions, custom ladders and backups retain their existing identities. Old logs remain visible, but records without explicit form confirmation do not certify new readiness. Users can confirm a specific current standard or perform a fresh check.

## Research supporting the design

- [ACSM 2026 position stand](https://pubmed.ncbi.nlm.nih.gov/41843416/): general resistance-training evidence supports individualized loading and bodyweight training. It does not validate advanced calisthenics paths or this app's numerical gates.
- [Kotarsky et al. 2018](https://pubmed.ncbi.nlm.nih.gov/29466268/): a small, short trial supports strength gains from progressive push-up variations, with task-specific improvement. It does not establish transfer between every exercise here.
- [Sánchez-Moreno et al. 2020](https://pubmed.ncbi.nlm.nih.gov/32213783/): a pull-up trial in trained men supports preserving repetition quality rather than maximizing fatigue. Velocity loss is not interchangeable with an exact reps-in-reserve prescription.
- [Burrows et al. 2020](https://pubmed.ncbi.nlm.nih.gov/32569123/): assisted Nordic mechanics support assistance as a scalable training tool. Muscle activity measurements alone do not prove long-term strength transfer or a fixed advancement threshold.
- [Lanza et al. 2019](https://pubmed.ncbi.nlm.nih.gov/31522276/): an isometric knee-extension experiment supports angle-specific adaptation. Applying that principle to levers and planches is an informed extrapolation.

## Verification

Run `node --test tests/*.test.cjs`, then `node tools/update-integrity.cjs` and `node tools/update-integrity.cjs --check`. Serve locally and open `tests/browser.html` and `tests/ladder-browser.html`. The Ladder browser fixture uses an isolated test origin, verifies controls at phone width, and restores the original Ladder save after finishing.
