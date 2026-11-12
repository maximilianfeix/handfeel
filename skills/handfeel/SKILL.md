---
name: handfeel
description: Removes the AI look from mobile apps built with Expo/React Native, Flutter, SwiftUI or Jetpack Compose. Audits screens for the usual tells (purple gradients, glass cards, emoji icons, tiny touch targets, taps with no feedback, no haptics, no dark mode, web-style modals and hamburger menus, ignored safe areas and text sizes) and fixes them screen by screen with sourced platform rules. Use when the user asks to unslop, polish, audit or "make it feel native", or when a generated app looks and feels like a website in a phone frame.
license: MIT
metadata:
  author: Maximilian Feix
  repository: https://github.com/maximilianfeix/handfeel
---

# handfeel

Generated mobile apps fail in the same ways. They look like a landing page: indigo-to-violet gradients, frosted cards, an emoji for every icon, a new font size per label. And they feel wrong in the hand: 28-point buttons, taps that show nothing, no haptics, a centered popup where a sheet belongs, text under the notch, white screens at night.

handfeel fixes both, in that order of importance: first how it feels under the thumb, then how it looks. The features, content and flows stay. What changes is that every target, transition, color and size follows the platform the app runs on.

## Modes

- **audit** (default when the user asks to check, review or score): report only. One line per finding with `file:line`, grouped by pass. Do not edit.
- **fix** (when the user asks to fix, polish, unslop or improve): small, reviewable changes, one screen at a time, in the pass order below.

If the user did not say which, audit first, show the result, and ask before editing. Skip the question only if they already said "just do it".

## Run it

1. **Detect the platform.** Look for these files at the project root or one level down:

   | File | Platform | Load |
   |---|---|---|
   | `package.json` with `expo` or `react-native` | Expo / React Native | [references/expo.md](references/expo.md) |
   | `pubspec.yaml` | Flutter | [references/flutter.md](references/flutter.md) |
   | `*.xcodeproj`, `Package.swift`, files with `import SwiftUI` | SwiftUI | [references/swiftui.md](references/swiftui.md) |
   | `build.gradle(.kts)` with Compose, files with `import androidx.compose` | Jetpack Compose | [references/compose.md](references/compose.md) |

   Load only the reference for the platform you found (two if it is a monorepo with two apps). Also read [references/signs.md](references/signs.md), the cross-platform list of tells.

2. **Scan.** If Node 18+ is available, run `npx handfeel scan . --json` (offline, no AI calls) and keep the score and findings. If it is not available, do the same checks by reading the code. The scanner catches what is measurable; you still read every screen for what it cannot see (hierarchy, copy, empty and loading states, motion).

3. **Look at the screens.** List the screens (Expo Router `app/`, Flutter `lib/screens`, SwiftUI views, Compose `@Composable` screens). If you can run the app (Expo Web, Android emulator, iOS simulator) and take screenshots, do it, so you judge what people see. Say plainly when you could not run it.

4. **Audit.** One line per finding: `file:line  scanner-id-or-"manual"  what is wrong`. Group by pass. Put the scanner score at the top if you have it.

5. **Stop and confirm** (unless told to just do it). Show the audit, name the three changes that will matter most, and wait.

6. **Fix in passes, in this order.** Finish a pass across the whole app before starting the next.
   1. **Touch.** Targets at least 44×44 pt (iOS) / 48×48 dp (Android). Every tappable thing shows a pressed state (ripple on Android, highlight or opacity on iOS). Haptics on the moments that matter: selection changes, success, error, long press. Nowhere else.
   2. **Structure.** Top-level destinations in a tab bar / navigation bar, not a drawer. Secondary tasks in sheets, not centered popups. Content inside safe areas and edge-to-edge insets. Text fields never under the keyboard.
   3. **Color.** One token file with light and dark roles; screens reference roles, not hex. Follow the system appearance. Replace the default AI purple and remove gradient and glass fills from chrome. Keep strong color for the one thing per screen the user should act on.
   4. **Type.** Map every size to a platform role (iOS text styles, Material type scale). Let text follow the user's text size; fix layouts that break at large sizes instead of turning scaling off.
   5. **Icons.** SF Symbols on iOS, Material Symbols on Android (or one consistent set). No emoji as icons. Every icon-only control gets an accessibility label.
   6. **Spacing.** One scale on the 4/8-point grid. Replace off-grid values (10, 14, 15, 18, 22) with the nearest step.
   7. **Platform details.** Follow each OS where they differ: ripple vs opacity, shadows vs elevation, switches, back behaviour, pull to refresh, loading placeholders that match the layout, reduced motion.

7. **Check.** Run the scanner again and compare. Go through the checklist at the end of the reference. Anything still on the audit list gets fixed or explained.

8. **Report.** Score before → after (only if you ran the scanner both times), a few lines per pass about what changed, and what you could not verify (for example "not run on an iOS device").

## Non-negotiables

- Never remove features, screens, data or flows. handfeel changes how things feel and look, not what the app does.
- Never turn off font scaling, never force light or dark mode, never shrink a target below the minimum to make a layout fit.
- One accent color, used with intent. No gradient or glass on buttons, cards, tab bars or text.
- No emoji as icons. Emoji in user content (messages, reactions, a habit the user named) are fine.
- Every rule you apply should trace to the reference. If you deviate, say why.
- Do not add a dependency without saying so; prefer what the platform or framework already ships (expo-haptics, expo-symbols, react-native-safe-area-context, Flutter's HapticFeedback, SwiftUI's sensoryFeedback).
- Be honest about verification. Do not claim a screen was tested on iOS or Android if it was not.

## Scanner

`npx handfeel scan .` prints a 0-100 score and every finding with `file:line`. Each rule has a fixed weight and cap (`npx handfeel rules`), so the score is deterministic and explainable. In projects with more than 20 files, findings that occur per line of code (colors, Pressables, gradients) are counted per 20 files, because the weights were set on small generated apps. `npx handfeel explain <rule>` prints the reason and sources. Ignore a line with `// handfeel-ignore-next-line <rule>` when a finding is intentional, and say so in the report.
