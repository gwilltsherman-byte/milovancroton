# Wave 2 results

Implemented on `codex/wave2-complete`, 24 October 2026 (Pacific time). Pending review and merge into `main`.

## Delivered

- One Today / Train / Progress / Library navigation, shared Settings and program types. Deep links and legacy
  single-section history still open the appropriate section.
- Short first run, a visible Start button, optional health check with a reachable skip, daily check-in,
  leading Resume, installation guidance and tuning after the first finished session.
- All Progress combines shared lift histories and includes Muscle-only lifts, weekly targets per muscle,
  Ladder goals, session totals and a locale-based weekly streak.
- Default next-set cards in all three trainers, editable prefilled values, kit steppers, effort choices, plate
  loading, rest / skip / +30 seconds, saved List preference and full List editing. Supersets keep alternating;
  Ladder keeps measured hold times, separate sides, assistance and clean-form controls.
- Numbered field names and logged states, focus return, rest announcements, 44 px session controls, reduced
  motion and wrapping at 195 CSS pixels. The focus view hides the shell and folds day information into its bar.
- Explained, opt-in rest notifications on supported platforms and a screen-awake setting.

## Verification

`docs/build/tools/check-all.sh "$PWD" 18765` passed syntax, integrity, all **202 Node tests** and all seven
browser suites (**408 assertions**):

| Suite | Assertions |
| --- | ---: |
| Browser security and offline assets | 17 |
| Data export, import and restore | 47 |
| Ladder | 20 |
| Existing layout and saved-session regressions | 144 |
| Next-set sessions | 29 |
| Shell, legacy startup, installation and high zoom | 44 |
| Together planning and day continuation | 107 |

The local run used installed Chrome through a temporary launch adapter because Playwright's bundled browser
was not installed. No runtime dependency or build step was added to Milo. Test fixtures select List explicitly
where they exercise the existing list controls; the new suite checks focus logging separately.

Additional cases cover changed-weight suggestions, assumed reps and effort, RPE bounds, measured holds,
superset order, reload mid-part without tab-only return state, notification permission asked once, and service
worker notification dispatch only while hidden and permitted. Tests use isolated local origins and restore
their saved fixtures after each suite.

Visual inspection covered 390 px phones, 1440 px desktop, dark mode, and 195 px List / Settings layouts.
Preview workouts were labeled local test data. The design scanner reported existing template-font/style
warnings and type-scale advisories; refreshing design metadata remains separate from this wave.

## Device limits and next step

Physical iPhone/Android testing, mobile keyboard behavior and locked-screen notification delivery remain
unverified. Permission and worker-dispatch behavior were tested with simulated browser APIs. Phones may delay
alerts while locked, as Settings explains.

Review and merge Wave 2, then continue with the Wave 3 briefs in `HANDOFF.md`.
