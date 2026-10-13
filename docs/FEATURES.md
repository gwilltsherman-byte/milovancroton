# Feature guide

Any finished session can be opened again: from History, from the Sessions number on any section's Today (a list of every session with its date), or from a ticked day in Together's week. Days still to come in Together's week can be tapped too, to see what each section has lined up for them. It opens greyed out and read-only. Tap Continue to pick it back up as a live session, with the sets you didn’t tick off waiting; finishing it again saves it in its place, keeping its date. Tap Edit or delete to fix weights, reps and effort, remove or add sets, drop an exercise, rename it, or delete it. Records and totals follow the fix. Sets you didn’t tick off are kept with the session, listed apart under each exercise (including any you never started), and don’t count toward anything; if you did them after all, tap Continue and tick them off, or Edit, then Did it.

Finishing a session can be taken back. Pressed Finish too soon, or ended early and changed your mind? Open that session and tap Continue, and you are back in it with every set as you left it and the clock carrying on. For the latest session of the day, whatever finishing moved on goes back too: a rung moved up in Ladder, next time’s loads and the plan day in Strength, the day ticked off in your block and the recovery check in Muscle, and a Together day that closed with it opens again. That exact take-back works while nothing newer has happened in that section. Any older session continues from what was saved, and what its first finish moved on stays as it is. A session you picked back up can be stopped again either way: keep what you added, or put it back exactly as it was. Deleting a session, or saving changes to one, has an Undo too.

Every exercise in all three has written instructions: how to set up, how to do the rep, and the mistakes to watch for. Ladder’s give exact positions: where the hands go relative to the shoulders, how far the toes sit from the wall, the angle of the elbows, what has to touch what at the bottom of a rep.

Free, no account, and it keeps working with no signal once it has loaded. On a weak signal it opens from its saved copy after three seconds rather than waiting on the network, and fetches the update in the background for next time. While a session is running the screen stays on (for up to four hours), where the browser allows it. Everything lives in your browser and stays there.

## Why it is built this way

Each app was written on its own and they have different visual languages on purpose, because they are used in different moods. Rather than blend them into a grey average, the shell keeps all three intact and lets you switch with one tap at the top.

Muscle and Strength are split on purpose. Growing muscle and raising a one-rep max overlap, but they are trained and measured differently: growth is about hard sets per muscle close to failure, strength is about heavy, specific practice with long rests and effort kept a few reps short. Each tab only tracks what matters for its own goal.

Under the hood each one runs in its own shadow root, so their styles and their code cannot collide. They keep separate saved data as well, which is why upgrading from the old single app does not touch the training history you already had.

## What is in each

**Muscle.** Evidence library with about thirty citations. Mesocycle planner with RIR ramps, deloads and feedback-driven volume changes. Swap an exercise for one session or for the whole mesocycle, from the session, the Plan tab, or while building a new block. With Strength or Ladder running too, it can build a block around them: it works out the hard sets each muscle already gets from their plans, leaves the muscles they train directly alone (they are the ones likely to be sore) and tops the rest up with isolation work, including muscles they only work on the side, like arms, sized to your days without Strength. Volume shown three ways with the real counts. Plate maths. Rep records: the most reps you have done at each load. Session and exercise notes.

<table>
  <tr>
    <td align="center" valign="top" width="33%"><img src="screenshots/muscle-volume.webp" alt="Weekly hard sets per muscle" width="220"><br><sub>Hard sets per muscle, this week</sub></td>
    <td align="center" valign="top" width="33%"><img src="screenshots/muscle-plan.webp" alt="A Muscle block built around Strength and Ladder" width="220"><br><sub>A block built around the other two</sub></td>
    <td align="center" valign="top" width="33%"><img src="screenshots/muscle-progress.webp" alt="Muscle progress" width="220"><br><sub>Progress</sub></td>
  </tr>
</table>

**Strength.** Six areas, seven kinds of kit, about thirty exercises ranked for strength, and a swap for any of them. Three program styles (simple progression, four-week wave cycles, autoregulated top sets) built around whatever you picked, with rep-range progressions for dumbbells, machines and weighted bodyweight moves and harder-variation chains when there is no load at all. Estimated maxes from your RPE, rep-max tables, and calculators for your max, plates, warm-ups and test-day attempts. A strength-specific evidence library.

