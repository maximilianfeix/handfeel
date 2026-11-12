# Real apps

The rules were first tuned on seven generated apps of 4-15 files ([slop-catalog.md](slop-catalog.md)). This page checks them against well-made open-source apps, to find false positives before anyone else does. Measured on 2026-11-12.

## Method

1. Nine apps across the four platforms, picked because they are well known and well designed. Shallow sparse clones of the app source only (`git clone --depth 1 --filter=blob:none --sparse`, then `git sparse-checkout set <source dirs>`), at the commits below.
2. `node dist/src/cli.js scan <dir> --json` with the scanner as it was before this calibration (commit `5f8d25f`), then every finding read rule by rule against the code: true positive, false positive, or debatable.
3. Each false positive became a rule change with a fixture pair in `scripts/make-fixtures.py` (`test/fixtures/<rule>/<case>/{bad,good}`). Every new `good/` fixture fails on the old scanner and passes on the new one; every `bad/` fixture still fails.
4. The same scan with the new scanner. The generated apps were re-scored too ([evals.md](evals.md)); their before scores moved by 0-3 points.

## Scores

| App | Platform | Repo | Commit | Scanned | Files (old / new) | Old rules | New rules, no size scaling | New rules |
|---|---|---|---|---|---:|---:|---:|---:|
| Bluesky | Expo / React Native | [bluesky-social/social-app](https://github.com/bluesky-social/social-app) | `44a037a` | `src/` | 1897 / 1796 | 11 | 34 | **76** |
| Expensify | React Native | [Expensify/App](https://github.com/Expensify/App) | `7431255` | `src/` | 8587 / 8541 | 43 | 59 | **79** |
| Immich | Flutter | [immich-app/immich](https://github.com/immich-app/immich) | `2ac9ddc` | `mobile/` | 621 / 621 | 22 | 39 | **80** |
| Compass | Flutter | [flutter/samples](https://github.com/flutter/samples) | `12a1916` | `compass_app/app/` | 89 / 89 | 72 | 75 | **87** |
| Wonderous | Flutter | [gskinnerTeam/flutter-wonderous-app](https://github.com/gskinnerTeam/flutter-wonderous-app) | `30ccc36` | `lib/` | 193 / 193 | 57 | 62 | **85** |
| Ice Cubes | SwiftUI | [Dimillian/IceCubesApp](https://github.com/Dimillian/IceCubesApp) | `98098b9` | `IceCubesApp/`, `Packages/` | 380 / 380 | 66 | 81 | **91** |
| Now in Android | Jetpack Compose | [android/nowinandroid](https://github.com/android/nowinandroid) | `2982e63` | `app/src/main`, `core/`, `feature/` | 178 / 178 | 90 | 94 | **94** |
| Jetchat | Jetpack Compose | [android/compose-samples](https://github.com/android/compose-samples) | `25631e8` | `Jetchat/app/src/main` | 38 / 38 | 74 | 78 | **80** |
| Reply | Jetpack Compose | [android/compose-samples](https://github.com/android/compose-samples) | `25631e8` | `Reply/app/src/main` | 26 / 26 | 86 | 92 | **92** |

Full commits: social-app `44a037a63575c800955eeb9e0a1024e7b2e4c063`, Expensify `7431255f89249d62291be3388df44f385827e7fb`, immich `2ac9ddc86aed892764b10dec241e15496528aaca`, flutter/samples `12a191622909214b516b0626fc1413be1000d12c`, wonderous `30ccc36a276223ebbb85dbb290d6ff2facf001ed`, IceCubesApp `98098b9c4b5928f89f338203193c2bf40ab7f38c`, nowinandroid `2982e63cb691ad49cd009aab43dc206fee6699c2`, compose-samples `25631e8f544a9a1e3f01e296eaf1b4c28428196c`.

"New rules, no size scaling" applies every precision fix but scores raw counts, as the old scanner did. The last column adds size scaling (below). flutter/samples' `veggieseasons` was on the list but now only holds a README, so it is not in the table.

The fewer files for Bluesky and Expensify are `.web.tsx` files and `__fixtures__` folders, which are no longer scanned.

## What changed and why

**Size scaling (score formula).** The weights and caps were set on apps of 4-15 files, where 20 hard-coded colors mean every screen. Bluesky has 1,800 files; with raw counts it reached the cap of every per-occurrence rule (hard-coded colors, Pressables, gradients) no matter how rare the pattern was, and scored 11. Rules whose findings are single occurrences in the code are now counted per 20 files in projects with more than 20 files: `n = count × 20 / files`. Rules judged once per project (no haptics, no dark mode, distinct spacing values, distinct font sizes, drawer navigation, the stock purple) are not scaled, and neither is `font-scaling-disabled`, because one override in a shared Text component turns scaling off everywhere (Expensify). Apps of 20 files or fewer, which includes every generated app in the evals, score exactly as before. The text report prints the scaled count next to the real one.

**Precision fixes**, each with a fixture pair:

| Rule | Change | Seen in |
|---|---|---|
| all (React Native) | `.web.*` files are not scanned: React Native resolves them only for web builds ([platform-specific extensions](https://reactnative.dev/docs/platform-specific-code#platform-specific-extensions)). `__fixtures__` and `__generated__` folders are skipped like `__tests__`. | Bluesky (about 100 files), Expensify |
| `hardcoded-color` | SwiftUI `Color.red`, `.teal`, `.indigo` ... are no longer flagged; Apple documents them as context-dependent system colors that adapt to dark mode. `Color.white` and `Color.black` still are. | Ice Cubes (15 of 16 findings) |
| `hardcoded-color` | Colors that are given a name are token definitions: `gray1: '#F3F3F8'` in a palette object, `const accent = ...`, `static const brand = Color(...)`, and one color per enum case (`AvatarColor.blue => Color(...)`). Literals under style keys (`backgroundColor`, `color`, `fill`), in `StyleSheet.create` and in JSX still count. | Bluesky `src/lib/styles.ts` (40), Immich avatar colors, Wonderous |
| `hardcoded-color` | A literal that is one side of a light/dark choice (`isDark ? '#10161F' : '#FFFFFF'`) adapts, which is what the rule asks for. | Bluesky home-screen widgets, splash |
| `hardcoded-color` | Fully transparent colors and translucent black are not counted: they are scrims and shadows, the same in both appearances (Material's `scrim` role is black in light and dark). | Bluesky video feed, Immich, Jetchat |
| `hardcoded-color` | Fills inside `react-native-svg` elements are vector artwork (brand logos, map pins). | Expensify (most of its 47) |
| `type-scale-sprawl` | Font sizes defined in theme/token files, or in modules that draw no UI, are the type scale, not sprawl. A complete Material 3 `Typography` spans 11 distinct sizes and was penalised as sprawl. | Now in Android, Jetchat, Bluesky |
| `gradient-overuse`, `purple-gradient` | A `LinearGradient` from `react-native-svg` is a definition inside vector artwork. A gradient from transparent to black is a scrim over media. | Expensify, Bluesky |
| `hamburger-navigation` | A drawer in an app that also has a navigation bar / tab bar is the adaptive pattern Material 3 recommends (bar on phones, rail or drawer on larger windows), not drawer-only navigation. | Reply |
| `modal-instead-of-sheet` | `presentationStyle={isPad ? 'formSheet' : 'pageSheet'}` is a sheet. Android-only files are skipped (`presentationStyle` is iOS-only). SwiftUI `.fullScreenCover` for a camera, video player or photo view is what Apple reserves full screen for. | Bluesky composer, Ice Cubes |
| `emoji-as-icon` | Symbols with U+FE0E (text presentation, `⚠︎`) are typographic, not emoji. Emoji used as placeholders in string processing (`.replaceAll('☢', ...)`) are not shown. | Ice Cubes, Expensify |
| `no-press-feedback` (React Native) | An empty Pressable that fills its parent is a backdrop; a Pressable with spread props gets its state from a hook; `onPress={Keyboard.dismiss}` is tap-outside-to-close-keyboard. | Bluesky context menus, dialogs |
| `no-press-feedback` (Flutter) | `GestureDetector(onTap: ...unfocus)` closes the keyboard; it is not a button. | Wonderous |
| `touch-target-too-small` (Flutter) | The size is now read from the tap target's own `child:` (through wrappers that keep their child's size, such as `DecoratedBox`, `Material`, `ClipRRect`), not from the first `SizedBox` anywhere inside. An `IconButton` without constraints is measured as `iconSize + 2 × padding` before it is flagged. | Immich (a 32 px thumbnail inside a full-width banner), Immich video controls |
| `glassmorphism` | Translucent white used for ripple, hover, overlay or track colors is feedback, not a surface (this already applied to React Native; now also Flutter and Compose). Blur in files named for bars, headers, sheets, menus, overlays or a lightbox is where Apple's materials belong. | Immich, Jetchat, Bluesky lightbox |
| `missing-safe-area` (Flutter) | Only Scaffold bodies that lay out content in the same file (`Column`, `Stack`, `ListView` ...) are checked; `body: child` or `body: LoginForm()` is checked where that widget lives. | Immich tab shell, Compass, Wonderous router |
| `keyboard-covers-input` | A TextInput counts as handled when its file avoids the keyboard, renders a wrapper that does (a `ScreenWrapper` with a `KeyboardAvoidingView` inside), or is rendered, at any depth, by such a file. Components are matched by name. | Expensify (45 → 17), Bluesky |
| `font-scaling-disabled` | `allowFontScaling={false}` on an icon-font component is an icon, not text. | Bluesky |

Nothing was made stricter or looser beyond these cases. The rules that fired on generated apps still fire on them: every `bad/` fixture and every generated app keeps its findings except the ones listed in [evals.md](evals.md).

## The apps

**Bluesky (76).** The main deductions are real: 3 Texts pin their size (`allowFontScaling={false}` / `maxFontSizeMultiplier={1}`) for the avatar alert badge, the "+N" overflow count and the character counter. All three sit in fixed-size circles, which is a common and defensible exception, but people with large text get small digits there, and the rule costs 4 points each regardless of app size. 23 distinct off-grid spacing values and 13 distinct font sizes are one-offs outside Bluesky's own token system (`alf`), such as a 60 pt OTP digit and 7-8 pt badges; fair by the rule's letter, small in practice. The 65 Pressables without a pressed style were spot-checked (chat footers, settings rows) and are true positives: they show nothing on press.

**Expensify (79).** The biggest single deduction is fair and important: the shared `Text`, `TextInput` and markdown input components set `allowFontScaling={false}`, so system text size is ignored across the whole app. Off-grid spacing (15 values) and font sizes (11) are true positives of the same kind as Bluesky's. The 17 remaining keyboard findings are inputs that reach their screen through form components passed as props (`InputComponent={...}`), which the scanner cannot follow; most are probably handled by Expensify's `ScreenWrapper`. The 5 emoji are the quick-reaction list and a default status emoji, which are content, not icons; the rule cannot tell them apart from emoji icons stored as data, which is exactly what generated apps do.

**Immich (80).** 57 `IconButton`s have no `tooltip`, so TalkBack and VoiceOver announce them as "button" only; that is a real accessibility gap. 155 fixed colors remain, mostly `Colors.white`, `Colors.grey` and `Colors.red` in screens; some sit over photos, where white is correct in both appearances, others are UI that will not follow the theme. One avatar color is Tailwind purple-600 (`#9333EA`), which `default-ai-accent` flags; it is one of nine avatar colors, not the app's accent, so this one is debatable. Off-grid spacing (14 values) and font sizes (11) are fair.

**Compass (87).** The Flutter team's architecture sample uses Material widgets on both platforms with no platform checks and no haptics; both findings are accurate for a sample that does not aim for platform fidelity. Three blurred controls over hero images (back button, home button, tag chips) are counted as glass; they float over photography, so this is debatable. The custom checkbox is a 24×24 tap target and is fairly flagged.

**Wonderous (85).** The app is dark only by design, which costs the full 10 points for `no-dark-mode`. Apple's HIG allows a permanently dark appearance for apps built around immersive media, and Wonderous arguably is one, but the scanner cannot judge intent; the finding is accurate, the judgement is debatable. The remaining hard-coded colors are mostly the wonder illustrations' artwork colors and white text over imagery.

**Ice Cubes (91).** 36 views use `.onTapGesture` where a `Button` would give VoiceOver the button trait, the pressed highlight and keyboard support; this is Apple's guidance and the finding is fair, even though the rows are otherwise polished. 9 off-grid spacing values (5, 6, 10, 18 ...) are true positives. Three `.system(size:)` fonts in the theme preview and account badge are fixed sizes.

**Now in Android (94).** The only deduction is `no-haptics`: no `LocalHapticFeedback` or `performHapticFeedback` anywhere. That is accurate; whether a news reader needs haptics is a product decision, and Android does not require them.

**Jetchat (80).** Of 61 hard-coded colors, 35 come from `MeshUtils.kt`, which draws the animated mesh-gradient background from its color stops, and 16 are white video player controls drawn over video. Both are fair to the letter and unfair in spirit: one is artwork, the other is correct in both appearances. The rule reaches its cap here because Jetchat has only 38 files. The channel drawer is the app's only navigation and is flagged; for a chat app with many channels that is a reasonable design, but it is what the rule describes.

**Reply (92).** `no-haptics` as in Now in Android, and one `clickable(indication = null)` on the avatar, which instead animates into a check mark when selected. The animation is feedback, so this one is debatable.

## Reproduce

```sh
npm ci && npm run build
git clone --depth 1 --filter=blob:none --sparse https://github.com/bluesky-social/social-app && git -C social-app sparse-checkout set src
node dist/src/cli.js scan social-app --summary
```
