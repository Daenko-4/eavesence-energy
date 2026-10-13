# Website and app usability review — 12–13 October 2026

## Changes

| Finding | Result |
| --- | --- |
| Saved costs occupy too much space | Compact rows with one expanded detail, search from five costs, separate monthly-average total. Filtering does not change totals or stored costs. |
| Settings compete with the monthly view | Core preferences first; calculator, reminders, backup and help are collapsed. Save/back returns to the originating tab. |
| Accidental cancellation loses entries | Changed cost, income and settings drafts require keep-editing/discard choices. |
| Setup income cannot be corrected before the first cost | Back to income is available during the first-cost step; entered cost drafts are protected. |
| Zero income is confused with missing income | Explicitly saved zero displays a zero income and negative fixed-cost remainder, without repeating setup. Legacy web placeholders remain unknown on app import. |
| Pro errors do not identify the correction | Balance → payday → everyday spending → optional reserve validated individually, with field focus and localized messages. A blank reserve is zero. Negative bank balances remain valid. |
| Pro question switches preserve the old scroll position | All question navigation dismisses the keyboard and scrolls to the start of the selected question. |
| Header language glyph does not match navigation | Static × with one × → + → × replay on language navigation, shared 360 ms disclosure motion per half. Original logo retained. Reduced motion disables the replay. |
| Native disclosure motion is abrupt | Shared native disclosure duration increased from 180 to 360 ms; reduced motion still instantaneous. |

## Verification

- Local check: lint, 153 unit tests, website and app TypeScript, production Next build.
- Browser suite: 167 tests across 22 files. Includes both languages, desktop and narrow responsive views, website setup/calculator/costs/checklists/memos/Pro/backup and complete production app setup, navigation, search, guarded edits, persistence and backup export.
- CI additionally exports the standalone iOS beta and runs the free-beta configuration preflight.
- Visual review uses browser-generated screenshots of responsive website and native production components rendered through the test adapter.

The full app review substitutes native service boundaries (storage transport,
notifications, purchases, file pickers/sharing and document reader), while actual
app components, state, validation and storage transactions remain production code.
The initial test run exposed a missing Expo public environment variable in the
browser bundler. The adapter now supplies it; this was not an Expo app startup bug.

A browser adapter does not certify iPhone keyboard avoidance, VoiceOver, date-wheel
gestures, native animation frames, share sheets, notifications or purchases. The
physical-device acceptance checklist remains in `apps/mobile/BETA-TEST.md`.
