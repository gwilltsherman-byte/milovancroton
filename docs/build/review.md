# Milo van Croton: everything I would change

Review of `main` at `bd25f38`, 24 October 2026. Nothing in the repository was changed.

**How this was checked.**
- Six reviewers each covered one area: Muscle science, Strength science, Ladder, Together, a hands-on phone walkthrough, and engineering.
- Nine more checkers then tried to disprove every serious claim, by reading the code and, for most claims, running it in Node or Chromium.
- One critic looked for topics nobody had covered.
- Every item below survived that check. Where a checker changed a number or the severity, the corrected version is the one given here.
- One claim was refuted and dropped (see the appendix).
- Research was checked with web search. PubMed itself was blocked from this environment, so a few journal details rest on search results rather than on the paper.

**Where things stand today.**
- The 45 Node tests and all 244 browser checks pass.
- CI runs only the Node tests and the integrity check. None of the browser suites run, and nothing is tested on Safari/WebKit.

Severity labels:
- **Critical:** loses data or risks injury for many people.
- **High:** clearly wrong numbers, or a core flow is broken.
- **Medium / low:** real, but narrower.

---

## Fix first: the 15 that matter most

1. **The app can erase a long-time user's whole history** (critical, verified in Chromium).
   - **What happens:**
     - Each trainer loads its own saved data through the backup-import check: `app.js:1880`, `6433`, `8628` and `10436` call `MiloSecurity.parseSection`. That check refuses anything over 100,000 nodes or 2 MB (`security.js:19`, `:83`).
     - Muscle reaches that limit after about 295–600 sessions, depending on session size; a 6-exercise × 3-set session hits it at about 406. Strength reaches it at about 490 sessions of 3 lifts × 6 sets.
     - When loading fails, the trainer starts empty, and the next tap saves that empty state over the real data.
     - The rescue copy (`Safe.rescue`, `app.js:1484`) is only written if none exists yet. It can also fail for lack of space, because the undo copy fills the quota (item 4). The app still says "A copy is kept".
     - Nothing in the app can load a `.corrupt` copy back.
   - **Change:**
     - Load the app's own data with no import limits.
     - Never let a default state overwrite a key that failed to load. Go read-only, show a banner and offer "Download raw data".
     - Add a restore-from-`.corrupt` button.
     - Add a test that generates five years of history and loads it. The unit tests mock the validator (`parseSection: value => JSON.parse(value)`), which is why this was missed.
2. **Strength's estimated maxes inflate themselves** (high, verified by running).
   - **What happens:**
     - A set ticked without an RPE is scored at its target RPE (`setRir`, `app.js:8752`).
     - `Lift.e1rm` (`1389–1395`) then adds the shared reps-in-reserve correction, while `loadFor` (`8751`) prescribes without it.
     - `currentE1` takes the best of the last 3 sessions, and loads are rounded to the nearest plate.
     - With a correction of +1 and a lifter who keeps doing the prescribed reps, the estimate goes 100 → 128 kg in 12 sessions. A realistic lifter who can't keep up settles 10–15% too high, because missed reps are still scored at the target RPE.
     - Even with no correction, rounding plus best-of-3 drifts 100 → 111 kg over 48 sessions.
   - **Change:**
     - Score sets with no RPE as RIR 0 with no correction, or leave them out of the estimate.
     - Score missed target reps as RPE 10.
     - Use a smoothed estimate (moving average or median) instead of the best of 3.
3. **Decimal commas are lost** (high, verified in Chromium).
   - **What happens:**
     - The iOS decimal keypad shows "," in most of Europe.
     - In Muscle, `fromDisp` (`app.js:1926`) turns "62,5" into nothing. The set is then logged quietly at last session's weight, or with no weight.
     - In Strength (`8672`), "62,5" becomes 62. An RPE of "8,5" becomes 8.
     - Only the check-in's bodyweight field handles commas (`11311`).
   - **Change:** one shared `parseNum()` that accepts "," and ".", used at all 17 places numbers are read. Show numbers with `Intl.NumberFormat`.
4. **The undo copy takes up most of the storage** (high, measured).
   - **What happens:**
     - The undo copy (`TakeBack.keep`, `app.js:1435–1439`) stores the whole state twice, as JSON text escaped inside JSON, and is never deleted when it expires.
     - At 300 sessions, Muscle's data is 0.84 M characters and its undo copy is 1.98 M. The browser allows about 5 M in total, for Muscle, Ladder and Strength together.
     - This is also why the rescue copy in item 1 fails.
   - **Change:** store a session id plus what changed, delete the copy once it expires, and stop copying exercise metadata into every logged entry. Records would be about half the size.
5. **Assisted pull-ups progress backwards** (high, verified).
   - **What happens:**
     - `assisted-pullup` (`app.js:1611`) logs the counterweight, and `suggestLoad` (`3339`) adds a step when you hit the top of the range, which makes the exercise easier.
     - The deload, the lighter return after a break, the below-range rule, the estimated max and the records all run backwards too.
     - Four ready-made blocks use this exercise.
   - **Change:** mark exercises as assisted. Effective load = bodyweight × 0.95 − assistance. Progress by taking assistance away.
6. **Weighted pull-ups and dips log "1 rep"** (high, verified).
   - **What happens:**
     - `repHint`/`predictReps` (`app.js:2012–2036`) work from the added weight only. Going from +10 kg × 8 to +12.5 kg predicts 1 rep, and ticking an empty reps box saves that 1.
     - With an 80 kg bodyweight the realistic answer is about 9.
   - **Change:** use `setLoad()` (the bodyweight share plus the added weight) in both functions.
7. **Joint pain does not touch the lifts that load the joint** (high, verified).
   - **What happens:**
     - The check-in maps lower back to `lback`, wrist to `fore` and knee to `quad` (`app.js:10827`). No Strength lift has these as its main muscles.
     - So lower-back pain at 8/10 changes nothing on a squat, deadlift and row day. It doesn't trim Muscle's RDLs or good mornings either, and wrist pain leaves pressing alone.
     - Strength never changes its plan for pain at any joint.
   - **Change:** map joints to movement patterns. The pattern maps already exist (`AREA_PAT`, `LAD_PAT`, `10393`).
     - Lower back → hinge, squat, bent-over row.
     - Wrist → pushing and handstands.
     - Knee → squat, lunge, jump and knee bending.
     - At 3 or more, offer a swap. At 6 or more, cut the work, Strength's included.
