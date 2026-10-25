# Wave 2b brief: the session screen (K3) and logging, accessibility, rest timer

Region: the session views and their actions in Muscle, Strength and Ladder (the Train route: set rows, the
exercise cards, the rest timer, the finish flow's first screen), the Together day strip (`/* ==== STRIP ==== */`),
trainer.css and the trainers' template CSS in index.html. Use `API.md`. Do not change training logic.

**Running in parallel with wave 2a** (the one-app builder, in its own worktree), which owns the shell, the
navigation, Settings, Today and set-up screens. Don't touch those. Contract: call
`window.__sessionMode && window.__sessionMode(on)` when focus mode starts and ends (2a implements it to hide the
shell header and navigation); until 2a lands, focus mode must still work without it. Wave 1 is merged
(`git log --oneline b314025 -25`): Ladder already has a hold timer, left/right inputs, and load or help-level
inputs on its set rows; Muscle marks assumed reps; Strength saves untouched RPE as assumed and copies weights
forward. Keep all of that working in both views.

## What the person should experience
**"Next set" focus mode (K3), the default way to log a running session in all three sections.**
- One large card for the set you are on: exercise name, "Set 2 of 3", the target (for example 8–10 reps at
  2 in reserve, or 5 at RPE 8, or a 20 s hold), pre-filled weight and reps from the plan/last time with
  ± steppers (weight steps from `Kit.step`, reps by 1), the effort chips (RIR or RPE) with the target pre-set,
  a plate picture for barbell lifts (`Kit.plates`, per side), and a thumb-sized **Done** at the bottom.
- Done logs the set as shown (one tap when you hit the target), then the rest ring takes the card's place
  (time left, +30 s, Skip) with a preview of the next set; when rest ends (or Skip) the next card appears.
- Ladder: holds use the wave-1 hold timer inside the card (tap to start, tap to stop), left/right sides as two
  steps, and the strict/assisted/lowering choice and load/assistance number on the card.
- A "List" button (and a swipe) switches to the full list view (the existing exercise cards), which stays fully
  usable for editing any set, adding sets, swapping, notes; "Finish" is always one tap away.
- While in focus mode, call `window.__sessionMode(true)` so the shell hides its header and navigation; the
  Together day strip and rest timer merge into one slim top bar (day parts, elapsed time, rest).
- Respect the person's choice: remember list vs focus mode.

**List view fixes.**
- 66: after ticking the last set of an exercise, scroll the next one into the upper third; nothing important
  sits under fixed bars.
- 67/48: the wave-1 fixes stay (weights copied forward, untouched targets saved and styled as untouched).
- 83: every control at least 44×44 px with 8 px between neighbours; "Set options" no longer 6 px from ✓; the
  inline Target/RIR/Rest boxes large enough to tap; "Remove last" moves into the set menu; no hidden
  side-scrolling action rows.
- 81: at 200% zoom on a phone (about 195 CSS px wide) nothing scrolls sideways and every input stays usable:
  set rows wrap onto two lines below about 300 px.

**Accessibility (80, 82, 84).** After any action, focus returns to the same control or moves to the next set's
first field (never to the page body). Every field is named like "Set 2 weight" in every section; done buttons
have `aria-pressed` and say "Log set 2" / "Set 2 logged"; the rest timer announces "Rest over" through a
`role=status` region; the struck-through finished part in the strip meets 4.5:1 contrast; every smooth scroll
respects reduced motion.

**Rest timer (73).** When rest ends while the page is hidden: vibrate if allowed and, on Android/desktop where
notifications are allowed, show a notification through the service worker registration
(`registration.showNotification`, asked once, with a clear explanation; never asked on iOS where it can't work
reliably). Add a "Keep the screen on during a session" setting (default on, which is today's behaviour).
Be honest in the setting's text that phones may delay alerts when the screen is locked.

Update the browser suites for the new session screen (keep their coverage of the list view by switching to
it), and add tests for focus mode logging in each section, focus return, and the 195 px layout. Everything
must pass.
