# Feature guide

Start with the [quick start](QUICKSTART.md). This page describes the current behavior; screenshots of the older trainer-tab layout are being replaced.

## One app

Today holds the next workout. Train resumes open sessions or starts a section separately. Progress combines results and offers section filters. Library contains exercise instructions and evidence. Settings contains preferences, program setup and data tools.

Together builds a combined program. Muscle, Strength and Ladder also support their own programs. Existing deep links and saved training remain supported.

## Together’s week

Priority changes dose, not exercise order. The first selected section builds, the second receives a moderate dose, and later sections receive maintenance doses. Conditioning uses the same ranking principle.

Skills come first, followed by heavy lifts, other Ladder work, Muscle and any remaining core work. Conditioning comes last. The planner uses chosen weekdays, equipment, experience and available time.

Heavy squats and hinges are separated where the schedule permits. Straight-arm work also has spacing rules. Limited days, equipment or time can leave targets unmet; the plan reports constraints rather than inventing completed work.

A block has four building weeks. Week five is lighter when performance, wellness or persistent joint pain meets the decision rule; otherwise it can be a top week. Beginner and gentler blocks retain their effort limits.

## Conditioning

Choose easy, interval or mixed sessions. The default aerobic target is 150 moderate-equivalent minutes per week. Second priority receives about 100 minutes and later priorities about 50 at the default target.

One vigorous minute counts as two moderate minutes. Light activity stays in the log without contributing to that total. Interval sessions alternate two hard and two easy minutes. Confirm actual intensity when saving.

Sessions use available time after lifting. Hard intervals are avoided on heavy leg days and adjacent days before them. This next-day guard is a conservative scheduling estimate, not an exact scientific cutoff.

Log running, cycling, rowing, swimming, walking, sport or other activity. Record minutes and whole-session effort from 0–10. Distance in kilometres and average heart rate are optional.

Minutes, effort and activity type contribute a leg-recovery estimate. Running and sport weigh more than cycling or swimming. This can reduce subsequent Muscle work; it never adds invented hard sets to volume totals.

Progress shows twelve weeks of aerobic minutes, activity counts and average effort. Keep Milo open for reliable interval cues; phone sleep can delay sound and vibration.

## Check-in and safety

The optional health screen follows the general approach of PAR-Q+. A positive answer suggests professional advice and a gentler block. It does not diagnose a condition or certify readiness.

Daily check-ins support quick or detailed answers. Wellness is compared with your own baseline. Soreness, illness and joint pain influence planning alongside performance; missing answers are not counted as bad recovery.

Joint-to-movement rules can reduce or replace work that loads a sore area. Fever or systemic symptoms produce rest guidance. Red-flag symptoms require appropriate medical attention. Read the in-app explanation when a safety adjustment appears.

Optional life-stage settings adapt training for younger people, older adults, and pregnancy or after birth. These are broad defaults, not personalized medical clearance.

## Muscle

Muscle plans hard sets across muscles and regions. Together accounts for overlapping work from other sections. Helping muscles receive fractional credit where the volume view uses it; warm-ups are excluded.

The log supports rep ranges, reps in reserve, warm-ups, supersets, exercise changes and custom exercises. Load progression uses completed performance and available equipment. Larger load jumps can require extra reps first.

Volume adjustments use training performance and bounded changes. Recovery estimates can trim planned sets. Exercise instructions explain setup and movement; they do not measure form.

## Strength

Strength supports linear practice, percentage-based waves and top-set/back-off training. Working weights and estimated maxima remain distinct. Estimates use recorded performance; repeatedly accepting a prescription does not compound a training-max multiplier.

Back-offs can follow the top set logged today. Misses, breaks and equipment increments affect the next prescription. Warm-ups and deliberately easy power work are treated separately from estimation evidence.

## Ladder

Ladder trains named calisthenics goals and their supporting qualities. Rep ranges include effort targets. Holds, left/right work and timed balance practice have dedicated controls.

Progression depends on the exact movement, standard, form and setup. Load, assistance and execution mode affect whether a set proves readiness. Muscle entries contribute training volume, not automatic rung completion.

Entry checks, prerequisites and spacing govern advancement. A later rung never automatically proves an unmet earlier standard. See [Ladder progression](ladder-progression.md) for the rules and their limits.

## Estimates, effort and trends

RIR means repetitions left in reserve; RPE rates effort. The engine uses exercise-class repetition curves and available effort information. Estimated one-repetition maxima are estimates, not tested personal records.

Recent performance receives more weight. Uncertain or missing effort reduces confidence. Trends require enough distinct sessions and must exceed estimated noise before being called upward or downward.

Goals can target an estimated max, reps at a load, or weekly hard sets for several weeks. A projected date appears only when the trend supports one. Dates are estimates, not guarantees.

## Equipment

Plate counts, bar choices, collars, dumbbell racks and machine increments constrain load suggestions. Assisted and weighted bodyweight movements use different load directions. A prescription should always be checked against the equipment actually used.

## Data and privacy

Training stays in browser storage. There are no accounts, analytics or automatic cloud synchronization. Clearing storage, losing a device or browser eviction can lose data; export backups regularly.

Complete JSON backups include workouts, program data, conditioning and outcome goals. Optional passphrase encryption uses authenticated encryption. A forgotten passphrase cannot be recovered by Milo.

CSV export carries workout-set data. Strong and Hevy CSV imports preview supported records before saving. CSV is not a complete backup of conditioning, goals or settings. Coach summaries and calendar files are separate exports.

Restore validates the file and attempts rollback if writing fails. Storage and backup size limits still apply. Erase everything is available in Settings and requires explicit confirmation. See [security guidance](../SECURITY.md).

## Accessibility

The app supports keyboard navigation, focus indicators, light and dark themes, reduced motion and labelled inputs. Next-set and list views keep logging clear of global navigation. Narrow layouts wrap controls and long exercise names.

Rest alerts depend on browser support and permission. iOS does not receive the optional background rest notification. No browser-only implementation guarantees alerts while the phone is locked.

## Evidence and limits

Evidence cards distinguish research results from coaching defaults. Estimated loads, readiness, fatigue, progression gates and completion dates are not direct measurements of the body.

Conditioning references [WHO 2020](https://bjsm.bmj.com/content/54/24/1451), [Momma 2022](https://pubmed.ncbi.nlm.nih.gov/35228201/) and [Schumann 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC8891239/). The mortality evidence is observational; it does not establish individual outcomes.
