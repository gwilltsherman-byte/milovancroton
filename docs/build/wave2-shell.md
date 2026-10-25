# Wave 2a brief: one app (K1), start in two taps (K14), navigation and Today

Region: the shell (`/* ==== SHELL ==== */` to the end of app.js), the shell markup and CSS in index.html and
shell.css, trainer.css where the shared frame needs it, and Together's views (Today layout, set-up screens).
You may change each trainer's route rendering and its own bottom navigation only as far as needed to make
the app one app (hiding their internal navs, exposing a hub method to open a route). Do not change training logic.

**Running in parallel with wave 2b** (the session screen builder, in its own worktree). Not yours: each trainer's
session (Train route) views and set rows, the rest timer, and the Together day strip (`/* ==== STRIP ==== */`);
2b owns those. Your side of the contract: implement `window.__sessionMode(on)` in the shell, which hides the shell
header and the navigation while on (2b calls it, guarded, from its focus mode), and keep the Train destination
rendering whatever the trainer's Train route renders. Use `API.md` and read the wave-1 results first
(`git log --oneline b314025 -25`): Together's set-up now has weekdays, a health screen and a life stage;
Strength's settings have the kit UI; the backup sheet has a "Your data" area (CSV, import, summary, calendar,
privacy, erase, encryption).

## What the person should experience
**One app, not four.** Milo has one navigation everywhere, the same on phone (bottom bar) and desktop (side
rail): **Today · Train · Progress · Library**, plus Settings from the header.
- **Today** is Together's day: the next workout with a big Start above the fold, the check-in under it as one
  line that opens out ("How do you feel? Rough · OK · Great", expand for the full check-in), then the week and
  the program card. If a session is running, Today leads with "Back to your session".
- **Train** is the session that's running (or the sessions in progress, with Resume); with none, it offers
  "Start today's workout" and quick starts for a single section.
- **Progress** is one page with a filter: All · Muscle · Strength · Ladder. "All" shows one summary across
  everything: weekly hard sets per muscle against target, each main lift's estimated max trend with the date
  of its last record, Ladder goals' progress, sessions this week and a streak. The section filters show each
  section's existing progress screens.
- **Library** holds every exercise (with its how-to) and the evidence, with the same section filter and one
  search box.
- **Settings** is one sheet: units, sound, vibration, theme, kit (Strength's kit UI from wave 1), warm-ups,
  program set-up (what you train and its order, days, weekdays, time, experience, health screen, life stage),
  each section's own options in collapsible groups, and "Your data" (the backup sheet's controls: backup and
  restore with encryption, CSV export, import, coach summary, calendar, privacy, erase everything); the header's
  backup button opens that part.
- The trainer switcher (Together / Muscle / Strength / Ladder tabs) goes. Training one thing alone becomes a
  **program type** chosen in program set-up ("Together" (default), "Muscle only", "Strength only", "Ladder
  only"), which uses that section's own block/program/sessions; their Plan and Goals pages open from Today.
- Deep links keep working: `?m=mix` opens Today; `?m=lift|str|cal` open Progress filtered to that section
  (or its running session). Manifest shortcuts updated to match.
- Each trainer's saved data, routes and features stay; they are just reached through this navigation.

**Start in two taps (K14, 68, 74, 75).** First run asks only: what you train (Muscle / Strength / Ladder, pick
any), how many days a week, and units (kg/lb, defaulting from the locale) as a small toggle, with a quiet
"I have a backup" link that opens restore. Build goes straight to Today with "Start Day 1" above the fold,
assuming gym kit, 60 minutes and intermediate experience. A "Tune your program" card appears on Today after the
first finished session (order, time, kit, experience, weekdays, life stage, health screen); the health screen
is also offered once, as an optional 30-second check, before the first workout starts. Customizing a block is a
link, never a page forced open; with no edits there is one Start button; with edits, "Start with my changes"
and "Discard changes".

**Flow fixes.**
- 70: after a reload mid-part, finishing a part still leads to the next part ("Next: Muscle →" is the main
  button on the finish screen; the "started from Together" link is saved with the session).
- 69: one check-in a day across the app (Muscle side done in wave 1; make sure the shell/Together side agrees).
- 75 and 16: after the first finished session, an install card: the browser's install prompt where available
  (`beforeinstallprompt`), and a short Share → Add to Home Screen hint in iOS Safari; in Safari when not
  installed, the backup reminder comes after 7 days instead of 14 and the card explains why.
- 66 (frame part): while a session screen is in its focus mode (wave 2b), the shell header and navigation hide;
  expose `window.__sessionMode(on)` for wave 2b to call, and do the hiding here.
- 79: "Records 0" isn't shown on a first session; toasts never cover the set rows (place them above the
  bottom bar, or at the top during a session); desktop layout keeps set inputs a sensible width.
- 71: the same navigation everywhere (above).

Keep it fast and accessible: arrow keys on the nav, visible focus, real buttons, 44 px targets, reduced motion.
Update the browser suites for the new navigation (they click trainer tabs today: give them the new routes), and
add tests for the first-run flow and deep links. Everything must pass.
