# Installed iPhone workout spacing repair

The screenshot reported on 25 October 2026 showed Muscle's section title underneath the iPhone status bar. Two defects survived the earlier repair: the hide rule selected `header` but Muscle uses `div.appbar`, and removing the global header removed the only layout space reserved for the top safe-area inset. The earlier tests checked the global shell and horizontal overflow, not this combination.

The workout shell now reserves its own safe area, with a solid fixed background behind the system status region when the page scrolls. The shared `.appbar` selector hides duplicate section headers in every active workout. Session content receives its intended padding through the actual `#view` element. Conditioning uses the same session frame; leaving it restores the regular shell without duplicate spacing.

The new regression in `tests/ui-browser.js` reproduced 17 failures before the fix. It exercises list and focus views for Muscle, Strength and Ladder at 430, 390 and 195 CSS pixels with a simulated 59px inset, sticky controls after scrolling, desktop with a zero inset, and Conditioning entry/exit. This adds 65 assertions. Manual Chromium screenshots cover phone list, phone focus and desktop focus after styles/fonts load.

Full validation: syntax, generated integrity, 209 Node tests and 584 browser assertions across 11 suites. Physical iPhone/Safari rendering was not available; the top inset is simulated through the production CSS token. This result supersedes the earlier claim that the complete trainer header was hidden in Muscle's list view.