<table>
  <tr>
    <td align="center" valign="top" width="33%"><img src="screenshots/strength-plan.webp" alt="A wave-cycle strength plan" width="220"><br><sub>Wave cycles, built from your kit</sub></td>
    <td align="center" valign="top" width="33%"><img src="screenshots/strength-session.webp" alt="A strength session with warm-ups and plates worked out" width="220"><br><sub>Warm-ups and plates worked out</sub></td>
    <td align="center" valign="top" width="33%"><img src="screenshots/strength-records.webp" alt="Strength records: best estimated max and rep maxes" width="220"><br><sub>Records: estimated max and rep maxes</sub></td>
  </tr>
</table>

**Ladder.** Forty-two ready-made goals plus custom ones, each marked Beginner, Intermediate, Advanced or Elite. The goal picker starts with three suggestions (good first goals if you are new; otherwise goals a few rungs away, spread over different movements, with how far away each one is), then lets you browse by what you want, easiest first. Standout moves unlock as you get stronger: when your logged numbers meet a widely used coaching standard (for example 12 pull-ups, 12 dips and 5 chest-to-bar pull-ups for a muscle-up, or 8 pull-ups and a 30 second hollow hold for a tuck front lever), the app tells you after the session, lists it on Today as ready to try, and lets you try it on the spot or make it a goal. A first success is celebrated. Every goal also lists what else it takes, because strength alone rarely gets you there: a pistol needs ankle range, single-leg balance and the hip-flexor strength to hold the free leg up; a handstand needs wrists ready for the load, full overhead range, a hollow body and a safe bail. Each need is a measurable standard (knee-to-wall at 10 cm, a 30 second single-leg stand on a cushion) with a plain explanation of why and links to the research. Placement asks about them in one checklist. Until a need is in place your sessions include it, up to four a session taking turns: warm-up drills first, balance and technique while you’re fresh, long stretches last (static holds of a minute or more just before training can sap strength for a while). Hand balancing always gets the wrist warm-up. Prep work isn’t counted as hard sets. There are forty-seven ladders in seven tabs. Pull: vertical and horizontal pulling, and pull-up variations (wide, commando, L-sit, typewriter, clapping). Push: dips, push-ups, overhead pushing and explosive push-ups. Legs: squat, hinge, jumps, lunges and lateral work (Cossack, skater), knee strength (sissy squat, reverse Nordic), calves and pistol drills. Core: L-sit and hollow work, leg raises to toes-to-bar, dragon flag, side core to Copenhagen plank, ab wheel and bridges. Arms: triceps (to tiger bend), biceps (bodyweight curls, chin-ups) and grip (to a one-arm hang). Skill: handstand, front lever, back lever, planche, planche push-up, muscle-up, rings, human flag, arm balances, press to handstand, one-arm handstand, handstand drills (bail, heel pulls, kick-ups) and muscle-up drills. Prep: ankle, wrist and overhead mobility, shoulder extension, shoulder blade control, single-leg balance, landing, compression, and pike, straddle and hip flexor flexibility, grouped by where they go in a session. For anything still missing, build your own ladder: name it, add rungs easiest first with reps or a hold, and pick the standard ladder it is most like. It then trains, tests and takes goals like the rest, and its sets count toward the right muscles in Muscle and Together. You pick the hardest rung you can already do and then test it: make its target and you start on the rung above, fall short and you start on it. A retest every four weeks keeps it honest, and the app will not push you past a goal you have not reached yet. Each rung has a target, a key cue and full instructions. Sessions rotate so no two in a row are the same: goal work alternates heavy days (your rung) and volume days (the rung below, one more set), with several goals taking turns; balance and straight-arm skills stay on your rung every time. Support work is shared out across sessions, one ladder per movement, so goals that bring the same kind of work share a slot, and one extra exercise that suits your goals rotates in (a ladder you have not placed starts low and is placed where you train it). No exercise appears twice in a session, and ladders that share an exercise, such as Side plank in Human flag and Side core, share the credit: one logged set counts as a best and can clear the rung on both. Mid-session you can go easier just for today, or step back a rung for good.