8. **Ladder never spaces out hard skill work** (medium-high, verified).
   - **What happens:**
     - `todayPlan`/`turns()` (`app.js:6706–6737`) plan every goal on every training day.
     - Planche at 3 × 15 s was planned six days in a row.
     - The rule against two straight-arm skills at once (`STRAIGHT_ARM`, `6136`) is only applied by Together. Ladder's own recovery advice exists only as text.
   - **Change:**
     - About 48 h between hard straight-arm sessions (planche, levers, flag, press) and between Nordic sessions, and about 72 h in the first month of Nordics.
     - At most one straight-arm main skill per session; otherwise offer an easier rung or support work.
     - Add `press` to `STRAIGHT_ARM`.
9. **A Nordic set logged in Muscle can complete Ladder's full Nordic goal** (medium-high, verified).
   - **What happens:**
     - Ladder imports every Muscle set as clean and strict (`app.js:6516–6518`).
     - Muscle's own Nordic instructions say to catch yourself on the hands until you can do a full rep, so these sets are often lowering only.
     - One rep logged in Muscle completed "Nordic curl" ("pull back up with the hamstrings alone").
   - **Change:** import Muscle sets as volume (`clean:false`), not as proof, or map Muscle's Nordic curl to Ladder's Nordic lowering step.
10. **Beginners are given RPE-9 triples** (high, verified).
    - **What happens:**
      - Together's experience setting only changes Muscle's set counts (`LIFT_TARGET`, `app.js:10383`). Strength's weeks in Together (`STR_WEEK`, `10380`) reach 3 reps at RPE 9 for everyone.
      - Strength's own set-up says RPE-driven top sets need a year of training (`9187`).
      - The starting test (`9237`) asks everyone to work up to a 5-rep set at RPE 8–9 on the first day.
    - **Change:**
      - New lifters get Strength's linear model: 2–4 weeks at RPE 6–7 with no sets to failure, starting light and adding small steps.
      - The test becomes "pick a weight that feels easy for 8".
      - Explain RPE in one line where it is used.
11. **Muscle's blocks give chest and quads about 6 hard sets a week** (high, verified).
    - **What happens:** at 3, 4, 5 and 6 days, intermediates get about 6 hard sets a week for chest and quads, because of fixed slots × 3 sets (`SPLIT_BP`, `app.js:3160`). The app's own evidence card says 10 or more.
    - **Change:** build blocks from per-muscle weekly targets: about 10–12 for intermediates, plus 3–4 for muscles you emphasise. Spread them over about 2 sessions a week, with a cap per session.
12. **The after-session survey raises volume too fast** (medium, verified).
    - **What happens:**
      - `applyFeedback` (`app.js:3430–3445`) adds +2 sets to **each exercise**, capped at 8 per exercise.
      - With "recovered early" and low pump, chest went 14 → 18 → 22 → 24 sets a week in three surveys, while the chip shows "+2".
      - Pump decides between +2, +1 and 0, against the app's own card ("not by soreness or pump"). Barsuhn 2025 found adding 30–60% more sets gave no more growth.
    - **Change:**
      - Decide per muscle, ±1–2 sets a week, about 20% at most.
      - Base it on logged performance at a fixed RIR, with joint pain able to block an increase.
      - Drop pump as an input.
13. **Clock changes empty the history heatmap** (medium, verified under London and New York time zones).
    - **What happens:**
      - The heatmap loop at `app.js:2865` steps 24 hours at a time over days keyed by local midnight. On 30 March in London it shows 1 of 112 trained days.
      - The "/7d" and "/28d" counts are wrong for up to about 16 weeks after each clock change.
      - `relDay` calls yesterday "Today" on the day after the clocks go forward.
    - **Change:** key days by `YYYY-MM-DD`, step with `setDate(+1)`, and round day differences.
14. **Two windows overwrite each other's work** (medium, verified).
    - **What happens:**
      - A tab left open undoes a session finished in another tab with one tap. That includes desktop, or an Android installed app beside a Chrome tab.
      - Hiding the old tab writes its stale state too, because `saveTimer` is never cleared (`1912–1916`).
    - **Change:** take a `navigator.locks` lock, and show "Milo is open in another window" in the others. Or check a revision number before saving and listen for `storage` events.
15. **A heavy user's backup can become impossible to restore** (high for people who use two or more trainers, verified).
    - **What happens:** export has no size limit or warning, but restore refuses anything over 2 MB. Muscle 400 + Strength 350 sessions makes a 2.07 MB backup that is refused.
    - **Change:**
      - Check each section on its own with a much higher limit.
      - Warn at export when a backup would be refused.
      - Test that every backup the app can make can be restored.

---

## A. Data safety, offline and engineering

16. **Safari can delete everything after 7 days** if Milo is used in a Safari tab rather than from the Home Screen.
    - Persistent storage is requested once and the answer ignored (`app.js:12203`); `persisted()` is never checked. The backup reminder waits 14 days.
    - **Change:** check `persisted()` at every launch, nudge people to Add to Home Screen, and remind after 5–7 days when Milo isn't installed.
17. **Backups miss some preferences.** `SHELL_KEYS` has only theme and section (`security.js:6`).
    - On a new device you lose Muscle's kit, Muscle's dumbbell and machine steps, its warm-up setting, and the reps-in-reserve correction until Muscle is opened.
    - **Change:** add the `trainer.shell.*` keys, with checks on their values.
18. **A slow-network update can break the next offline launch** (rare, verified in Chromium).
    - After the 3 s timeout the late `index.html` still goes into the cache (`sw.js:46–63`), but its new versioned `app.js` doesn't. The next offline start shows a blank page; the next online launch recovers.
    - **Change:** let only the new service worker's install write `index.html`.
19. **About 2.4 MB of fonts are never needed.**
    - The service worker caches all 34 TTF files (2.87 MB). Only 6 are used: Archivo 700/800 and Public Sans 400/500/600/700.
    - The section templates' old `font-family` rules make the browser start downloading Barlow, JetBrains Mono, Hanken Grotesk and IBM Plex Mono for a moment.
    - **Change:** delete the unused fonts and those rules, convert the rest to WOFF2, and keep fonts in their own cache so a deploy doesn't download them again.
20. **The whole view is rebuilt on every tap.**
    - Logging a set takes about 100 ms at 4× CPU slowdown and rebuilds about 600 elements. Progress slows from 36 ms to 104 ms between 3 and 380 sessions.
    - It also drops keyboard focus (item 66).
    - **Change:** update only the changed row, or at least put focus back afterwards.
21. **`app.js` is 1.17 MB** (338 KB gzipped), including 162 KB of exercise instructions parsed at every start. About 7 s on 3G before first use.
    - **Change:** load the instructions on demand as JSON, and split the file (radical change K12).
