# Sources

Every URL the scanner cites, from `npx handfeel rules --json`. All links checked 2026-11-12. The platform references in `skills/handfeel/references/` quote these pages and link to the exact sections.

`npx handfeel explain <rule>` prints the sources for one rule.

## Apple: Human Interface Guidelines and SwiftUI

| Source | Rules | Checked |
|---|---|---|
| [Apple HIG: SF Symbols](https://developer.apple.com/design/human-interface-guidelines/sf-symbols) | `emoji-as-icon` | 2026-11-12 |
| [Apple HIG: Color](https://developer.apple.com/design/human-interface-guidelines/color) | `hardcoded-color`, `purple-gradient`, `gradient-overuse` | 2026-11-12 |
| [Apple HIG: Materials](https://developer.apple.com/design/human-interface-guidelines/materials) | `glassmorphism` | 2026-11-12 |
| [Apple HIG: Layout](https://developer.apple.com/design/human-interface-guidelines/layout) | `off-grid-spacing`, `missing-safe-area` | 2026-11-12 |
| [Apple HIG: Typography](https://developer.apple.com/design/human-interface-guidelines/typography) | `type-scale-sprawl`, `font-scaling-disabled`, `fixed-font-size` | 2026-11-12 |
| [Apple HIG: Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) | `touch-target-too-small`, `no-press-feedback`, `no-platform-adaptation` | 2026-11-12 |
| [Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) | `touch-target-too-small`, `no-press-feedback`, `icon-button-no-label` | 2026-11-12 |
| [SwiftUI: Button](https://developer.apple.com/documentation/swiftui/button) | `no-press-feedback` | 2026-11-12 |
| [Apple HIG: Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets) | `modal-instead-of-sheet` | 2026-11-12 |
| [Apple HIG: Modality](https://developer.apple.com/design/human-interface-guidelines/modality) | `modal-instead-of-sheet` | 2026-11-12 |
| [Apple HIG: Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) | `hamburger-navigation` | 2026-11-12 |
| [SwiftUI: Applying custom fonts to text](https://developer.apple.com/documentation/swiftui/applying-custom-fonts-to-text) | `fixed-font-size` | 2026-11-12 |
| [SwiftUI: NavigationView (deprecated)](https://developer.apple.com/documentation/swiftui/navigationview) | `deprecated-navigation-view` | 2026-11-12 |
| [Apple HIG: Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode) | `forced-color-scheme`, `no-dark-mode` | 2026-11-12 |
| [Apple HIG: Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics) | `no-haptics` | 2026-11-12 |
| [SwiftUI: sensoryFeedback](https://developer.apple.com/documentation/swiftui/view/sensoryfeedback(_:trigger:)) | `no-haptics` | 2026-11-12 |

## Android, Material 3 and Jetpack Compose

| Source | Rules | Checked |
|---|---|---|
| [Material 3: Color roles](https://m3.material.io/styles/color/roles) | `hardcoded-color`, `purple-gradient`, `gradient-overuse` | 2026-11-12 |
| [Material 3: Elevation](https://m3.material.io/styles/elevation/overview) | `glassmorphism`, `ios-only-shadow` | 2026-11-12 |
| [Android: Grids and units (8dp / 4dp grid)](https://developer.android.com/design/ui/mobile/guides/layout-and-content/grids-and-units) | `off-grid-spacing` | 2026-11-12 |
| [Material 3: Typography](https://m3.material.io/styles/typography/overview) | `type-scale-sprawl`, `type-outside-scale` | 2026-11-12 |
| [Android: Make apps more accessible (touch targets 48dp)](https://developer.android.com/guide/topics/ui/accessibility/apps) | `touch-target-too-small` | 2026-11-12 |
| [Compose: Touch target size](https://developer.android.com/develop/ui/compose/accessibility/api-defaults) | `touch-target-too-small`, `no-press-feedback` | 2026-11-12 |
| [Material 3: Accessible design](https://m3.material.io/foundations/accessible-design/overview) | `touch-target-too-small` | 2026-11-12 |
| [Compose: Handling user interactions (indication, ripple)](https://developer.android.com/develop/ui/compose/touch-input/user-interactions/handling-interactions) | `no-press-feedback`, `no-platform-adaptation`, `no-android-ripple` | 2026-11-12 |
| [Compose: Accessibility (contentDescription)](https://developer.android.com/develop/ui/compose/accessibility/key-steps) | `icon-button-no-label` | 2026-11-12 |
| [Compose: Bottom sheets](https://developer.android.com/develop/ui/compose/components/bottom-sheets) | `modal-instead-of-sheet` | 2026-11-12 |
| [Compose: Navigation bar (3-5 destinations)](https://developer.android.com/develop/ui/compose/components/navigation-bar) | `hamburger-navigation` | 2026-11-12 |
| [Material Components: Navigation drawer is being deprecated](https://github.com/material-components/material-components-android/blob/master/docs/components/NavigationDrawer.md) | `hamburger-navigation` | 2026-11-12 |
| [Compose: Window insets and edge-to-edge](https://developer.android.com/develop/ui/compose/layouts/insets) | `missing-safe-area` | 2026-11-12 |
| [Android: Add haptic feedback to events](https://developer.android.com/develop/ui/views/haptics/haptic-feedback) | `no-haptics` | 2026-11-12 |
| [Compose: Material 3 theming](https://developer.android.com/develop/ui/compose/designsystems/material3) | `no-dark-mode` | 2026-11-12 |

## React Native

| Source | Rules | Checked |
|---|---|---|
| [React Native: Pressable](https://reactnative.dev/docs/pressable) | `no-press-feedback`, `no-android-ripple` | 2026-11-12 |
| [React Native: Accessibility](https://reactnative.dev/docs/accessibility) | `icon-button-no-label` | 2026-11-12 |
| [React Native: SafeAreaView](https://reactnative.dev/docs/safeareaview) | `rn-safe-area-view` | 2026-11-12 |
| [React Native: Text allowFontScaling](https://reactnative.dev/docs/text#allowfontscaling) | `font-scaling-disabled` | 2026-11-12 |
| [React Native: Modal presentationStyle](https://reactnative.dev/docs/modal#presentationstyle-ios) | `modal-instead-of-sheet` | 2026-11-12 |
| [React Native: KeyboardAvoidingView](https://reactnative.dev/docs/keyboardavoidingview) | `keyboard-covers-input` | 2026-11-12 |
| [React Native: Shadow props](https://reactnative.dev/docs/shadow-props) | `ios-only-shadow` | 2026-11-12 |
| [React Native: useColorScheme](https://reactnative.dev/docs/usecolorscheme) | `no-dark-mode` | 2026-11-12 |

## Expo

| Source | Rules | Checked |
|---|---|---|
| [Expo: Icons (expo-symbols: SF Symbols and Material Symbols)](https://docs.expo.dev/guides/icons/) | `emoji-as-icon` | 2026-11-12 |
| [Expo: Safe areas](https://docs.expo.dev/develop/user-interface/safe-areas/) | `rn-safe-area-view` | 2026-11-12 |
| [Expo: Keyboard handling](https://docs.expo.dev/guides/keyboard-handling/) | `keyboard-covers-input` | 2026-11-12 |
| [Expo: Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) | `no-haptics` | 2026-11-12 |
| [Expo: Color themes](https://docs.expo.dev/develop/user-interface/color-themes/) | `no-dark-mode` | 2026-11-12 |

## Flutter

| Source | Rules | Checked |
|---|---|---|
| [Flutter: Accessibility (tap target size)](https://docs.flutter.dev/ui/accessibility-and-internationalization/accessibility) | `touch-target-too-small` | 2026-11-12 |
| [Flutter: InkWell](https://api.flutter.dev/flutter/material/InkWell-class.html) | `no-press-feedback` | 2026-11-12 |
| [Flutter: GestureDetector](https://api.flutter.dev/flutter/widgets/GestureDetector-class.html) | `no-press-feedback` | 2026-11-12 |
| [Flutter: IconButton.tooltip](https://api.flutter.dev/flutter/material/IconButton/tooltip.html) | `icon-button-no-label` | 2026-11-12 |
| [Flutter: TextScaler](https://api.flutter.dev/flutter/painting/TextScaler-class.html) | `font-scaling-disabled` | 2026-11-12 |
| [Flutter: showModalBottomSheet](https://api.flutter.dev/flutter/material/showModalBottomSheet.html) | `modal-instead-of-sheet` | 2026-11-12 |
| [Flutter: ThemeData.useMaterial3](https://api.flutter.dev/flutter/material/ThemeData/useMaterial3.html) | `material-2-theme` | 2026-11-12 |
| [Flutter: SafeArea](https://api.flutter.dev/flutter/widgets/SafeArea-class.html) | `missing-safe-area` | 2026-11-12 |
| [Flutter: HapticFeedback](https://api.flutter.dev/flutter/services/HapticFeedback-class.html) | `no-haptics` | 2026-11-12 |
| [Flutter: MaterialApp.darkTheme](https://api.flutter.dev/flutter/material/MaterialApp/darkTheme.html) | `no-dark-mode` | 2026-11-12 |
| [Flutter: Automatic platform adaptations](https://docs.flutter.dev/ui/adaptive-responsive/platform-adaptations) | `no-platform-adaptation` | 2026-11-12 |

## handfeel measurements

| Source | Rules | Checked |
|---|---|---|
| [handfeel slop catalog (measured on generated apps)](https://github.com/maximilianfeix/handfeel/blob/main/docs/slop-catalog.md) | `emoji-as-icon`, `default-ai-accent`, `purple-gradient` | 2026-11-12 |

The slop catalog is the source for the judgement rules: patterns no platform doc rules out, measured in apps generated from plain prompts. See [slop-catalog.md](slop-catalog.md).
