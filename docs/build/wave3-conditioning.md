# Wave 3a brief: Conditioning (K7, review items 86 and the fatigue part of K5)

Region: the Together module (its state, program builder, day runner, views and check-in), plus the shell's
Progress "All" page and filter (from wave 2a) to add a Conditioning view. Store everything in Together's own
saved state (`trainer.together`), additively, so it is backed up with no key changes; keep old saved states
loading. Use `API.md`. Read wave 2's result first (`git log`): the app is one app with Today · Train ·
Progress · Library, and a focus-mode session screen.

## What the person should experience
- **Set-up:** "Conditioning" is a fourth thing to train, next to Muscle, Strength and Ladder (also in program
  set-up in Settings), with a weekly target defaulting to the WHO 2020 adult guideline (150 minutes moderate,
  or 75 vigorous, or a mix where 1 vigorous minute counts as 2), and a style: easy (zone 2), intervals, or mixed.
  Ranked like the others: first gets the full guideline, second about two-thirds, third a maintenance amount.
- **Planning:** conditioning sessions go on days without heavy lower-body lifting where possible; on a lifting
  day they come after lifting (never hard intervals before heavy squats, deadlifts or explosive Ladder work);
  hard intervals at least about 24 h before a heavy lower-body day (Schumann et al. 2022, verify with
  WebSearch). Sessions fit the day's time budget like the other parts.
- **Running a conditioning part:** a simple timer screen in the same focus-mode style: the planned activity
  (for example "30 min easy: you can talk in full sentences" or "6 × 2 min hard, 2 min easy"), a running clock,
  interval cues with sound and vibration per Prefs, and Done; then log minutes, activity (run, cycle, row,
  swim, walk, sport, other), and how hard it felt (session RPE 0–10, with plain labels); optional distance
  and average heart rate.
- **Log any activity:** a quick "Log activity" action on Today and Train for things done outside the plan
  (a football match, a hike), with the same fields, counted toward the weekly minutes.
- **Fatigue:** each conditioning entry adds load (minutes × session RPE) that feeds Together's carried fatigue
  for the legs (quads, hamstrings, calves, glutes), scaled so an hour of easy cycling counts for a little and a
  hard 90-minute football match counts like several hard leg sets; running and sport weigh more than cycling,
  rowing or swimming; it can trim the next day's leg work the way sets do. Say so in a short note when it does.
- **Progress:** a Conditioning filter: weekly minutes (moderate-equivalent) against target over the last 12
  weeks, sessions by activity, and the check-in-free "how hard" trend.
- Evidence chip: WHO 2020 guidelines (Bull et al. 2020, BJSM), Momma et al. 2022 (BJSM: aerobic plus
  muscle-strengthening activity together, lowest mortality), Schumann et al. 2022 (concurrent training): each
  verified with WebSearch before citing.

Add Node tests for the weekly target maths, placement rules (no intervals before heavy legs), and fatigue
scaling, and a browser test that sets up conditioning, runs and logs a part, and logs an outside activity.
Everything must pass.