22. **Milo shares its web origin with your other GitHub Pages sites** (for example Sideband).
    - They share Milo's ~5 MB storage and can read or clear its data.
    - GitHub Pages ignores `_headers`, so `frame-ancestors` never applies and Milo can be framed by another site.
    - **Change:** a custom domain, or Cloudflare Pages / Netlify so `_headers` works. Meanwhile, refuse to run inside a frame.
23. **The HTML sanitizer can be bypassed by a known trick** that changes markup between its two parses; the CSP blocks it.
    - A known payload keeps its `onerror` through `MiloSecurity.html`, because the cleaned HTML is turned back into text and parsed again. The hash-only CSP plus `script-src-attr 'none'` stop it running.
    - Custom Ladder names are inserted unescaped (`${L.n}`, for example `6920`, `7518`), so a name can break the layout.
    - **Change:** return a `DocumentFragment` and insert it with `replaceChildren`, add a Trusted Types policy, and escape custom names.
24. **The same code exists four times.**
    - 93 function names are defined more than once (252 copies): save, load, render, take back, edit a session, toggle a set, rest timer…
    - The four copies already disagree: machine steps 2.5 vs 5 kg (`3317` vs `8610`), commas, labels, focus.
    - **Change:** one shared core (radical change K2).
25. **Test gaps.**
    - **No unit tests for:**
      - Strength's program engine, plate maths, `roundLoad` and `progressEntry`.
      - Muscle's block engine, coach rules, `adjustNext`, `predictReps`, `weeklyVolume` and reps-in-reserve calibration.
      - Together's planner, fatigue model and readiness.
      - The shared undo, open-sets and multi-session helpers.
      - Date and kg/lb helpers.
    - **Fragile:** the tests cut `app.js` apart at comment markers.
    - **Change:** see radical change K12.

## B. Shared training maths (all three trainers)

26. **The reps-in-reserve correction is measured badly and applied too widely.**
    - It is measured on high-rep isolation sets, after the set was already ticked (`app.js:4035`), so a short rest can add rest-pause reps and inflate it.
    - It is the all-time average, with no weighting for recent checks and no pull toward zero. It is used from 3 checks on, even when its own reliability flag says no (`2816`).
    - It is added even to sets called at RIR 0 (`1395`), and shared at full size with Strength's heavy triples.
    - Halperin 2022 found errors much larger above 12 reps. An unpublished 2022 thesis (Zourdos lab) found trained lifters *over*-predicted reps left on heavy squat and bench sets, the opposite sign.
    - **Change:**
      - Ask for the check *during* the set: call your RIR at your usual stopping point, then keep going.
      - Keep one correction for compounds and one for isolation.
      - Pull it toward 0 (for example n/(n+3)), weight recent checks more, and cap it at ±1 rep on sets of 5 or fewer.
      - Never adjust an RIR-0 set.
      - Let Strength calibrate from its plus sets.
27. **One reps-to-%1RM curve is used for every exercise.**
    - `Lift.pct` matches the RTS chart within about 1% up to 10 reps on barbell lifts; keep it for those.
    - Nuzzo et al. 2024 (269 studies) found the exercise is the main factor: at 70% of 1RM, the leg press averages 19 reps and the bench 14. So Epley overstates leg-press maxes by about 14%.
    - **Change:** curves by exercise class from Nuzzo, then fitted to each person's own rep maxes. Only count sets with reps + RIR ≤ 10–12 and RPE ≥ 6.5 toward the estimated max (100 kg × 12 at RPE 4 currently gives 160 kg).
28. **Rep predictions use a different formula from the estimated max.**
    - `predictReps` uses plain Epley with no correction. `repHint` aims for last time's reps even when the plan moved from RIR 3 to RIR 2. `Lift.tiring` uses the raw RIR.
    - **Change:** run everything through `Lift.pct` with the planned RIR.
29. **Hard sets go from full to half to nothing in steps** (`Lift.hard`: 1 / 0.5 / 0). Use a smooth curve (Robinson et al. 2024), and keep "unknown effort counts in full" only for sets with no rating.
30. **Fatigue carry-over counts only main muscles** (`app.js:12440`), so bench adds no triceps fatigue, while weekly volume counts them at half. Count helper muscles at 0.5.

## C. Muscle

31. **Ticking a set with an empty reps box saves no reps** on an exercise you have never done (`toggleDone`, `app.js:4012–4017`). Strength refuses this. Fill the bottom of the rep range, or ask.
32. **Muscle regions and longer muscle lengths aren't chosen the way the docs say.**
    - In 4–6 day blocks no leg extension is ever chosen: the quad slots are compound-only (`pickFrom`, `3191`).
    - The "around Strength and Ladder" picker (`3260`) ignores `GROWTH`, so it prefers pushdowns over overhead extensions and lying over seated leg curls. The better exercise still appears on a second day.
    - **Change:**
      - Use a priority list per muscle.
      - Let a missing region pull in an isolation exercise.
      - Apply `GROWTH` everywhere.
      - Give standing calf raises the top weight (2) the code's own comment implies.
33. **The advanced block takes squats and deadlifts to RIR 0** (`app.js:3225`), against the app's effort card.
    - **Change:**
      - Isolation exercises: RIR 2 → 0.
      - Machine compounds: down to RIR 1.
      - Barbell squat, deadlift and bench: stop at RIR 1–2.
34. **The deload policy contradicts itself, and the stall check fires almost always.**
    - All four ready-made templates have `deload:true` (`3087–3103`), while the card and FEATURES.md say "no deload week unless you add one". The label "5 wk + deload" is really 4 + 1.
    - The stall check (`2496–2499`) flags 0.5% or less gain over 3 sessions; one rep is about 2.5% of the estimated max. In simulation, two or more lifts were "stalled" 88–100% of the time.
    - The Coleman 2024 trial tested a full week *off*, not a lighter week.
    - **Change:** pick one policy and make the templates, card and docs agree. Detect a stall from a falling trend over 4–5 sessions beyond one rep of noise. Rate the deload card "Emerging".