<table>
  <tr>
    <td align="center" valign="top" width="33%"><img src="screenshots/ladder-picker.webp" alt="Choosing a Ladder goal" width="220"><br><sub>Choosing a goal</sub></td>
    <td align="center" valign="top" width="33%"><img src="screenshots/ladder-today.webp" alt="Today's Ladder session" width="220"><br><sub>Today's session</sub></td>
    <td align="center" valign="top" width="33%"><img src="screenshots/ladder-cleared.webp" alt="A Ladder rung cleared" width="220"><br><sub>A rung cleared</sub></td>
  </tr>
</table>

Every recommendation in all three links to the research behind it, with an honest note on how strong that evidence actually is.

<p align="center">
  <img src="screenshots/muscle-evidence.webp" alt="The evidence library, with how strong each finding is" width="240"><br>
  <sub>The evidence, and how strong it is</sub>
</p>

**Together.** Any two sections or all three, two to seven days a week, with an optional time limit. The week is laid out automatically: Strength spread out first; Muscle only on days without Strength, never alongside it; Ladder on every Muscle day and wherever else suits it, away from Strength when they share a movement, and on fewer days if that is what fits your time and you can tap any section on or off a day. Each day runs in a fixed order: balance and straight-arm skills, then heavy lifting, then Ladder rungs, then Muscle. Muscle drops an exercise you already did in another section that day and trims sets for muscles that already got hard sets, compounds first, and it can put them back. Ladder support work is left out when Strength or Muscle trains the same thing that day; goal work always stays. Fatigue carries over between days: hard sets from the last three days still count against a muscle (yesterday in full, then half, then a quarter). A muscle carrying about six or more gets one to three fewer Muscle sets and no Ladder support work, and Strength shows a heads-up but keeps its plan. A strip under the section switcher shows the day's parts and starts the next one from anywhere. Hard sets from every section count toward one weekly total per muscle, here and on Muscle's Today. 

<table>
  <tr>
    <td align="center" valign="top" width="50%"><img src="screenshots/together-today.webp" alt="Together: today's parts in order" width="220"><br><sub>Today's parts, in order</sub></td>
    <td align="center" valign="top" width="50%"><img src="screenshots/together-sets.webp" alt="Hard sets from every section counted per muscle" width="220"><br><sub>Every section's hard sets, counted once</sub></td>
  </tr>
</table>

