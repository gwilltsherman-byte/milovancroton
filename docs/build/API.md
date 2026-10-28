# Shared engine and cross-section API

All of these live in the shared region of `app.js`, after `window.GROWTH` and before `TAKE BACK`, each under its own
marker: `SETS IN NUMBERS` (Lift), `NUMBERS PEOPLE TYPE` (Num), `DAYS` (Day), `YOUR KIT` (Kit), `BODYWEIGHT` (Body).
They are globals in the browser (`Lift`, `Num`, `Day`, `Kit`, `Body`). Weights are always kg in and kg out unless a
function says "in unit u". Tests: `tests/engine.test.cjs` (slices `ONE CHOICE FOR THE WHOLE APP` to `TAKE BACK`).
A test harness that runs a trainer module in a vm must expose them: `['Num','Day','Kit','Body'].forEach(k=>ctx[k]=ctx.window[k])`
(done in `tests/ladder.test.cjs`).

## Num: numbers people type

| Function | Arguments | Returns | Example |
|---|---|---|---|
| `Num.parse(v)` | string or number | finite number or `null`. Spaces (incl. thin/no-break) ignored; `,` or `.` as decimal; with both marks the last one is the decimal (`1.000,5`, `1,000.5`). Rejects `''`, `'abc'`, `'1,2,3'`, `'62kg'`. | `Num.parse('62,5') → 62.5`, `Num.parse(' 1 000,5 ') → 1000.5`, `Num.parse('') → null` |
| `Num.int(v)` | as above | the whole part (`Math.trunc`) or `null` | `Num.int('8,9') → 8` |

Use it for every typed value; never for stored data. Every trainer's `fromDisp` already goes through it.

## Day: calendar days that survive clock changes

| Function | Arguments | Returns | Example |
|---|---|---|---|
| `Day.start(ts?)` | ms (now when left out) | local midnight of that day, ms | `Day.start()` = start of today |
| `Day.key(ts?)` | ms | local `'YYYY-MM-DD'` | `Day.key(Date.now()) → '2026-10-24'` |
| `Day.add(ts, n)` | ms, whole days (may be negative) | same local time n calendar days later (setDate) | `Day.add(Day.start(), -6)` = midnight six days ago |
| `Day.diff(a, b)` | two ms | whole calendar days from b to a (rounded, so 23/25-hour days count as 1) | `Day.diff(Date.now(), session.date) → 2` |
| `Day.range(a, b)` | two ms | `[start of each calendar day from a's to b's]` | `Day.range(Day.add(Day.start(),-6), Date.now()).length → 7` |