35. **Weekly sets miscounted.** `coachVolume` labels the half-counted total "direct sets" (`2601`). Squats, leg press and lunges credit the hamstrings, though Kubo 2019 found no hamstring growth from squats; and there is no adductor group, though squats grew the adductors.
36. **Warm-up sets go only before the first loaded compound** (`warmUp`, `3976–3983`), so the bench after squats gets none. Add one or two ramp sets the first time each body region is loaded, plus a short general warm-up line.
37. **Load rounding.** Dumbbells round in 2 kg steps from 0, giving 22 and 24 kg when racks go up in 2.5 kg. A reps hint ticked without typing is logged as a real rep count; mark it as assumed.
38. **Bodyweight is logged in two places and used poorly.**
    - Strength has its own single, undated bodyweight (`9332`), separate from Muscle's dated log.
    - The "bodyweight is dropping" hint compares two raw readings (`2513–2520`, −1 kg trigger), though the chart uses a 7-day average.
    - **Change:** one bodyweight log for the whole app, and use the smoothed trend everywhere. Add an optional goal (gain, keep or lose at 0.25–0.5% a week). Show a protein range of 1.6–2.2 g/kg from your logged weight.

## D. Strength

39. **Top-set back-offs don't follow the top set, and are too easy.**
    - The program text says "if a top set feels harder than planned, the back-offs drop to match" (`8524`), but the code never adjusts them (`8846`, `8977`, `10154`).
    - Back-offs 8% under a 5 @ RPE 7–8 top set land at about RPE 4–5. Together then counts them as full hard sets, because they have no target RPE.
    - **Change:** once the top set is ticked with an RPE, work out today's estimated max and set the back-offs from it, for example 4–5 reps at RPE 7.5–8, or a percentage drop from the actual top set.
40. **Rounding can freeze or double progression** when the smallest plate is removed in Settings (`roundLoad`, `8703–8709`).
    - Smallest plate 5 kg: the bench never moves from 60, and the squat jumps 10 kg a session.
    - Smallest plate 2.5 kg: the bench jumps 5 kg a session.
    - **Change:** carry the unrounded weight, round only for display, round up once the added steps reach a loadable weight, and progress reps first when the jump is too big.
41. **Wave cycles' training max climbs no matter what.**
    - It goes up whenever week 3's single at 95% is done (`9102`), which is about RPE 5–6, and never comes down. It keeps rising until it is about 5% over your true max.
    - **Change:** judge every plus set. Raise the training max only when the plus-set estimate supports it, and reset to 90% of that estimate when a 5s or 3s plus set misses its minimum.
42. **The return-after-a-break discount skips most programs.**
    - It applies only to the estimated max (`8780`). Simple progression, which the "back after a long break" set-up option leads to, gets none, nor do wave training maxes or starting-test values.
    - Bosquet 2013 gives no 2- and 4-week thresholds; two weeks off cost trained men little.
    - **Change:** make it a lighter first session in every program (about 0% under 3 weeks, 5% at 3–6, 10% at 6–12, retest after 12), and leave the estimated max alone.
43. **Lift frequency.** With four or more areas, the A/B split (`8816`) gives the overhead press, deadlift and pull-ups one session a week, and 2-day plans give every lift one. Alternate ABA and BAB across weeks; Pelland 2026 and Currier 2023 favour more frequent practice for strength.
44. **Editing a finished session doesn't reset progression.** It recomputes only the records (`10228`). A typo of 600 for 60 sets the working weight to 600 until fixed. Recompute the working weight, misses and training max from history.
45. **Bodyweight-heavy lifts are treated as external load only** (dumbbell split squat, goblet squat, back extension), so their estimated maxes don't carry over between rep ranges. Count a share of bodyweight, as Muscle does.
46. **Kit model gaps.**
    - In pounds the bar is fixed at 45 lb; there is no 35 lb women's bar or 15 lb technique bar. Barbell steps are fixed (5/10 lb, 2.5/5 kg) even with microplates, which is an 8% jump on a 30 kg press.
    - The plate maths assumes unlimited plates and no collars.
    - A 0 kg dumbbell set is accepted.
    - Deadlift warm-ups start with an empty bar from the floor.
    - Missing lifts: trap-bar deadlift, Smith machine lifts (though the Smith machine is in the kit list), hip thrust, hack squat, belt squat.
    - Strength's "Dumbbell Split Squat" shows the Bulgarian split squat instructions (`8484`) and shares its sets into Muscle as Bulgarian split squats.
47. **Swaps are sorted by strength rank** (`9449`), so back squat offers leg press before front squat or pause squat. List the same movement first.
48. **The RPE box shows a grey "7" that isn't saved** (`9395`). The numbers fall back to the target, so they're right, but the finished session shows RPE blank. Save the target when a set is ticked untouched, as Muscle does, and style untouched suggestions differently.

## E. Ladder

49. **Progress goes backwards after 42 days.** `goalProgress` (`6614`) and the rung display (`7499`) count a rung as cleared only if it was proven in the last 42 days. Four rungs passed 60–70 days ago show 0% and locked. Base progress on advances earned, and keep the 42-day window only for readiness.
50. **Load and assistance aren't recorded** (`setupFields` returns `[]`, `7095`).
    - "Five controlled weighted pull-ups" counts with no load. All band strengths count as the same set (`setupKey`), and the weighted rung has no progression past its standard.
    - The cues contradict this ("Record added load", `5799`).
    - **Change:** one optional number per step (added kg, or assistance level 0–5), filled in from last time and required as proof.
51. **The maintenance check targets the wrong value.** It prescribes the exercise's base target, not the goal's standard (`6560`): 30 s side plank when the goal needs 45 s. Use the standard.
52. **Entry checks** are 1 rep for built-in exercises (`6049`), while the docs say 3. One pull-up places you on 3 × 8. Use about 40% of the target, capped at 3, and 1 rep only for "first rep" steps.
53. **Risky movements have no gate in front of them.**
    - Freestanding handstand push-ups: needs a 30 s freestanding hold first.
    - Partial wall handstand push-ups: needs a 30–45 s wall handstand hold first.
    - The freestanding handstand unlock: needs the cartwheel bail first.
    - Clapping pull-ups: needs explosive pull-ups first.
    - Depth jumps: needs landing drills first.
    - Dragon squats.
    - The instructions already say what should come first; enforce it.
54. **Balance practice is too short, and there's no timer.**
    - A freestanding handstand gets 3 × 15 s, about 45 s of balancing; coaching practice is 8–15 minute blocks.
    - Holds are typed in after the fact, and one value covers both sides on "per side" moves.
    - **Change:** time-boxed balance blocks, a tap-to-start hold timer with sound, and left/right logging.
55. **Long static stretches in the warm-up** (2 × 45 s calf and lat stretches, `5723–5736`) come before jumps and pistols. Use dynamic prep there, and move the holds to the end.
56. **Progression gaps.**
    - One-arm pull-up: no lock-offs or one-arm lowering, and no strength base (15–20 pull-ups, or about +40% bodyweight weighted).
    - Muscle-up: no "first muscle-up, small kip allowed" goal.
    - Flag: no support (press) flag step.
    - Nordic: no "lower to the floor in 3–5 s" goal.
