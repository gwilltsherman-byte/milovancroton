# Wave 2 results

Implemented on `codex/wave2-complete`, 24 October 2026 (Pacific time), and merged into `main` in PR #49.

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

Continue with the Wave 3 briefs in `HANDOFF.md` after the UI repair below is merged.


## UI regression repair

The owner reported UI bugs after the merge. Walking the actual first-run flow exposed issues that the prepared
session fixtures had missed. The repair covers:

- Entering and leaving focus mode synchronizes the shell and Together strip immediately, including when a
  session is rendered before its trainer becomes visible.
- Day and section names have separators. Weight fields retain visible units. Warm-ups, top sets, back-off sets
  and plus sets retain their instructions; working-set counts exclude warm-ups.
- Effort chips follow typed values and steppers, including blank and half-step values. Strength's suggested
  effort follows changed reps, matching the existing value that Done saves without changing training calculations.
- Set numbers no longer overlap weight fields at phone widths. Heavy plate displays and the Library search
  wrap at 195 CSS pixels. Focus dialogs and toasts no longer reserve space for the hidden desktop sidebar.
- Changing program type on Today immediately displays that program.
- Browser console errors now fail the suite runner instead of being printed under a passing result.

`tests/ui-browser.html` adds 74 checks, including the real setup-to-workout path and every main destination and
section filter at 1440, 768, 390, 360 and 195 CSS pixels. The initial targeted run reproduced 18 failures; the
expanded screen sweep exposed Library overflow, stale program routing and desktop dialog alignment as well.

Validation: all 202 Node tests and all 482 browser assertions across eight suites pass, together with syntax
and asset integrity checks. Visual review used the in-app browser and a 390 × 844 iframe with local test data.
These checks emulate screen sizes; they do not substitute for physical-phone keyboard or locked-screen tests.
