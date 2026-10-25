# Wave 3 results

Conditioning now has setup, priority-based aerobic targets, conservative placement, a timer, outside-activity logging, recovery carry and twelve-week progress. Goals live in Muscle/Strength saved state. Today includes a dismissible weekly recap.

The reported old-workout screenshot was addressed: the full list hides global navigation and the fixed Together strip, groups Next set with session controls, and labels sessions open over twelve hours by start date. Logged timestamps are preserved.

Validation: 205 Node tests and 497 browser assertions passed across nine suites. The new suite covers planned and outside activity, goals, recap dismissal and an old saved workout list. Existing setup tests now expect four training choices; list-view tests expect unobstructed workout navigation.

Evidence checked: WHO/Bull 2020 (BJSM 54:1451), Momma 2022 (PMID 35228201), Schumann 2022 (PMC8891239). The next-day guard and fatigue conversion are explicitly app estimates; the studies do not establish exact cutoffs.

Known platform limits: no physical iPhone keyboard or locked-screen notification test. Browser sleep can delay conditioning cues. CSV is set-oriented; complete backups carry conditioning and goals.