57. **Instruction fixes.**
    - Wall handstand push-up (`501`): the head should land slightly forward of the hands, toward the wall.
    - "Fall back toward your feet": say the way you kicked up.
    - Weighted pull-ups say "about ten" reps before adding load, but the gate is 3 × 5 or 3 × 8. Dips say "fifteen", but the gate is 3 × 10.
58. **Smaller items.**
    - Re-placing yourself pre-selects the wrong exercise (`curIdx(id)-1`, `6865`).
    - "Skip the test, start training" opens Goals, not a session (`6936`).
    - Placement answers are lost on reload.
    - Sessions at 23:50 and 00:10 count as two training days; require about 20 h between them.
    - Handstand attempts count as hard sets.
    - The reps-in-reserve you enter is never used.
    - Renaming a custom rung keeps the old history as proof.
    - Time labels such as "first pull-up in a few weeks" and "30 s handstand in a few months" are optimistic for many adults.

## F. Together

59. **The lighter week and "low readiness" days are largely chance.**
    - The rule (`10872`) flags 5–13% of days as low for someone whose wellness never changes (answer noise alone), and 14–17% with ordinary day-to-day swings.
    - `lighterNow` (`10834`) is checked on every render, so week 5 turns lighter at some point in 41–65% of blocks, but the whole week is lighter in only 6–14%. It can switch on and off mid-week.
    - People who skip check-ins never get a lighter week.
    - **Change:**
      - Decide once, at the start of week 5, from performance (falling estimated maxes, or reps short at the planned RIR) plus a 7-day average.
      - Keep the daily trim for a z-score of −1.5 or lower, or for two low items.
60. **Week 5 is a copy of week 4.** `BLOCK=5`, and week 5 reuses week 4 (3 reps at RPE 9, RIR 1) unless the lighter week fires. FEATURES.md line 74 and the comment at `10501` say there is always a lighter week. Choose one policy, and make week 5 different from week 4.
61. **Your order in "What comes first" also sets the order within a day.** With Muscle first, leg curls and crunches come before heavy squats and deadlifts. Nunes 2021 found order affects strength but not growth, so this costs strength and adds some risk (a pre-fatigued trunk) for nothing. Let rank set the dose only, and use a fixed order: warm-up, skills, heavy lifts, Ladder strength, isolation, core.
62. **Heavy squats and heavy deadlifts land on the same day** whenever Strength has two days (`10597`). Put the hinge on the lighter squat day, and balance heavy lifts across days.
63. **Yesterday's Muscle sets are ignored** when trimming today's Together Muscle part (`tiredFrom(…,['str','cal'])`, `11020`, `11071`), while the note says Muscle does fewer sets. Include `'lift'`.
64. **The end-of-block volume rule.**
    - It adds +2 sets when a muscle "stalled", even with no check-ins (missing counts as recovered).
    - It never decays, applies its change to the maintenance target too, and uses only Muscle's history.
    - With realistic noise, muscles gaining 2% per block are called stalled 23–38% of the time.
    - **Change:**
      - Require recovery data.
      - Include Strength's lifts.
      - Use ±2% thresholds over enough sessions.
      - Let the change decay, and cap weekly sets at 20–25.
65. **Smaller items.**
    - Undo restores a snapshot that wipes check-ins saved after the action (`11174`).
    - A day still running at midnight closes after its current part ends, so the rest never starts (`11140`); use a 4 a.m. cutoff.
    - The soreness model weights yesterday most, while soreness peaks at 24–72 h. "About ten check-ins" is really about 10 readings with 5-set sessions and about 20 with 3, and a tolerant muscle stays trimmed.
    - The wellness questions aren't the Hooper scales: Hooper is sleep, stress, fatigue and soreness, with 1 = best. Say "adapted from".
    - Changing session length or kit restarts the block at week 1.
    - The days are assumed to be Mon/Wed/Fri, so a Saturday + Sunday trainer is told their days are well spaced.
    - A week that takes 10 calendar days silently cuts weekly sets by about 30%.
    - The "short on time" preview shows 2 sets per exercise, while Muscle keeps 3 as supersets.
    - Muscle-only plans can add 6 sets of front raises after pressing.

## G. Convenience

66. **The next set hides behind the timer and bars.**
    - During rest, 42% of an 844 px phone screen is taken up: header, trainer rail, rest timer, day strip and tab bar.
    - After the last set of an exercise, the next one sat at y = 816, underneath them, and nothing scrolled.
    - **Change:**
      - Scroll the next set into the top third after each tick.
      - Merge the rest timer into the strip.
      - Hide the header and rail during a session.
      - Make the duplicated "Together · Day 1" title one line.
67. **Taps per set.** Ladder is 1 tap per set (the target is pre-filled), which is the model to copy.
    - Strength on a new lift: type the weight for every set (`10154`: "a weight you type changes that set only"). 8 sets took 23 taps and 8 typed entries.
    - Muscle's first time: 3 taps plus 2 typed entries.
    - **Change:** copy typed weights forward to later sets of the same kind, as Muscle does (`5115–5137`).
68. **Together's first run buries Start.**
    - "Build my week" opens "Make this block yours": about 575 words and about 30 controls. Start is at y ≈ 3,557 on a page 4.5 screens tall.
    - "Use it as it is" silently throws away your edits, and the page lives only in memory (`tune`, `11683`).
    - The Together home is about 4,300 px tall, with the check-in before Start.
    - **Change:**
      - Build goes straight to "Start Day 1" above the fold, with Customize as a link.
      - With no edits show one button; with edits show "Start with my changes" and "Discard changes".
      - Put the check-in under Start as one line that opens out.
69. **One check-in per day.** Skipping Together's check-in makes Muscle ask its own readiness question mid-workout (`3635`). Treat "skipped" as an answer.
70. **Moving to the next part breaks after a reload.**
    - After a reload, finishing a Strength part lands on Strength's own set-up ("What do you want stronger?"), which Together users also see on Strength's Today. The strip still offers "Start Muscle".
    - **Change:** save the "started from Together" flag with the session, make "Next: Muscle →" the main button on the finish screen, and hide each trainer's own set-up while Together runs the plan.
71. **Navigation differs per trainer.**
    - Strength: Today / Train / Plan / Progress / Tools. Muscle: …/Library/Progress. Ladder: …/Goals/Progress/Library.
    - Make it the same tabs everywhere (Today · Train · Progress · Library), with Plan and Goals inside Today.