Rule: count days with these; keep `Date.now()-n*864e5` only for elapsed-time cut-offs where an hour does not matter
(rest timers, "within 28 days"). Every trainer's `startOfToday`/`daysAgo`/`relDay` (Muscle, Ladder; Strength's `relDay`)
now use Day. Key per-day maps by `Day.key` (Muscle's `trainingDayMap` does).

## Lift: the training maths

Kinds of exercise (`cls`): `'upper'` (default), `'lower'` (lower-body compounds: squats, hinges, lunges, hip thrusts),
`'iso'` (single-joint) and `'sled'` (the leg press and hack squat). `'upper'`, `'lower'` and `'iso'` share one curve,
today's (Epley with a straight line 1 to 4 reps): Nuzzo et al. 2024 say their main table holds for every exercise but the
bench press and leg press, and it matches Epley as far as it could be checked (about 19.5 reps at 60%). Only `'sled'` has
its own curve. Everything but `'iso'` takes the compound reps-in-reserve correction.

| Function | Arguments | Returns | Example |
|---|---|---|---|
| `Lift.pct(eff, cls?)` | reps to failure (reps + reps left), kind | share of 1RM. `upper`/`lower`/`iso`: Epley (straight line 1 to 4 reps). `sled`: straight lines through Nuzzo 2024's leg press figures, 1 rep at 100%, 13.1 at 80%, 19.0 at 70%, then Epley's shape. Monotonic and continuous; every kind falls at least 1.5% a rep from 6 to 13 reps. | `Lift.pct(10) → 0.75`, `Lift.pct(13.1,'sled') → 0.80` |
| `Lift.cls(o)` | `{compound, lower, sled}`, a Muscle exercise `{id, name, comp, primary}`, a Strength `EX[id]` (`{n, h, lower}`; all compounds), or a kind string | `'iso'` (not compound), `'sled'` (`sled:true`, or an id/name/`h` with "leg press" or "hack squat"), `'lower'` (quad/ham/glute primary or `lower`), else `'upper'` | `Lift.cls(EX.squat) → 'lower'`, `Lift.cls(EX.legpress) → 'sled'`, `Lift.cls({comp:false}) → 'iso'` |
| `Lift.e1rm(w, reps, rir, cls?)` | kg, reps, RIR as called, kind | estimated 1RM, with the RIR corrected by `trueRir` | `Lift.e1rm(100,8,2) → 133.3` |
| `Lift.usable(reps, rir)` | reps, RIR (null = unknown) | true when reps + max(rir,0) ≤ 12 and rir ≤ 3.5; unknown RIR passes (estimate weighs it less if you mark it unrated) | `Lift.usable(10,3) → false` |
| `Lift.trueRir(rir, reps, cls?)` | RIR as called, reps, kind | RIR corrected for how you judge it: never changed at 0; correction capped ±1 on sets of ≤5 reps and ±3 always; compound correction unless `cls==='iso'` | `Lift.trueRir(2, 8, 'iso')` |
| `Lift.hard(rir, reps, cls?)` | as trueRir | hard-set credit: 1 at true RIR 0–3, linear to 0 at 7; unknown (null) counts 1 | `Lift.hard(5, 10) → 0.5` |
| `Lift.tiring(rir, novel)` | the corrected RIR (pass `Lift.trueRir(...)`), new movement? | recovery weight 1.3/1/0.7 × 1.5 if novel (unchanged) | `Lift.tiring(Lift.trueRir(s.rir,s.reps,k), nv)` |
| `Lift.novelty(history, keys)` | unchanged | unchanged | |
| `Lift.reps(e1, load, rir, cls?)` | estimated max kg, load kg, **true** RIR to stop at, kind | reps you would get (real number, not rounded; 0 when load > e1; null without numbers). Exact inverse of `pct`, so a 2.5 kg change moves a prediction by about a rep for every kind. | `Lift.reps(133.3, 100, 2) → 8` |
| `Lift.load({bw, share, added, assist})` | bodyweight kg, share of it lifted (default 1), added kg (belt/vest), assistance kg (counterweight/band) | `bw*share + added - assist`, never below 0; `null` if share > 0 and no bw | `Lift.load({bw:80, share:0.95, assist:30}) → 46` |
| `Lift.estimate(points, opts?)` | `[{date, e1, rated}]` one per session; opts `{half:21 (days), unrated:0.5, max:8}` | `{value, lo, hi, n, last}` or null. Exponentially weighted mean (half-life 21 days), unrated points half weight (`unrated:0` leaves them out). From 3 points on, points beyond 2.5 robust spreads of the weighted median are clipped; with 1 or 2 points, a plain weighted mean (two points can't say which one is odd). lo/hi = ±2 SE with per-session noise floored at 2.5%. null when no point counts. No best-of, so it does not ratchet. | `Lift.estimate(sessions.map(s=>({date:s.date, e1:s.best, rated:s.rpe!=null}))).value` |
| `Lift.trend(points, opts?)` | same points; opts `{max:8, unrated:0.5}` (`unrated:0` leaves unrated points out) | `{slope (fraction per week), se, state:'up'|'flat'|'down'|'unknown', n}`. Weighted regression of log e1 over the last 4–8 sessions that count; called only when \|slope\| > max(0.5%/week, t·SE) (t = Student's 97.5% for n−2 df). Fewer than 4 sessions that count, or all on one day: 'unknown'. Flat noise stays flat ~95% of the time. | `Lift.trend(pts).state === 'down'` |

Reps-in-reserve model (item 26):

| Function | Arguments | Returns | Example |
|---|---|---|---|
| `Lift.model(recs, now?)` | calibration records `{date, error, cls, predictedRir}` (Muscle's `state.rirCal`; no `cls` = single-joint) | `{c, i, nc, ni}`: corrections (reps) for compounds and single-joint; recency-weighted (half-life 90 days), shrunk by n/(n+3) with n the weighted count, capped ±3. Records with `predictedRir` 0 are left out (they can only show reps left over, and a set with no RIR entered is checked as 0), so a person who calls every check at 0 gets no correction, as Muscle's card says. | `Lift.model(state.rirCal) → {c:0, i:0.49, nc:0, ni:0.96}` |
| `Lift.use(m)` | a model | puts it in use in every section now and saves it as Prefs `'rirModel'` (read at every start; an old install with only `'rirBias'` uses that as the single-joint correction) | Muscle's `shareBias()` = `Lift.use(Lift.model(state.rirCal))` |
| `Lift.corr(cls)` | kind | the correction in use, before trueRir's caps | `Lift.corr('iso')` |
| `Lift.calibrate(rec)` | `{predictedRir, actualExtra, cls, exId?, reps?, date?, from?}` | the record kept (with `error = actualExtra - predictedRir`) or null; it goes to Muscle through `__hub.api('lift').addCal`, which saves it and recomputes the model | Strength plus set: `Lift.calibrate({predictedRir:2, actualExtra:3, cls:Lift.cls(EX.squat), reps:5, from:'Strength', exId:'squat'})` |
| `Lift.bias` | legacy accessor | get: the single-joint correction; set: both corrections (tests only) | |

## Kit: one equipment model (Muscle and Strength)

Equipment names: `'bar'` main barbell, `'trap'`, `'ez'` (own bar weights), `'plate'` (pairs of plates from zero, no
bar: landmine/T-bar, and Muscle's barbell below the bar weight), `'db'` dumbbell rack, `'stack'` machine/cable pins,
`'added'` plates on a belt (smallest plate; Strength's `'none'` behaves the same), `'bw'` Muscle's bodyweight jumps
(2.5 kg / 5 lb). `u` is `'kg'` or `'lb'` (the app's Prefs unit when left out; trainers always pass theirs).

Storage: Prefs keys (`trainer.shell.*`) `platesKg`, `platesLb`, `barKg` (kg-mode bar, in kg), `barLb` (lb-mode bar, in
lb), `plateCount` (`{kg:{'25':pairs,...}, lb:{...}}`; missing = plenty), `collarKg` (each), `bars`
(`{trap:{kg:25,lb:55}, ez:{kg:10,lb:25}}`), `dbRackKg`/`dbRackLb` (array, or `{list, step}`), and the existing
`dbStepKg`, `dbStepLb`, `stackStepKg`, `stackStepLb`. First use seeds `platesKg`, `platesLb` and `barKg`, each on its own,
from the trainer where it differs from the default (Strength's when both differ; plates compared as a set), else the
default; a trainer whose settings lack the key is skipped, so opening Strength once never overrides Muscle's kit. Defaults: machine jump 2.5 kg / 5 lb; dumbbells in kg: jump under 2.5 → list up to 10 then 2.5 steps
(default jump 2: 2,4,6,8,10,12.5,15...); jump 2.5 → 2.5 grid; lb: 5,10,15... `platesKg`, `platesLb` and `barKg` are
also mirrored into each trainer's `settings` (the shell's `__prefs` and both `syncPrefs`), so backups still carry them.

| Function | Arguments | Returns | Example |
|---|---|---|---|
| `Kit.get(u?)` | unit | `{u, bar, plates (desc), count, collar (each, in u), dbStep, db:{list, step}, stack, bars:{trap, ez}}`, all in u | `Kit.get('kg').plates → [25,20,15,10,5,2.5,1.25]` |
| `Kit.step(equip, u?)` | equipment, unit | smallest jump in u: 2× smallest plate (bar kinds, plate), smallest plate (added), dumbbell jump setting, machine jump, 2.5/5 (bw) | `Kit.step('bar','kg') → 2.5` |
| `Kit.round(kg, equip, mode?, u?)` | kg, equipment, `'near'` (default; tie goes up) / `'up'` / `'down'`, unit | kg you can load: bars never below bar + collars; plate counts honoured; dumbbells from the rack (never 0); capped at the heaviest loadable (so `'up'` past the top gives a lighter weight: use `next` when you need to know); null for null | `Kit.round(61,'bar','near','kg') → 60`, `Kit.round(23,'db','near','kg') → 22.5` |
| `Kit.next(kg, incKg, equip, u?)` | current kg, wanted increase in kg (negative = decrease), equipment, unit | `{kg, big, max, min}`: next loadable at or above kg+incKg (at or below when negative); `big` when the real jump is more than 2× incKg, so the caller can add reps first; `max` when nothing you have is that heavy (kg is the heaviest, maybe no more than now: progress reps instead), `min` when nothing is that light (kg is the lightest). Use it, not `round(...,'near')`, for any change meant to move: 1 kg jumps on a rack of 10 then 12.5 go 10 → 12.5 (`big`), not back to 10. | smallest plate 5 kg: `Kit.next(60, 2.5, 'bar', 'kg') → {kg:70, big:true, max:false, min:false}`; rack to 30: `Kit.next(30, 2, 'db', 'kg') → {kg:30, big:false, max:true, min:false}` |
| `Kit.plates(kg, bar?, u?)` | total kg, `'bar'`/`'trap'`/`'ez'` or a bar weight in kg, unit | per-side `[{p, c}]` heaviest first (`[]` for the empty bar), honouring counts and collars, backtracking when greedy fails; `null` when it can't be made exactly (within 0.03 a side) or is under the bar | `Kit.plates(100,'bar','kg') → [{p:25,c:1},{p:15,c:1}]` |
| `Kit.bar(equip?, u?)` | `'bar'` / `'trap'` / `'ez'`, unit | bar weight in u | `Kit.bar('bar','lb') → 45` |
| `Kit.BARS` | | the six selectable bars `[[20,'kg'],[15,'kg'],[10,'kg'],[45,'lb'],[35,'lb'],[15,'lb']]` | settings pills |
| `Kit.setBar(n, bu, u?)` | bar weight n in unit bu, the unit it is for | saves `barKg`/`barLb`; returns the weight in u | `Kit.setBar(45,'lb','kg') → 20.4117` |
| `Kit.barIs(n, bu, u?)` | as above | whether that is the bar in use | pill highlighting |
| `Kit.set(o)` | any of the Prefs keys above | saves through `Prefs.set` (so trainers mirror plates/bar/steps) | `Kit.set({plateCount:{kg:{'25':2}}, collarKg:2.5})` |

Wave 1 added the settings UI for plate counts, collars, trap/EZ bar weights and dumbbell racks. Strength uses `Kit.next(...).big` to prefer reps before an oversized load jump. The shared model remains the source of loadable weights.

## Body: one bodyweight log

The store stays Muscle's dated `bodylog`; Body reaches it through the hub. `L` (optional) is a log `[{date, kg}]` to use
instead of the saved one (tests, or Muscle itself).

| Function | Arguments | Returns | Example |
|---|---|---|---|
| `Body.list()` | | the saved log, `[{date, kg}]` oldest first (via `__hub.api('lift').bodyLog()`; `[]` if Muscle has no data) | |
| `Body.at(ts, L?)` | ms | kg: latest logged at or before ts, else the first reading; Strength's old `settings.bw` when nothing is logged; else null | `Body.at(Date.now()) → 81` |
| `Body.latest(L?)` | | `{date, kg}` (date null for Strength's undated weight) or null | |
| `Body.trend(days?, L?, now?)` | window in days (28) | `{kgPerWeek, smoothed, n}`: smoothed = 7-day moving average at the latest reading; kgPerWeek = slope of that average (null with under a week of readings); n = readings in the window | `Body.trend(28).kgPerWeek → -0.35` |
| `Body.log(kg, ts?)` | kg (20–400), ms (today) | true when saved, for the day of ts, through Muscle's `logBody(kg, ts)` | `Body.log(80.4)` |

## Dose: reps, effort and rest (set by the app, never edited)

Marker `REPS, EFFORT AND REST`, right after `window.SAME_LIFT`. Global `Dose`; a vm harness exposes it with the others
(`ctx.Dose=ctx.window.Dose`). "You" is `{exp, stage}`: Together's saved set-up (`trainer.together`: `exp` when `on`,
`stage` always), else the section's own fallback (Muscle: `settings.exp`, saved by its block generator), else intermediate.

| Function | Returns |
|---|---|
| `Dose.who(fallback?)` | `{exp, stage}`: exp `beginner`, `intermediate` or `advanced`; stage `''`, `u18`, `older` or `preg`; re-parses only when the saved text changed |
| `Dose.reps(kind, w)` | Muscle `[low, high]` by kind: heavy 6–10 (8–12 when new, under 18, 65+ or pregnant), comp 8–12, bw 6–12, iso 10–15, bwiso 8–15, small 12–20, hold 20–60 s |
| `Dose.rest(kind)` | Muscle seconds: heavy 180, comp/bw 120, others 90 |
| `Dose.span(w)` / `Dose.floor(w)` | a block's `[startRir, endRir]` ([2,0]; [3,1] new or 65+; [3,3] under 18 or pregnant) / the fewest in reserve ever given (0, 1, 3) |
| `Dose.strRest(kind)` | Strength: warm 75, top/plus 240, other work 180 |
| `Dose.ladderRest(practice, skill, reps)` | Ladder: balance 60; power, skills and 1–5 reps 180; other 120 |

Muscle uses it through `doseKind(ex)`, `defOf(ex, w)` (`{repLow, repHigh, rir, rest}`; rir outside a block), `muscleWho()`
and `syncDefs()` (library `def`s and block exercises' stored ranges, on each render and `hubCatalog`). `mesoEntry` and
`entryFromEx` take targets from `defOf`, and `mesoEntry` and `weekRir` never go under `Dose.floor`.

## Together: a swap for the whole mesocycle (`__hub.api('mix').blockSwap`)

`blockSwap(m, from, to, dry)`: m `'lift'` puts Muscle's exercise `to` in `from`'s place in the picks of each muscle `from`
is planned for that `to` trains (`tune.ex`, plus `perDay`/`hold`); m `'str'` makes `to` the lift of each area `from` is
on (`tune.lift`). The plan refills its days and keeps its week (the tune is in the plan's signature, not its base), with
one Undo. With `dry`, only whether it can (Strength needs only `from`). `weekPeek(m, id, mus?)`: for the swap sheets, each
day of this week (`[{n, today, ids}]`, days with any) with Muscle's exercises for the muscles `id` is planned for (`mus`
when it isn't), or Strength's lifts for `id`'s area; `null` when it isn't in the week. Muscle's `weekPeek(en, dayId?)`
and Strength's `strWeek(en)` give the same from a block or program of their own. Muscle calls it for a Together day
(`state.active.tgDay`, `tgBlockSwap`), Strength for a day Together started (`state.active.tg`, `tgSwap`).

## Hub API additions (Muscle, `__hub.api('lift')`)

- `bodyLog()` → `[{date, kg}]` oldest first (copies).
- `logBody(kg, ts?)` → now takes the day (`Day.start(ts)`); default today, as before.
- `addCal(rec)` → pushes a calibration record to `state.rirCal`, recomputes and shares the model (`Lift.use`), saves; true/false.

## Rewired call sites (for orientation)

- Muscle: `fromDisp` (Num); new `clsOf(exId)` → `Lift.cls` (passes id and name, so the leg press and hack squat are `'sled'`); `est1RM(kg,reps,rir,exId)` passes the class; `bodyAt` →
  `Body.at` over Muscle's own log (falls back to Strength's weight); `startOfToday`/`daysAgo`/`relDay` (Day);
  `predictReps(lastW,lastR,lastRir,newW,targetRir,cls?)` = `Lift.e1rm` + `Lift.reps`; `repHint` passes the class;
  `weeklyVolume`, `hubWork`, `suggestLoad` use the class for `hard`/`trueRir`; `rirAccuracy` (recency
  weighted, adds `.model`), `shareBias` → `Lift.use(Lift.model(...))`; `kitEq(eq, kg)` maps Muscle equipment to Kit
  (`Barbell` → `'bar'`, or `'plate'` below the bar weight, compared unrounded in the unit in use so a bar picked in the
  other unit counts as the bar); `loadStep`, `stepOf`, `roundLoad`, `availablePlates`, `barDisp`, `roundToPlate`,
  `platesFor` → Kit; new `lighter(kg, f, eq)` (kg*f to the nearest you can load, or the next one down when that rounds
  back to kg) for the deload and the back-after-a-break drop; suggestLoad's "every set at the top" step (`Kit.next`; at the
  heaviest you can load it holds the weight: "the heaviest you can load · +1 rep instead"), its ease-off below the range
  (`Kit.next` down; "the lightest you can load" when nothing is lighter) use `Kit.next` (no set's weight changes mid-session: Muscle's former `adjustNext` and Strength's top-set following were removed, and Strength's `sessionPts` caps a back-off left at its target effort at that day's top set); settings bar pills (all six, both units), plate toggles and jumps write through Kit; heatmap, 7/28-day
  counts, `weeklyBuckets`, "away" checks → Day; typed numbers → Num.
- Strength: `fromDisp` (Num); `plateList`, `barDisp`, `stepDisp`, `roundLoad`, `platesFor` → Kit; settings bars (both
  units), plates, jumps via Kit; `relDay`, return-after-a-break days, this week's sessions → Day; starting test, Max
  calculator, set inputs and history editor → Num. New `clsOf(id)` = `Lift.cls(EX[id])`; `e1(w, reps, rir, id)`,
  `pctOf(eff, id)` and `loadFor(e1rm, reps, rpe, id)` take the lift (left out: the default curve, as the Max calculator
  does), and every caller with a lift passes it (`setE1`, `muscleSessions`, the hub's `lastSet`, the starting test, top-set
  and RPE prescriptions), so a set means the same max in Muscle and Strength (they differ from before only for the leg
  press). New `upLoad(kg, id)` = `Kit.next(kg, incKg(id), eqOf(id))` for double progression (holds with "the heaviest you
  can load, so keep adding reps" when `.kg` doesn't move), linear progression and the wave training-max bump; new
  `lighter(kg, f, eq)` for the three-miss reset. `.big` is used by the wave-1 progression logic to prefer reps for an oversized jump.
- Ladder: `daysAgo`, `relDay` → Day; set, test, standard, custom-ladder and setup inputs → Num.
- Together: lighter-week window, readiness baseline, pain streak, carry-over day windows, check-in body prompt, weekly
  sets window → Day; check-in bodyweight → `Num.parse` and `Body.log`.
- Shared/shell: `MiloDesign.week` count end, backup "N days ago" → Day; `__prefs` passes `platesKg`, `platesLb`,
  `barKg` on to trainers.

## Session and outcomes (waves 2–5)

- `MiloSession.syncShell(root)` keeps global navigation out of an active workout in either focus or list view. `elapsed(active)` returns an elapsed label, or the start date for sessions open at least twelve hours; it never changes saved timestamps.
- Muscle and Strength expose `outcomes()`, `setOutcomes(goals)`, and `goalSets(exerciseId)` through the hub. Goals are additive `outcomeGoals` arrays in each existing trainer payload, including backup and undo. Together's `openOutcomes(owner)` opens their shared goal form.
- Together owns `conditioning` with `target`, `style`, `active` and `log`. Its `cond` hub adapter provides session status and records but has no trainer DOM host; callers must not use the trainer-only `H.away('cond')` route.
- `condPlacement` uses chosen weekdays, remaining session time and heavy-day guards. Priority participates in the plan signature, so changing Conditioning rank invalidates its allocation.
- `condEquivalent` counts vigorous minutes twice and moderate once. For 2-minute alternating intervals, it counts the completed hard/easy segments separately, including an incomplete final segment. The logged intensity can override the planned one.
- Outcome projections aggregate by calendar day and require four days with a clear upward trend and a recent observation. Repeated sets on one day do not create independent trend evidence. The projection is an estimate, not a completion guarantee.
- Conditioning is not a resistance-training set. CSV exports remain set-oriented; complete backups include activities and outcome goals.
