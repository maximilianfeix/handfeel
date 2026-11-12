# expo-chat: fix report

Summary of the report from the agent that ran `handfeel fix` (Claude Opus 5.5, fresh context, given only SKILL.md and this folder, told not to ask questions).

- **Touch:** back button 24 pt, header search 32 pt, emoji toggle 34×38 and send 38 pt all raised to 44 pt or more; pressed states everywhere; haptics on selection, send, save and clear.
- **Structure:** the centered dialog became a native page sheet on iOS and a bottom sheet on Android; keyboard handling on both platforms.
- **Color:** hex values moved into light and dark roles; the app follows the system appearance with the old dark switch kept as an override.
- **Type:** 14 sizes → 8; 9 and 10 pt text removed.
- **Icons:** the ✳ group avatar became initials; a decorative icon that looked like a button was removed.
- **Spacing:** 19 off-grid values replaced.
- **Ignore comments:** 4. Two `keyboard-covers-input` the agent judged false positives (fields inside a component that already avoids the keyboard), one `modal-instead-of-sheet` (Modal used to build the Android bottom sheet), one `no-press-feedback` (the dimmed backdrop). Without them the score is 90; see docs/evals.md.
- **Added dependency:** `expo-haptics`.
- **Not verified:** not run anywhere.