72. **Swapping an exercise.** The swap sheet claims to rank by overlap but reads alphabetically (Lying Leg Curl is 6th for Seated Leg Curl), has no search, and says "diff. equipment". Put the same movement first, add search, and write "needs a barbell".
73. **Rest timer with the phone locked.** It needs the app on screen, and keeping the screen awake drains the battery. Add a notification on Android, Media Session lock-screen text on iOS, and a "keep screen on" setting.
74. **Units are never asked.** Everyone starts in kg; Together has no unit setting, and the onboarding code in each trainer that asked is never called (`4805`, `7941`, `9943`). Instructions hard-code kg and cm. Ask on the first screen, defaulting from the locale, and start weeks on the locale's first day.
75. **Moving to a new phone.** First run has no "Restore a backup" choice, and there is no install prompt (`beforeinstallprompt` is never used). On an empty first launch, offer "New here" or "I have a backup", and show an install card after the first finished session.
76. **Habit support.** There are no reminders, calendar export or app badge, and no outcome goals in Muscle and Strength. Let people choose real weekdays, export the block as `.ics`, badge training days, and add goals like "bench 80 kg by March" with a weekly summary (Eckerstorfer 2018: goal-setting and self-monitoring drive the effect of fitness apps).
77. **Data out.** Add a CSV export (one row per set), import from Strong/Hevy CSV, and a printable 4-week summary to share with a coach or physio. Backups currently omit kit (item 17), the dialog doesn't mention Together, and restore uses a browser `confirm()`.
78. **Copy is far too long to read mid-workout.** Visible words: Together home 594, the customize page about 575. FEATURES.md is 5,420 words, with one 1,327-word paragraph and a 309-word sentence. The rule: one line on screen, and the reasons and studies behind "Why?". For example:
    - "Part of your Together program. Together plans your heavy lifting…" (44 words) → "Your lifts and records. Your plan lives in Together."
    - "Saved on this phone. It shapes today's plan, and over a few weeks it teaches the app…" → "30 seconds. Helps tune today's workout."
    - "Missed some days? Starting the week again usually beats skipping ahead…" → "Missed days? Restart the week. You lose very little."
    - "Best set each session, run through Epley with your RPE." → "Your estimated 1-rep max from your best set."
79. **Polish.**
    - Old names remain: "Hypertrophy Log" (`4800`), "Erase Strength Log?" (`10117`), and the manifest shortcut descriptions.
    - The finish screen shows "Records 0" on a first session.
    - On desktop, set inputs stretch to 335 px and the strip covers the action row.
    - Toasts cover set rows.
    - Strength's set-up: "Everything, all six" hides under the sticky Next button, step 1 has no close, and kit starts empty, which builds a bodyweight plan; Together starts with all kit.

## H. Accessibility

80. **Focus jumps to the page body after every action**, so keyboard and screen-reader users lose their place on each tick. Put focus back on the same control or on the next set's first field.
81. **200% zoom on a phone** (195 px): the page scrolls sideways, the tab labels overlap, and the weight field shrinks to 6 px. 320 px passes. Wrap set rows under about 300 px, and fold the header icons into a menu.
82. **Labels.**
    - Strength's 9 fields per session are all "Weight", "Reps" or "RPE" (`9390–9395`).
    - Done buttons always say "Complete set", with no `aria-pressed` (`2372`, `9396`).
    - The rest timer doesn't announce when it ends.
    - Copy Ladder's pattern ("Set 1 reps", "Log set" / "Mark set incomplete", `7712`), and add a `role=status` "Rest over".
83. **Tap targets.**
    - "Set options" is 24 × 44 px and 6 px from ✓.
    - Muscle's inline Target/RIR/Rest boxes are 25 × 22 px.
    - The ⋯ menus are 36 × 36, and several chips are 36–40 px tall.
    - Use a 44 px minimum with spacing.
    - "Remove last" sits in a side-scrolling row with a hidden scrollbar, cut to "Re"; move it into the set menu.
84. **Smaller items.** The struck-through finished part in the strip is 2.5:1 contrast; everything else passes 4.5:1. One smooth scroll ignores reduced motion (`4038`). FEATURES.md still describes the removed exercise drawings.

## I. Safety and who the app is for

85. **No health screen or stop signs.** There is no PAR-Q+-style question set at start, no "unwell today?" in the check-in, and no always-visible stop rules (chest pain, fainting, unusual breathlessness). The safety line sits inside Settings.
    - **Change:**
      - A short screen at set-up, kept on the device: a "yes" suggests seeing a professional and starts a gentler block, without blocking use.
      - Add illness to the check-in.
      - Add a red-flag card at session start.
      - Add a breathing note on heavy lifts for people with high blood pressure.
86. **No cardio at all.** Together's "one weekly program" has no aerobic work, and the fatigue model can't see running, cycling or sport.
    - **Change:**
      - An optional Conditioning section: 150–300 min moderate or 75–150 min vigorous a week, per the WHO 2020 guidelines.
      - Log any activity as minutes × session RPE, and feed it into leg fatigue.
      - Keep hard intervals away from heavy or explosive lifting (Schumann 2022).
87. **One plan for every life stage.** There is no age input: a 15-year-old, a 70-year-old and a pregnant user get the same RPE-9 sets and failure sets. The maintenance dose is especially wrong for older adults (item 96).
    - **Change:** an optional life-stage setting:
      - Under 18: technique first, no failure, a supervising coach.
      - 65 and over: power work and balance twice a week, longer recovery, a higher maintenance dose.
      - Pregnant or postpartum: link the guidance, no long lying flat, RPE caps.
88. **Defaults that assume a heavier, male lifter.** Make the bar selectable in lb (45/35/15), base increments on the plates you own or on a percentage, and use sex-neutral strength milestones. Don't add cycle-phase programming, which the evidence doesn't support (Colenso-Semple 2023).
89. **Instruction safety cues** for Muscle and Strength.
    - Every barbell press: thumbs wrapped round the bar.
    - Bench: set the safety arms on every set when training alone, not only "once sets get hard" (`105`).
    - Front squat: add safety pins.
    - Heavy lifts: a breath-hold note for people with high blood pressure.
90. **Privacy.**
    - There is no privacy notice, though joint pain, mood and soreness are stored and exported as plain text.
    - "Copy backup" suggests pasting into Notes, which is usually cloud-synced.
    - There is no "erase everything" covering all keys (`.undo`, `.corrupt`, `milo.before`, Together).
    - **Change:** add those, and optional passphrase encryption for backups (WebCrypto AES-GCM).

## J. Evidence library and docs

