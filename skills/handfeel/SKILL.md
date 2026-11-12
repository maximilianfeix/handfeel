---
name: handfeel
description: Audits and fixes the "AI look" in mobile apps built with Expo/React Native, Flutter, SwiftUI or Jetpack Compose, using sourced Apple, Android and framework rules. Use when the user asks to unslop, polish, de-AI, audit, review or score a mobile app, to "make it feel native", or says a generated app looks like a website in a phone frame. Typical tells it fixes: purple gradients, glass cards, emoji icons, tiny touch targets, taps with no feedback, no haptics, no dark mode, centered popups instead of sheets, hamburger menus, ignored safe areas, keyboards covering fields, broken back navigation, text that cannot scale. Not for web apps, desktop apps or backend code.
license: MIT
metadata:
  author: Maximilian Feix
  repository: https://github.com/maximilianfeix/handfeel
---

# handfeel

Generated mobile apps fail in the same ways. They look like a landing page (indigo-to-violet gradients, frosted cards, an emoji per icon, a new font size per label), and they feel wrong in the hand (28-point buttons, taps that show nothing, a centered popup where a sheet belongs, text under the notch, a back gesture that leaves the app).

handfeel fixes both: first how the app feels under the thumb, then how it looks. Features, content and flows stay the same.

## Modes

- **audit**: report only, no edits. Use it when the user asks to check, review, score or audit, and whenever the request is unclear.
- **fix**: small, reviewable edits, one screen or shared component at a time, in the pass order below. Use it only when the user asked to fix, polish or unslop, or approved the audit.

## Run it

1. **Find the app or apps.** Look at the root and one level down, and in monorepo folders (`apps/*`, `packages/*`, `mobile/`, workspaces in `package.json`, `pnpm-workspace.yaml`, `melos.yaml`). Ignore `node_modules`, `build`, `Pods`, `.dart_tool` and generated code.

   | Marker | Platform | Load |
   |---|---|---|
   | `package.json` with `expo` or `react-native` | Expo / React Native | [references/expo.md](references/expo.md) |
   | `pubspec.yaml` with `sdk: flutter` | Flutter | [references/flutter.md](references/flutter.md) |
   | `*.xcodeproj`, `Package.swift`, files with `import SwiftUI` | SwiftUI | [references/swiftui.md](references/swiftui.md) |
   | Gradle with Compose enabled, files with `import androidx.compose` | Jetpack Compose | [references/compose.md](references/compose.md) |

   Load only the references for the platforms you found, plus [references/signs.md](references/signs.md). In a monorepo with several apps, list them and ask which to work on unless the user named one; scan and report each app on its own. Skip web-only packages (Next.js, Vite) even if they share the repo.

2. **Read the versions.** Each reference starts with a Detect section (SDK, deployment target, `targetSdk`, library versions). Fill it in before you suggest any API; a fix must compile at the project's versions.

3. **Scan.** With Node 18+, run `npx handfeel scan <app-dir> --json` (offline, no AI calls) and keep the score and findings. Without Node, do the checks by reading the code and say so. The scanner only sees patterns in code. Rules marked "not scanned" (back navigation, input types, large text, loading, empty and error states, launch screen and others) need you to read every screen.

4. **Look at the screens.** List them (Expo Router `app/`, Flutter `lib/`, SwiftUI views, Compose `@Composable` screens). If you can run the app (Expo web, an emulator, the iOS simulator) and take screenshots, do it, in light and dark and at a large text size. If you cannot, say so; reading code does not show contrast over images, clipped text or how motion feels.

5. **Write the audit.** One line per finding, grouped by pass:
   `path/to/file.tsx:42  touch-target-too-small  Close icon is 18 pt with no hitSlop; wrap in a 48 pt Pressable.`
   Use the scanner id, or `manual` for findings you made by reading. Put the scanner score at the top if you have it. Mark findings that rest on "handfeel judgement" as judgement, not as platform rules.

6. **Stop and confirm.** Show the audit, name the three changes that will matter most, list any change that alters navigation (drawer to tabs, a screen into a sheet) or adds a dependency, and wait for the user. Skip this only if the user said "just fix it" or similar in this conversation.

7. **Fix in passes, in this order.** Finish a pass across the app before starting the next.
   1. **Touch.** Targets at least 44x44 pt (iOS) and 48x48 dp (Android). A pressed state on everything tappable (ripple on Android, highlight or opacity on iOS). Haptics on selection changes, success, error and long press, nowhere else.
   2. **Structure.** Top-level sections in a tab bar or navigation bar. Secondary tasks in sheets. Content inside safe areas and edge-to-edge insets. Fields above the keyboard, with the right keyboard type, autofill hint and return key. Screens pushed as routes so the iOS edge swipe and Android (predictive) back work.
   3. **Color.** One token file with light and dark roles; screens use roles, not hex. Follow the system appearance. Replace the default AI purple; remove gradient and glass fills from controls and content. Text contrast of 4.5:1 in both modes.
   4. **Type.** Every size maps to a platform role (iOS text styles, Material type scale). Text follows the user's size; fix layouts that break at the largest size instead of turning scaling off.
   5. **Icons.** SF Symbols on iOS, Material Symbols on Android, or one consistent set. No emoji as icons. Every icon-only control has an accessibility label.
   6. **Spacing.** One scale on the 4/8 grid. Replace off-grid values (10, 14, 15, 18, 22) with the nearest step.
   7. **Platform details.** Lists, pull to refresh, loading placeholders and image placeholders, empty and error states, reduced motion, start/end instead of left/right, launch screen and icon.

8. **Check.** Re-run the scanner and compare. Build or type-check if you can (`npx tsc --noEmit`, `flutter analyze`, `xcodebuild`, `./gradlew assembleDebug`). Go through the checklist at the end of each reference.

9. **Report.** Include:
   - score before and after (only if you ran the scanner both times);
   - per pass, what changed, with files;
   - findings you left open and why (needs a brand color, changes navigation, would add a dependency, deliberate design);
   - what you verified and how (scanner, type-check, build, simulator, device) and what you could not verify. Name the platforms you actually ran it on, or say you only read code.

## Non-negotiables

- Never remove features, screens, data or flows. handfeel changes how the app feels and looks, not what it does.
- Never turn off font scaling, never force light or dark mode, never shrink a target below the minimum to make a layout fit.
- One accent color, used with intent. No gradient or glass on buttons, cards, tab bars or text.
- No emoji as icons. Emoji in user content (messages, reactions, a habit the user named) are fine.
- Do not invent a brand color, font, logo or copy. Propose it and label it as a proposal.
- Every rule you apply should trace to a reference. Do not quote guidelines that are not in the references, and do not invent URLs. If you deviate from a rule, say why.
- Do not add a dependency without saying so; prefer what the platform or framework ships (expo-haptics, expo-symbols, react-native-safe-area-context, Flutter's HapticFeedback, SwiftUI's sensoryFeedback).
- Do not raise the deployment target, `minSdk`, `targetSdk` or SDK to use a newer API unless the user asks; use the older equivalent or an availability check.
- Do not claim a screen was built, run or tested on iOS or Android if it was not.

## Scanner

`npx handfeel scan .` prints a 0-100 score and every finding with `file:line`. Each rule has a fixed weight and cap (`npx handfeel rules`), so the score is deterministic. In projects with more than 20 files, findings that occur per line of code (colors, Pressables, gradients) are counted per 20 files. `npx handfeel explain <rule>` prints the reason and sources. If a finding is deliberate, leave the code, explain why in the report, and only then add `// handfeel-ignore-next-line <rule>`. Never silence findings to raise the score.
