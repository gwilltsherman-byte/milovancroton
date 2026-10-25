# Wave 3b brief: goals and the weekly summary (item 76)

CSV export and import, the coach summary, the calendar file, the app badge, privacy, erase everything and
encrypted backups were built early (branch wave1-data, already merged). This wave finishes item 76; wave 2 already put the
data controls in Settings. Region: the shell (Settings, Today composition,
Progress "All" page), and small additions to Muscle's and Strength's progress views. Use `API.md`.

## What the person should experience
- **Outcome goals:** in Progress, "Set a goal": for a lift (estimated max, or reps at a load, by a date) or a
  muscle (weekly sets kept up for N weeks), with a progress bar, a projected date from `Lift.trend` (or "not
  enough sessions yet"), and a line on Today when you're close or behind. Ladder's goals show alongside.
  Stored additively in the owning section's saved state.
- **Weekly summary:** on the first open of a new week, a dismissible Today card: sessions done vs planned, hard
  sets per muscle vs target, new records, goal progress, and conditioning minutes if conditioning is on.

Add Node tests for goal projection and the weekly summary numbers, and a browser test for setting a goal and
seeing the summary card. Everything must pass.