91. **Links that search instead of linking to the paper.**
    - About 78 of about 112 citation links are PubMed searches (Strength's whole library, most of Ladder's, and Muscle's Coleman link), and some use keywords, not titles.
    - **Change:** link to DOIs or PubMed IDs, with a script that checks every link resolves to exactly one paper.
92. **Wrong or unverifiable citations.**
    - Ladder:
      - Kikuchi & Nakazato 2017 is in *J Exerc Sci Fit*.
      - Schoenfeld 2019 on frequency is in *J Sports Sci*, not *Sports Med*. The same error is in Together's sources.
      - Bernasconi 2004 is an iron-cross EMG study in *J Sports Med Phys Fitness*, with an invented title.
      - "Bakhach 2023, Orthop J Sports Med" couldn't be found.
      - "Hart 2018, Sports Health" doesn't match the real paper (*Curr Sports Med Rep*).
    - Strength:
      - It cites an "Attempts tool" that doesn't exist (`8595`).
      - Mattocks is 2017, and its participants were untrained.
      - The periodization card understates Moesgaard 2022's finding that undulating beat linear for 1RM.
93. **Overclaims to reword.**
    - The 40% overhead-extension gain (Maeo 2023) comes from one 12-week trial in 21 untrained adults. Say so.
    - Rate incline, Bayesian and preacher curls as equal, or complementary by region; the trials point both ways.
    - "Bodyweight builds muscle" is rated High on two small trials; make it Moderate.
    - Protein: say "1.6 g/kg (up to about 2.2)".
    - "Getting stronger drives growth" claims a cause the trial didn't show.
    - Add "adapted from Hooper" to the check-in.
94. **Missing studies that should change recommendations.**
    - Halperin 2022 (RIR accuracy; cited only in a code comment)
    - Nuzzo 2024 (reps at %1RM)
    - Barsuhn 2025 and Scarpelli 2022 (volume changes)
    - Refalo 2024 and Lasevicius 2022 (failure)
    - Kubo 2019 (squats and hamstrings)
    - Bourne 2017 (hamstring exercises)
    - Helms 2016 (the RPE chart)
    - Graham & Cleather 2021, Hickmott 2022 and Larsen 2021 (autoregulation)
    - Currier 2023 (strength prescription)
    - Hortobágyi 1993 and Hwang 2017 (detraining)
95. **Docs that don't match the code.**
    - FEATURES.md line 74 says there is always a lighter week; line 9 says "that week".
    - Line 13: the break discount isn't applied in every program.
    - "Short on time keeps the sets": Muscle caps each exercise at 3, and Together shows 2.
    - "Fields named like 'Set 2 weight'": only Muscle's are.
    - "Muscle doesn't ask again": it does, when the check-in is skipped.
    - Machine steps: the docs say 2.5 kg in both, but Strength uses 5.
    - "Three reps or five seconds" for entry checks: built-in exercises use 1 rep.
    - The exercise drawings and `tools/visuals` (FEATURES.md accessibility section, CONTRIBUTING.md) were removed.
    - "Among exercises you haven't logged": not done in Muscle's picker.
    - The backup dialog lists three trainers.
96. **Bickel 2011 is misreported.** The text at `11730` says older adults kept muscle on about a third of the work. In fact, even the third-dose arm didn't keep muscle fibre size in older adults; only strength was kept. Also change "a third of the work keeps the size and strength you have" (`11700`).

---

## K. Radical changes, with trade-offs

These are larger changes. Several fix whole groups of the items above at once.

1. **One app instead of four.**
   - **What:**
     - Together becomes the only home.
     - Muscle, Strength and Ladder become program types ("Strength only" is just a program) and filters in Progress and Library, not separate apps with their own Today, Plan, set-up, check-in, settings and navigation.
     - One session screen for every kind of set.
   - **Removes:** items 69, 70, 71, the duplicate set-ups and most of the 252 duplicated functions.
   - **Trade-off:** the biggest refactor here. Storage keys and deep links (`?m=lift` etc.) must keep working, as PRODUCT.md requires.
2. **One shared storage core, on IndexedDB.**
   - **What:**
     - `MiloCore.store(trainer)` loads its own data with no import limits, migrates by schema version, refuses to write over data it couldn't read, saves with a revision number and a cross-tab lock, flushes on hide, and stores undo as diffs.
     - In IndexedDB, one record per session, so saving a set writes kilobytes, not the whole history, and the ~5 MB limit goes away.
     - A small localStorage journal keeps the synchronous save on close.
   - **Fixes:** items 1, 4, 14 and 15 for good.
   - **Trade-off:** async code, migration testing, and IndexedDB is still subject to Safari's 7-day rule.
3. **A "Next set" focus mode as the default way to train.**
   - **What:**
     - One big card: exercise, "set 2 of 3", pre-filled weight and reps with ± steppers and a plate picture, and a thumb-sized Done at the bottom.
     - The rest ring replaces the card, then the next set appears. Swipe for the full list.
     - No header, rail, strip or tab bar.
   - **Result:** one tap per set when you hit the target, usable one-handed, with a lock-screen timer on Android.
4. **Performance drives the adjustments, not questionnaires.**
   - **What:**
     - A smoothed estimated max per lift with an uncertainty band, fed by every set and weighted by how recent it is, whether it has an RPE, and its reps.
     - A reps-to-%1RM curve per exercise class (Nuzzo) fitted to your rep maxes.
     - A per-person reps-in-reserve error model pulled toward published averages.
     - Stalls flagged only outside the noise.
     - This drives daily trims, lighter weeks and volume changes. Wellness and soreness become secondary inputs.
   - **Fixes:** items 2, 26–29, 34, 39, 41, 59 and 64 in one design, and removes most daily questions.
5. **Blocks built from weekly targets.**
   - **What:**
     - Each muscle and region gets a weekly target and a per-session cap.
     - A solver fills them from per-muscle exercise rankings, in a fixed order within the day.
     - It knows real calendar days: your chosen weekdays, 48 h between heavy squat and hinge sessions, and straight-arm and Nordic spacing.
     - Every choice shows its study, sample size and effect.
   - **Fixes:** items 8, 11, 32, 43, 61, 62 and 65.
6. **A safety layer.**
   - **What:**
     - Joint-to-movement mapping with automatic swaps, Strength included.
     - A PAR-Q+-style screen, illness and red flags, and a life-stage setting.
     - Ladder holds straight-arm or wrist work for a week when the elbow, wrist or shoulder is sore, and offers an assisted version.
7. **Conditioning as a fourth section,** so "best overall" includes the half of the guidelines that isn't lifting, and the fatigue model sees it.
8. **A real kit and load model.**
   - **What:**
     - Plate inventory with counts, microplates, collars, a bar per lift (including 35/15 lb), real dumbbell racks and machine add-on weights.
     - Signed effective loads for assisted and weighted bodyweight moves.
     - Increments go to the next loadable weight, with reps progressing first when the jump is too big.
   - **Fixes:** items 5, 6, 40, 45 and 46, and Ladder's missing load.
9. **A logging screen built for Ladder.**
   - **What:**
     - Hold timer with sound, left/right values, one difficulty number per step.
     - A "strict / assisted / lowering only" choice that decides whether a set counts as proof (fixes item 9).
     - Rep ranges with RIR instead of a fixed 3 × v, and timed balance blocks.
10. **Your data, portable and synced on your terms.**
    - **What:**
      - CSV export and Strong/Hevy import, and a coach summary.
      - `.ics` calendar export.
      - Optional end-to-end-encrypted sync to a place you own (a file in iCloud/Drive, WebDAV or remoteStorage).
      - Apple Health / Health Connect only through a native wrapper.
    - **Trade-off:** sync breaks "nothing leaves the phone", so make it opt-in.
11. **Its own web address.** A custom domain, or Cloudflare Pages so `_headers` works, gives Milo its own storage quota, nobody else's scripts on its origin, and real framing protection. Users move their data with one backup.
12. **Engineering without a build step.**
    - Split `app.js` into 5–7 classic deferred scripts (core, instructions, muscle, ladder, strength, together, shell), each with its own hash in the CSP; load trainers you don't use only when needed.
    - Add `// @ts-check` with JSDoc types for every saved schema, checked by `tsc --noEmit` in CI only.
    - Add property tests: the validator accepts anything the app writes; rounding twice changes nothing; kg → lb → kg round-trips; plates add up; the estimated max rises with weight and reps; undo restores exactly; the planner stays within time and set limits; dates hold in London, New York and Lord Howe.
    - Run the four browser suites in CI on Chromium **and WebKit**, with size budgets (JS ≤ 350 KB gzipped, fonts ≤ 150 KB).
13. **Two levels of text.**
    - On screen: a verb and a number. Behind ⓘ: the reasoning and the evidence.
    - Split FEATURES.md into a one-page quick start and a reference.
    - Build evidence cards from one source file with a rating rubric and checked links.
14. **Start training in two taps.**
    - Ask "What do you train?" and "Days per week", assume gym kit and 60 minutes, and open Day 1.
    - Ranking, time, experience and customizing move to a "Tune your program" card after the first session.
    - The check-in becomes optional, in one row.
    - **Trade-off:** a less tailored first week.

---

## L. Already right: keep these

- **Set counting:**
  - Counting the reps you had left inside the estimated max.
  - Epley with a straight line from 1 to 4 reps, within about 1% of the RTS chart up to 10 reps.
  - Half credit for helper muscles (Pelland's best-fitting method).
  - Warm-ups not counted.
- **Muscle:**
  - Double progression once every set hits the top of the range.
  - Rest defaults of 90/180 s.
  - Supersets for different muscles.
  - The last isolation set to failure in hard weeks.
  - In-session load adjustment.
  - Seated over lying leg curls, overhead triceps work and standing calf raises, wherever the pickers actually apply them.
  - Push-up at about 70% and pull-up/dip at about 95% of bodyweight.
  - The honest range-of-motion, tempo, frequency and advanced-techniques cards.
- **Strength:**
  - 5/3/1 percentages and training-max options.
  - 3 × 5 with a 10% reset after three misses.
  - Top sets going RPE 7 → 8 → 9.
  - 3–4 minute rests.
  - Warm-up ramps.
  - Weighted dips and pull-ups kept out of the estimated max.
  - The "milestones, not norms" caveat.
- **Ladder:**
  - Proof tied to the exact exercise and standard, a 90-day recency window, two clean days then a controlled check, and honest "coaching default" wording.
  - Most progressions are well ordered: planche, both levers, L-sit, pistol, the two Nordic routes.
  - Session order: warm-up, then skills, then strength, with stretches last.
  - Stable IDs and the legacy-ID migration.
- **Together:**
  - Doses of 8/10/12 sets to build, 6 moderate and 3 to keep (for younger adults).
  - Spreading volume before cutting frequency.
  - Strength keeping its plan on low days, with RPE setting the load.
  - Extra fatigue weight for failure and new movements.
  - Readiness against your own baseline.
  - Joint-pain thresholds and red-flag wording.
  - "Restart the week" advice.
- **Engineering:**
  - The script security: a hash-only CSP plus integrity checks, `script-src-attr 'none'`, and versioned script URLs checked in CI. This is what stopped the sanitizer bypass in item 23.
  - Every HTML insertion sanitized, and the prototype-pollution guard.
  - The restore flow: checks before writing, a recovery copy, rollback if storage runs out, and 30-day undo.
  - Saving on hide and close, with an honest message when a save fails.
  - Timers based on timestamps, so they survive sleep.
  - The wake lock with a 4-hour cap.
  - The service worker's scoping.
  - Actions pinned to SHAs, and no runtime dependencies.
- **UX:**
  - Ladder's one-tap sets.
  - Muscle copying weights forward.
  - The rest timer starting by itself and surviving a reload.
  - Sessions that survive a reload, with continue, edit and undo.
  - Number keypads at 16 px.
  - Real dialogs with Escape and focus return.
  - A skip link, arrow-key tabs and good heading structure.
  - Contrast in both themes.
  - Reduced motion honoured.
  - Fast: 149 ms to content, with no console errors.

## Appendix: what the checks changed

- **Refuted:** "Muscle's range-of-motion card links Kassiano 2023 to the wrong PubMed ID." The link is correct; the claim mixed up two Kassiano 2023 papers.
- **Scaled down:**
  - Strength's estimate settles 10–15% high for a realistic lifter (the 128 kg figure assumes a lifter who keeps making impossible loads).
  - The plate-rounding freeze happens only after removing the 1.25 kg plate.
  - The deload banner appears only on Progress → Insights.
  - Muscle's Home bars do count helper muscles at half; only the Volume breakdown and one coach line don't.
  - Static stretches are 45 s holds, under the card's 60 s per hold.
  - The lb bar is fixed by design, but excludes 35/15 lb bars.
  - The blank-reps tick is low to medium, not high.
- **Made worse:**
  - The data wipe: the rescue copy can fail silently while the app says it was kept.
  - The clock-change heatmap: whole months show empty.
  - Pain mapping: Muscle's RDLs and good mornings aren't trimmed for back pain either.
  - Bickel 2011 is misquoted, not just overstated.
