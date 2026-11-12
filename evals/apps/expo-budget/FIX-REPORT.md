# expo-budget: fix report

Summary of the report from the agent that ran `handfeel fix` (Claude Opus 5.5, fresh context, given only SKILL.md and this folder, told not to ask questions).

- **Touch:** segmented control, category chips and budget +/− buttons raised to 44 pt (the +/− were 30×30); pressed states and Android ripple; selection haptics.
- **Structure:** keyboard avoidance on Android as well as iOS.
- **Color:** one token file with light and dark roles; `userInterfaceStyle` "dark" → "automatic", so the app gets a light mode; both purple gradients (balance card, avatar) removed; glass fills removed; the tab bar keeps a system material blur because blur on bars is allowed.
- **Type:** 13 font sizes → 7 roles.
- **Icons:** labels for the +/− buttons, fields, switches and avatar.
- **Not verified:** not run on iOS or Android. Rendered on Expo Web for the screenshots in the README. Needs `expo-system-ui` for automatic appearance in Android development builds (the agent flagged this).