**The daily check-in.** Together asks, before you start a day, how you slept and feel (sleep, energy, stress and mood, each 1 to 7, the Hooper wellness scales), which muscles are sore (0 to 10, for the muscles trained lately or in today's plan) and whether a joint hurts (0 to 10, in eight joints). It takes about thirty seconds, can be skipped, and is saved on your phone with the rest of Together. Three things come from it. *Readiness* is the four wellness answers averaged and set against your own last 28 days, because a score only means something next to your usual (until there are seven days to compare with, below the middle of the scale counts as low). A low day takes a set off each muscle in Muscle and the support work out of Ladder, and Strength keeps its plan with a note to stop a rep or two short; a very low day suggests resting, and the day just waits. *Soreness you report* and *a sore joint* hold back the muscles involved the same way tired muscles already are: a joint at 3 or more holds back the muscles that load it, and at 6 or more (or 4 or more on three check-ins running) it holds them back hard, with a note to swap or skip what loads it and to see someone qualified if the pain lingers. *Your recovery* is the learning part: each check-in keeps the sets that were still weighing on each muscle next to the soreness you reported, and from those pairs the app works out how many carried sets it takes before that muscle feels about 4 out of 10 sore. That number replaces the standard 6, muscle by muscle. It starts at 6, is pulled toward your readings slowly (a muscle needs three before it moves at all, recent readings count more, and the estimate is shrunk toward your overall rate), and stays between 3 and 12, so a few odd days can't swing it. In simulation, a muscle that really is sore at 4 carried sets was found within about ten check-ins, and one with no real sensitivity stayed near 6. The Your recovery card shows the readiness chart and each muscle's number with how much it rests on. Muscle takes what the check-in says about how you feel, so it doesn't ask again at the start of a session. Honest limits: the wellness scales are well supported (a systematic review found short subjective measures follow training load and fatigue more reliably than most objective ones), but mostly in endurance and team-sport athletes; soreness tells you about recovery, not growth; and the per-muscle number is this app's own estimate that no trial has tested. It adjusts the day, not the week: the layout of your week doesn't change. The sources are listed on the card. It also covers the awkward cases: a section that isn't set up yet, a plan with more days than your week, days that run over your time, back-to-back heavy days, a session thrown away or ended early, a section already busy, and a day left open overnight.

<table>
  <tr>
    <td align="center" valign="top" width="50%"><img src="screenshots/together-checkin.webp" alt="The daily check-in" width="220"><br><sub>The thirty-second check-in</sub></td>
    <td align="center" valign="top" width="50%"><img src="screenshots/together-recovery.webp" alt="Your recovery: readiness over time" width="220"><br><sub>Your recovery</sub></td>
  </tr>
</table>

## Accessibility

Pinch zoom works, but double-tap zoom is off so a quick second tap (on +30s, say) stays a tap. Text meets the 4.5:1 contrast standard in both themes (checked with axe-core on every tab, the main sheets and a live session). Sheets are real dialogs: a screen reader announces them by name, Escape closes them, the page behind can't be reached while one is open, and focus goes back to where you were. The four section tabs work with the arrow keys, Home and End. Icon buttons and set fields have names (for example "Set 2 weight"). On iPhone, fields are kept at 16px so the page doesn't jump when you tap one.

<p><sub>The light theme. It follows your phone&rsquo;s setting unless you pick one.</sub></p>
<table>
  <tr>
    <td align="center" valign="top" width="25%"><img src="screenshots/light-muscle.webp" alt="Muscle in the light theme" width="190"><br><sub>Muscle</sub></td>
    <td align="center" valign="top" width="25%"><img src="screenshots/light-strength.webp" alt="Strength in the light theme" width="190"><br><sub>Strength</sub></td>
    <td align="center" valign="top" width="25%"><img src="screenshots/light-ladder.webp" alt="Ladder in the light theme" width="190"><br><sub>Ladder</sub></td>
    <td align="center" valign="top" width="25%"><img src="screenshots/light-together.webp" alt="Together in the light theme" width="190"><br><sub>Together</sub></td>
  </tr>
</table>

## Running it

Double-click `index.html`. That is the app.

Want it on your phone? Drop the folder on any static host and add it to your home screen.

**GitHub Pages.** Push this repo, open Settings > Pages, point it at `main`. The demo is hosted at [gwilltsherman-byte.github.io/milovancroton](https://gwilltsherman-byte.github.io/milovancroton/). Paths are relative so a subfolder is fine.

**Netlify.** Drag the folder onto [app.netlify.com/drop](https://app.netlify.com/drop). You get a link straight away, no account.

## Adding it to your phone

Open the link in Safari on iPhone or Chrome on Android. Hit Share, then Add to Home Screen. It opens full screen and lives with your other apps. Load it once with signal and it runs offline from then on. On Android, press and hold the icon for shortcuts straight to Muscle, Strength, Ladder or Together; `index.html?m=str` (or `lift`, `cal`, `mix`) does the same from any link.

## Your data

Local storage, in whatever browser you use. No analytics, no login, nothing leaves the phone. The catch is there is no sync between devices, so back up now and then and restore after you switch phones. The arrow at the top makes one backup of all three sections, as a copy or a file; it shows a small dot once you have sessions and a fortnight has passed without a backup, and says when your last one was. A restore can be undone from the same sheet, one step back, for a month.

The app keeps your data safe in a few other ways. If the browser refuses a save, it tells you, once, instead of failing quietly. If a saved copy can't be read, that copy is kept aside (and goes into your next backup) before anything replaces it. A restore that doesn't fit puts everything back as it was. Anything waiting to be saved is written the moment the app is closed or sent to the background, and once you have sessions the browser is asked to keep the data rather than clear it when space runs short.

## Not medical advice

These are training logs. If a joint hurts or you feel off, stop and see someone qualified.

## Under the hood

One `index.html`, plain JavaScript, no framework, no build step. `sw.js` does the offline caching. `manifest.webmanifest` makes it installable. The three PNGs are the home-screen icon. `docs/screenshots` holds the pictures in this README; the app never loads them.

## License

MIT. See [LICENSE](../LICENSE).
