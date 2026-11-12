# handfeel reference: Expo and React Native

Use this file when the app is built with Expo or bare React Native. It lists the patterns that make a generated app look and feel like a web page in a phone frame, and the native replacement for each. In audit mode, report every finding as `file:line`, the rule title, the scanner id and a one-line fix, and do not edit code. In fix mode, work screen by screen in the pass order below and keep each change small enough to review on its own. Scanner ids in brackets are what `npx handfeel scan` reports.

## Detect

Confirm the stack before you apply any rule. Several fixes depend on the version.

- **Expo or bare React Native.** `package.json` has `expo` in `dependencies` for Expo. The major version of the `expo` package is the SDK number (`"expo": "~55.0.0"` is SDK 55). Bare React Native has `react-native` but no `expo`; Expo modules such as `expo-haptics` then need the Expo modules setup, so say so before you suggest one.
- **React Native version.** Read `react-native` in `package.json`.
- **Router.** Expo Router is in use when `expo-router` is a dependency and screens live in `app/` with `_layout.tsx` files. Otherwise look for `@react-navigation/*`.
- **New Architecture.** Check `newArchEnabled` in `app.json` / `app.config.*` (Expo) or `android/gradle.properties` (bare).
- **Installed helpers.** Note which of these exist: `react-native-safe-area-context`, `expo-haptics`, `expo-system-ui`, `expo-status-bar`, `expo-image`, `expo-symbols`, `expo-blur`, `react-native-reanimated`. Adding a missing one is a dependency change (use `npx expo install <pkg>` so the version matches the SDK) and must be called out.

Version-dependent choices:

| Choice | Depends on | What the docs say |
|---|---|---|
| Native tabs import | Expo SDK | `expo-router/native-tabs` for SDK 58+, `expo-router/unstable-native-tabs` for SDK 54 to 57. Below SDK 54, use `Tabs` from `expo-router`. The child component names have changed between releases, so copy them from the docs page for the installed SDK. |
| Android edge-to-edge | Expo SDK | SDK 55 changelog: "edge-to-edge is now mandatory when targeting Android 16+". `edgeToEdgeEnabled` is removed from app.json, and most `expo-navigation-bar` methods are "deprecated and no-op'd". |
| `boxShadow` style | React Native version, New Architecture | reactnative.dev says `boxShadow` "is available on iOS and Android". The scanner's fix text says React Native 0.76+ with the New Architecture; the research for this file did not capture that version line, so confirm it on https://reactnative.dev/docs/shadow-props before relying on it. Otherwise use `shadow*` for iOS plus `elevation` for Android. |
| `expo-symbols` on Android | installed `expo-symbols` version | Current docs: "SF Symbols on iOS and tvOS, and Material Symbols on Android and web". Older installs may only render on iOS; check the docs for the installed version. |
| `@expo/vector-icons` | Expo docs | The icons guide says it "will be deprecated and is not recommended", but still uses it in an example. Do not rip it out of a working app; prefer `expo-symbols` for new icons. |

Sources: https://docs.expo.dev/router/advanced/native-tabs/, https://expo.dev/changelog/sdk-55, https://reactnative.dev/docs/shadow-props, https://docs.expo.dev/versions/latest/sdk/symbols/, https://docs.expo.dev/guides/icons/

---

## Touch

### Touch targets of at least 44 pt [touch-target-too-small]

**Slop:** a small icon is the whole tap area, because the `Pressable` around it has no size of its own.

```tsx
<Pressable onPress={onClose}>
  <Ionicons name="close" size={18} />
</Pressable>
```

**Fix:**

```tsx
<Pressable
  onPress={onClose}
  hitSlop={8}
  accessibilityRole="button"
  accessibilityLabel="Close"
  style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
>
  <SymbolView name={{ ios: 'xmark', android: 'close' }} size={18} tintColor={c.text} />
</Pressable>
```

**Why:** Apple: "a button needs a hit region of at least 44x44 pt". Android asks for "a focusable area, or touch target size, of at least 48dpx48dp", so 48 covers both. `hitSlop` "Sets additional distance outside of element in which a press can be detected." The scanner flags a `Pressable`/`Touchable*` without `hitSlop` when its inline or `StyleSheet.create` size, or the `size` of its only icon child, is under 44, and any icon with `onPress` and `size` under 44.
Source: https://developer.apple.com/design/human-interface-guidelines/buttons#Best-practices, https://developer.android.com/guide/topics/ui/accessibility/apps, https://reactnative.dev/docs/pressable

### Visible press feedback [no-press-feedback]

**Slop:** a bare `Pressable` that shows nothing when pressed, or `TouchableWithoutFeedback` around a row.

```tsx
<Pressable onPress={() => open(item)}>
  <Row item={item} />
</Pressable>
```

**Fix:**

```tsx
<Pressable
  onPress={() => open(item)}
  android_ripple={{ color: c.ripple }}
  style={({ pressed }) => ({
    backgroundColor: pressed && Platform.OS === 'ios' ? c.highlight : 'transparent',
  })}
>
  <Row item={item} />
</Pressable>
```

**Why:** `android_ripple` "Enables the Android ripple effect". `style` can be "a function that receives a boolean reflecting whether the component is currently pressed". Apple: "Always include a press state for a custom button. Without a press state, a button can feel unresponsive." The scanner flags a `Pressable` with `onPress` and no function `style`, function child, `android_ripple` or `onPressIn`; every `TouchableWithoutFeedback` with `onPress`; and `TouchableOpacity` with `activeOpacity` of 0.95 or more.
Source: https://reactnative.dev/docs/pressable, https://developer.apple.com/design/human-interface-guidelines/buttons#Best-practices

### Haptics on meaningful moments [no-haptics]

**Slop:** no haptics anywhere, or `Vibration.vibrate()` used as UI feedback.

```tsx
import { Vibration } from 'react-native';

onPress={() => { Vibration.vibrate(100); save(); }}
```

**Fix:**

```tsx
import * as Haptics from 'expo-haptics';

const ok = await save();
Haptics.notificationAsync(
  ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
);
// custom segmented control or picker: Haptics.selectionAsync();
```

**Why:** Expo: "Android's `Vibrator` API is not recommended for implementing haptics feedback". Apple: "Use system-provided haptic patterns according to their documented meanings" and "Avoid overusing haptics." Use notification for outcomes, selection for value changes, light impact for snaps; not on every tap. On iOS "the Taptic engine will do nothing if ... Low Power Mode is enabled", so haptics never replace visual feedback. The scanner reports once per project when no file uses `expo-haptics`, `react-native-haptic-feedback`, `Vibration.vibrate` or `performAndroidHapticsAsync`. It counts `Vibration.vibrate` as haptics, so check for it by hand.
Source: https://docs.expo.dev/versions/latest/sdk/haptics/, https://developer.apple.com/design/human-interface-guidelines/playing-haptics#Best-practices, https://developer.android.com/develop/ui/views/haptics/haptic-feedback

---

## Structure

### Bottom tabs for top-level sections [hamburger-navigation]

**Slop:** three or four equal sections hidden behind a drawer.

```tsx
// app/_layout.tsx
import { Drawer } from 'expo-router/drawer';

export default function Layout() {
  return <Drawer />; // Home, Stats, Settings behind a menu button
}
```

**Fix:** (SDK 58+; SDK 54 to 57 import from `expo-router/unstable-native-tabs`)

```tsx
import { NativeTabs } from 'expo-router/native-tabs';

export default function Layout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stats">
        <NativeTabs.Trigger.Label>Stats</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

Older SDKs or React Navigation: `Tabs` from `expo-router` or `createBottomTabNavigator`.

**Why:** Native tabs "use the native system tab bar"; on iOS 26 "the system draws the tab bar with Liquid Glass", and Android allows five tabs. Material puts navigation bars at "Three to five destinations of equal importance", and "The navigation drawer is being deprecated in the Material 3 expressive update". Apple: tab bars "let people quickly switch between sections ... while preserving the current navigation state". The scanner flags every import from `expo-router/drawer` or `@react-navigation/drawer`; it does not count destinations, so a drawer with many rarely used items or a tablet layout can be a valid choice.
Source: https://docs.expo.dev/router/advanced/native-tabs/, https://developer.android.com/develop/ui/compose/components/navigation-bar, https://github.com/material-components/material-components-android/blob/master/docs/components/NavigationDrawer.md, https://developer.apple.com/design/human-interface-guidelines/tab-bars

### Sheets instead of centered modal cards [modal-instead-of-sheet]

**Slop:** a transparent `Modal` with a dark scrim and a rounded card in the middle.

```tsx
<Modal transparent animationType="fade" visible={open}>
  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center' }}>
    <View style={{ margin: 24, borderRadius: 24, backgroundColor: '#fff' }}>{filters}</View>
  </View>
</Modal>
```

**Fix:**

```tsx
// app/_layout.tsx (Expo Router)
<Stack.Screen
  name="filters"
  options={{ presentation: 'formSheet', sheetAllowedDetents: [0.5, 1], sheetGrabberVisible: true }}
/>
// without a router route: <Modal presentationStyle="pageSheet" animationType="slide" ...>
```

**Why:** Apple: "A sheet is useful for requesting specific information from people or presenting a simple task". Material: modal bottom sheets "are an alternative to inline menus and simple dialogs on mobile devices". Expo notes: "Android supports a maximum of 3 detents", `sheetGrabberVisible` is iOS-only, and "Native stack headers and nested stack navigators are not supported inside form sheet screens". `presentationStyle` on `Modal` is iOS-only. The scanner flags every `Modal` imported from `react-native` without `presentationStyle` `pageSheet` or `formSheet`; a short destructive confirmation can stay a dialog.
Source: https://docs.expo.dev/router/advanced/modals/, https://reactnative.dev/docs/modal#presentationstyle-ios, https://developer.apple.com/design/human-interface-guidelines/sheets, https://github.com/material-components/material-components-android/blob/master/docs/components/BottomSheet.md

### Safe areas from react-native-safe-area-context [rn-safe-area-view]

**Slop:** the core `SafeAreaView`, or magic padding for the notch.

```tsx
import { SafeAreaView } from 'react-native';

<SafeAreaView style={{ flex: 1 }}><Header /></SafeAreaView>
<View style={{ paddingTop: 47, paddingBottom: 34 }}>{content}</View>
```

**Fix:**

```tsx
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

<SafeAreaView style={{ flex: 1 }} edges={['top']}><Header /></SafeAreaView>

const insets = useSafeAreaInsets();
<View style={{ paddingBottom: insets.bottom }}>{bottomBar}</View>
```

**Why:** reactnative.dev marks the core component "Deprecated. Use react-native-safe-area-context instead." and says it "is currently only applicable to iOS devices". Expo: the library "provides a flexible API for handling Android and iOS device's safe area insets". Screens inside a native stack or tab navigator with a header usually need only the bottom edge. The scanner flags the `SafeAreaView` import from `react-native`; hard-coded notch padding is not scanned.
Source: https://reactnative.dev/docs/safeareaview, https://docs.expo.dev/develop/user-interface/safe-areas/

### Android is edge-to-edge [not scanned]

**Slop:** coloring or opting out of the system bars.

```tsx
<StatusBar backgroundColor="#6D28D9" translucent={false} />
NavigationBar.setBackgroundColorAsync('#6D28D9');
// app.json: "android": { "edgeToEdgeEnabled": false }
```

**Fix:**

```tsx
import { StatusBar } from 'expo-status-bar';

<StatusBar style="auto" />
const insets = useSafeAreaInsets();
<View style={{ paddingBottom: insets.bottom }}>{bottomBar}</View>
```

**Why:** Expo SDK 55: "edge-to-edge is now mandatory when targeting Android 16+", `edgeToEdgeEnabled` is removed and `expo-navigation-bar` has "most methods deprecated and no-op'd". Android 16 removes the edge-to-edge opt-out. Pad content with insets and let the background run under the bars.
Source: https://expo.dev/changelog/sdk-55, https://developer.android.com/about/versions/16/behavior-changes-16

### Keep inputs above the keyboard [keyboard-covers-input]

**Slop:** no keyboard handling, or `behavior` only on iOS.

```tsx
<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
  <Composer />
</KeyboardAvoidingView>
```

**Fix:**

```tsx
<KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
  <Messages />
  <Composer />
</KeyboardAvoidingView>
```

**Why:** Expo: "On Android, Expo apps are edge-to-edge, so the window no longer resizes for the keyboard." "Set a `behavior` on both platforms." For iOS "`padding` usually works best", and "On Android, do not set `softwareKeyboardLayoutMode` to `pan` with `behavior="padding"`." `react-native-keyboard-controller` is a valid alternative. The scanner flags the first `TextInput` in a file that mentions none of `KeyboardAvoidingView`, `KeyboardAware*`, `keyboard-controller`, `automaticallyAdjustKeyboardInsets`, `KeyboardStickyView`, `KeyboardToolbar` or `softwareKeyboardLayoutMode`. It reports a false positive when the avoidance lives in a parent file, and it does not flag the iOS-only `behavior` pattern above.
Source: https://docs.expo.dev/guides/keyboard-handling/, https://reactnative.dev/docs/keyboardavoidingview

---

## Color

### Colors come from tokens [hardcoded-color]

**Slop:** hex values typed into each screen.

```tsx
<View style={{ backgroundColor: '#0F0F23' }}>
  <Text style={{ color: '#A78BFA' }}>Streak</Text>
</View>
```

**Fix:**

```tsx
// theme/colors.ts
export const light = { bg: '#FFFFFF', surface: '#F2F2F7', text: '#111114', textMuted: '#5C5C66', accent: '#0A7C66' };
export const dark = { bg: '#000000', surface: '#1C1C1E', text: '#F2F2F7', textMuted: '#A1A1AA', accent: '#3DD6B0' };

// theme/useColors.ts
import { useColorScheme } from 'react-native';
import { dark, light } from './colors';
export const useColors = () => (useColorScheme() === 'dark' ? dark : light);

// screen
const c = useColors();
<Text style={{ color: c.accent }}>Streak</Text>
```

The values above are placeholders. Keep the app's own brand colors and move them into the token file; check contrast for each pair (see below).

**Why:** Apple: "Avoid using hard-coded color values or colors that don't adapt." A literal in a screen is the same in light and dark mode. The scanner skips token files (paths such as `theme/`, `colors.ts`, `tokens.ts`, `palette`, `design-system`) and flags every color string literal elsewhere.
Source: https://developer.apple.com/design/human-interface-guidelines/dark-mode#Dark-Mode-colors, https://docs.expo.dev/develop/user-interface/color-themes/, https://reactnative.dev/docs/usecolorscheme

### Follow the system light and dark setting [no-dark-mode]

**Slop:** light only, a forced scheme, or status bar icons that disappear in one mode.

```tsx
// app.json: "userInterfaceStyle": "light"   (or the key is missing)
<StatusBar style="light" />
```

**Fix:**

```json
{ "expo": { "userInterfaceStyle": "automatic" } }
```

```tsx
// npx expo install expo-system-ui   (needed for Android development builds)
import { StatusBar } from 'expo-status-bar';
<StatusBar style="auto" />
```

**Why:** Expo: "The app will default to the `light` style if this property is absent", and without `expo-system-ui` on Android development builds "the `userInterfaceStyle` property is ignored". `StatusBar` `style` "auto" "picks the appropriate value according to the active color scheme". Apple: people "generally expect all apps and games to respect their preference" and "Avoid offering an app-specific appearance setting." The scanner reports once per project when no file reads the scheme (`useColorScheme`, `Appearance.`, `useTheme(`, `DarkTheme`, `PlatformColor`, `DynamicColorIOS`, NativeWind, `dark:`) or when `userInterfaceStyle` is not `"automatic"`. A fixed `StatusBar` style is not scanned.
Source: https://docs.expo.dev/develop/user-interface/color-themes/, https://docs.expo.dev/versions/latest/sdk/status-bar/, https://developer.apple.com/design/human-interface-guidelines/dark-mode#Best-practices

### No default AI purple [default-ai-accent]

**Slop:** the accent nobody chose.

```tsx
export const colors = { primary: '#6366F1', secondary: '#8B5CF6' };
```

**Fix:**

```tsx
// a color picked for this product, defined once, with a dark-mode variant
export const light = { accent: '#0A7C66' };
export const dark = { accent: '#3DD6B0' };
```

Ask the user for a brand color if none exists. Do not invent a brand; propose one and say it is a proposal.

**Why:** Tailwind indigo, violet and purple 400 to 600, `#667EEA` to `#764BA2` and `#6C63FF` are what generated apps pick by default, so the app looks generated before anyone reads it. The scanner flags exact matches of `#6366F1 #4F46E5 #818CF8 #8B5CF6 #7C3AED #A78BFA #A855F7 #9333EA #C084FC #667EEA #764BA2 #6C63FF #6C5CE7 #7F5AF0`, including inside token files.
Source: handfeel judgement, see docs/slop-catalog.md

### Gradients only for artwork [purple-gradient, gradient-overuse]

**Slop:** gradient hero cards, buttons and avatars, often indigo to violet with white text.

```tsx
<LinearGradient colors={['#667eea', '#764ba2']} style={styles.hero}>
  <Text style={{ color: 'rgba(255,255,255,0.7)' }}>Daily goal</Text>
</LinearGradient>
```

**Fix:**

```tsx
<View style={[styles.hero, { backgroundColor: c.surface }]}>
  <Text style={{ color: c.text }}>Daily goal</Text>
</View>
```

Keep one or two gradients for brand moments or artwork if the app relies on them. Never put text on a gradient without checking contrast at both ends.

**Why:** Strong color should mark the few things a user acts on. The HIG has no gradient rule; the closest guidance is "Apply color sparingly" and "Refrain from adding color to the background of multiple controls." `gradient-overuse` reports every JSX element whose name ends in `Gradient` and every array under a key containing "gradient", after two free ones per project. `purple-gradient` reports any gradient with a stop in the indigo to violet band (hue 235 to 295), including colors resolved from the theme.
Source: handfeel judgement, see docs/slop-catalog.md. Related: https://developer.apple.com/design/human-interface-guidelines/color#Liquid-Glass-color

### Glass belongs to bars, not content [glassmorphism]

**Slop:** a `BlurView` per card, or near-white translucent fills.

```tsx
{items.map((i) => (
  <BlurView key={i.id} intensity={60} tint="light" style={styles.glassCard}>
    <ItemRow item={i} />
  </BlurView>
))}
```

**Fix:**

```tsx
<FlatList
  data={items}
  keyExtractor={(i) => i.id}
  renderItem={({ item }) => <ItemRow item={item} style={{ backgroundColor: c.surface }} />}
/>
// keep blur for the tab bar or a header; NativeTabs already gets system glass on iOS 26
```

**Why:** Apple: "Don't use Liquid Glass in the content layer." On Android, `expo-blur` needs the content wrapped in a `BlurTargetView`; the default `blurMethod` `'none'` "Renders a semi-transparent view instead of rendering a blur effect", and the `dimezisBlurView` method "may lead to decreased performance on Android SDK 30 and below". The scanner flags every `BlurView` (one free per project) and every string color that is near white with alpha 0.04 to 0.35.
Source: https://developer.apple.com/design/human-interface-guidelines/materials#Liquid-Glass, https://docs.expo.dev/versions/latest/sdk/blur-view/

### Text contrast of 4.5:1 [not scanned]

**Slop:** faded white on color, or light gray on white.

```tsx
<Text style={{ color: 'rgba(255,255,255,0.6)' }}>Daily goal</Text>   // on a purple card
<Text style={{ color: '#9CA3AF' }}>Last synced 2 min ago</Text>     // on white
```

**Fix:**

```tsx
<Text style={{ color: c.textMuted }}>Last synced 2 min ago</Text>
// c.textMuted checked at 4.5:1 or more against c.bg and c.surface, in light and dark
```

**Why:** Android: text under 18sp (or bold under 14sp) needs "a color contrast ratio of at least 4.5:1", other text 3:1. Apple uses the same WCAG AA values and adds: "If your app supports Dark Mode, make sure to check the minimum contrast in both light and dark appearances." Compute the ratio when both colors are literals; text over images or gradients needs a screenshot check.
Source: https://developer.android.com/guide/topics/ui/accessibility/apps, https://developer.apple.com/design/human-interface-guidelines/accessibility#Vision

---

## Type

### A small type scale with named roles [type-scale-sprawl]

**Slop:** a new font size for each label.

```tsx
title: { fontSize: 28, fontWeight: '800' },
subtitle: { fontSize: 15 },
meta: { fontSize: 11.5, fontWeight: '300' },
badge: { fontSize: 13 },
```

**Fix:**

```tsx
// theme/type.ts, sizes from the iOS text styles at the default size
export const type = {
  title1: { fontSize: 28, fontWeight: '700' },
  headline: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 17 },
  subhead: { fontSize: 15 },
  footnote: { fontSize: 13 },
  caption: { fontSize: 12 },
} as const;
```

**Why:** Apple: "The system-defined text styles give you a convenient and consistent way to convey your information hierarchy". iOS defaults: Large Title 34, Title 1 28, Title 2 22, Title 3 20, Headline 17 semibold, Body 17, Callout 16, Subhead 15, Footnote 13, Caption 1 12, Caption 2 11. Apple also says to avoid Ultralight, Thin and Light weights and to stay at 11 pt or more. The scanner collects every distinct numeric `fontSize` in the project; above 8 distinct sizes it reports each one at its first use.
Source: https://developer.apple.com/design/human-interface-guidelines/typography#Using-system-fonts, https://developer.apple.com/design/human-interface-guidelines/typography#Ensuring-legibility

### Let text scale with the system setting [font-scaling-disabled]

**Slop:**

```tsx
<Text allowFontScaling={false} style={{ fontSize: 14 }}>Balance</Text>
Text.defaultProps = { ...Text.defaultProps, allowFontScaling: false };
```

**Fix:**

```tsx
<Text style={type.body}>Balance</Text>
// only where a layout truly cannot grow (tab label, tight chip):
<Text style={type.caption} maxFontSizeMultiplier={1.6}>Pro</Text>
```

Then fix the layouts that break: let rows wrap, remove fixed heights around text.

**Why:** `allowFontScaling` (default `true`) "Specifies whether fonts should scale to respect Text Size accessibility settings." Apple: "Apps that don't respond to this setting can be difficult or impossible to use for people who rely on this feature." The scanner flags `allowFontScaling={false}`, `maxFontSizeMultiplier` of 1.15 or less, and assignments like `Text.allowFontScaling = false`. The `defaultProps` object form above is not caught; search for it.
Source: https://reactnative.dev/docs/text#allowfontscaling, https://developer.apple.com/design/human-interface-guidelines/layout#Adaptability

---

## Icons

### Platform symbols, not emoji [emoji-as-icon]

**Slop:** an emoji standing in for an icon in a tab, button or list row.

```tsx
<Text style={{ fontSize: 22 }}>{'\u{1F3E0}'}</Text>   // house emoji as the Home tab icon
<Text style={{ fontSize: 18 }}>{'\u{1F525}'}</Text>   // fire emoji as the streak icon
```

**Fix:**

```tsx
import { SymbolView } from 'expo-symbols';

<SymbolView name={{ ios: 'house.fill', android: 'home', web: 'home' }} size={24} tintColor={c.text} />
<SymbolView name={{ ios: 'flame.fill', android: 'local_fire_department' }} size={18} tintColor={c.accent} />
```

Check each symbol name in SF Symbols and Material Symbols before you use it.

**Why:** `expo-symbols` uses "SF Symbols on iOS and tvOS, and Material Symbols on Android and web", so icons follow the tint color and match the system font. Emoji render differently per OS and vendor and ignore tint. Apple asks that interface icons "use a consistent size, level of detail, stroke thickness (or weight), and perspective"; it does not mention emoji. The scanner flags string literals made of one to three emoji; five or more in a row are treated as content (a reaction bar or picker) and skipped.
Source: handfeel judgement, see docs/slop-catalog.md. Related: https://docs.expo.dev/versions/latest/sdk/symbols/, https://developer.apple.com/design/human-interface-guidelines/icons#Best-practices

### Labels on icon-only controls [icon-button-no-label]

**Slop:**

```tsx
<Pressable onPress={share}>
  <Ionicons name="share-outline" size={22} />
</Pressable>
```

**Fix:**

```tsx
<Pressable onPress={share} accessibilityRole="button" accessibilityLabel="Share" hitSlop={11}>
  <SymbolView name={{ ios: 'square.and.arrow.up', android: 'share' }} size={22} tintColor={c.text} />
</Pressable>
```

**Why:** reactnative.dev: "it is a good practice to set an `accessibilityLabel` on the view, so that people who use VoiceOver or TalkBack know what element they have selected." The default label is built by "concatenating all Text node children", so an icon-only control has nothing to read. Meaningful images (`expo-image`) also get an `accessibilityLabel`. The scanner flags pressables (`Pressable`, `Touchable*`, `RectButton`, `BaseButton`) that contain an icon element (names ending in `Icon`/`Icons`, vector icon sets, `SymbolView`, `Image`, or lucide/heroicons/phosphor/tabler imports), no text, and no `accessibilityLabel`/`aria-label`.
Source: https://reactnative.dev/docs/accessibility, https://developer.apple.com/design/human-interface-guidelines/voiceover#Descriptions

---

## Spacing

### Spacing on a 4/8 grid [off-grid-spacing]

**Slop:** values that almost line up.

```tsx
container: { padding: 18, gap: 10 },
row: { paddingVertical: 14, marginBottom: 15 },
```

**Fix:**

```tsx
// theme/space.ts
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

container: { padding: space.lg, gap: space.sm },
row: { paddingVertical: space.md, marginBottom: space.lg },
```

Round to the nearest step and check that the screen still looks right; do not redesign the layout.

**Why:** A fixed scale makes rows and edges line up across screens. The scanner reads numeric `padding*`, `margin*`, `gap`, `rowGap` and `columnGap` values; 0, 1, 2 and multiples of 4 are on the grid. It allows three distinct off-grid values per project and then reports each off-grid value at its first use.
Source: handfeel judgement, see docs/slop-catalog.md. The scanner also links https://developer.android.com/design/ui/mobile/guides/layout-and-content/grids-and-units and https://developer.apple.com/design/human-interface-guidelines/layout; the research for this file did not capture a quote from them.

---

## Platform details

### Ripple on Android, not an opacity flash everywhere [no-android-ripple]

**Slop:** `TouchableOpacity` for every control, so Android never ripples.

```tsx
<TouchableOpacity activeOpacity={0.6} onPress={buy}>
  <Text>Buy</Text>
</TouchableOpacity>
```

**Fix:**

```tsx
<Pressable
  onPress={buy}
  android_ripple={{ color: c.ripple }}
  style={({ pressed }) => [styles.button, pressed && Platform.OS === 'ios' && styles.buttonPressed]}
>
  <Text style={styles.buttonLabel}>Buy</Text>
</Pressable>
```

Migrate shared button components first; that fixes most call sites in one change.

**Why:** reactnative.dev on `TouchableOpacity`: "If you're looking for a more extensive and future-proof way to handle touch-based input, check out the Pressable API." Pressed controls on Android ripple. The scanner reports once per project when any file uses `TouchableOpacity` and no file uses `android_ripple`, `TouchableNativeFeedback`, `RectButton`, `BorderlessButton`, `react-native-paper` or `@react-native-material`.
Source: https://reactnative.dev/docs/touchableopacity, https://reactnative.dev/docs/pressable

### Branch where iOS and Android differ [no-platform-adaptation]

**Slop:** one web-like look for both platforms: same icons, same pressed state, same shadows.

```tsx
<Ionicons name="share-outline" size={22} />   // the same glyph on iOS and Android
```

**Fix:**

```tsx
import { Platform } from 'react-native';

const shareIcon = Platform.select({ ios: 'square.and.arrow.up', android: 'share', default: 'share' });
// larger differences: ShareSheet.ios.tsx and ShareSheet.android.tsx, imported as './ShareSheet'
```

**Why:** `Platform.select` "returns the most fitting value for the platform", and "React Native will detect when a file has a `.ios.` or `.android.` extension and load the relevant platform file". Branch only where the conventions differ (tabs, sheets, icons, pressed state, shadows), not for content. The scanner reports once per project when no file uses `Platform.OS`, `Platform.select`, `.ios.`/`.android.` files, `android_ripple`, `expo-symbols`, `NativeTabs` or `PlatformColor`.
Source: https://reactnative.dev/docs/platform-specific-code

### Shadows that work on both platforms [ios-only-shadow]

**Slop:** large, colored, iOS-only shadows; the Android card is flat.

```tsx
card: { shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 24 },
```

**Fix:**

```tsx
card: { borderRadius: 12, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)' },
// if boxShadow is not available (see Detect):
card: {
  borderRadius: 12,
  ...Platform.select({
    ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
    android: { elevation: 1 },
  }),
},
```

**Why:** reactnative.dev: "only `shadowColor` works on both Android and iOS, all other `shadow` props only work on iOS", while `boxShadow` "is available on iOS and Android". Keep shadows small and neutral; many surfaces need none. The scanner flags a style object with `shadowColor`, `shadowRadius` or `shadowOffset` and no `elevation`, `boxShadow` or `android` key; objects under an `ios` key are skipped.
Source: https://reactnative.dev/docs/shadow-props

### Lists render lazily with stable keys [not scanned]

**Slop:**

```tsx
<ScrollView>{transactions.map((t, i) => <TxRow key={i} tx={t} />)}</ScrollView>
```

**Fix:**

```tsx
const renderTx = useCallback(({ item }: { item: Tx }) => <TxRow tx={item} />, []);

<FlatList data={transactions} keyExtractor={(t) => t.id} renderItem={renderTx} />
```

**Why:** "`ScrollView` renders all its react child components at once", while "`FlatList` renders items lazily". The key "is used for caching and as the react key to track item re-ordering"; an index key breaks when items move. reactnative.dev also suggests moving `renderItem` out of the JSX into a `useCallback`. Short, fixed content (a settings screen with six rows) can stay a `ScrollView`.
Source: https://reactnative.dev/docs/scrollview, https://reactnative.dev/docs/flatlist, https://reactnative.dev/docs/optimizing-flatlist-configuration

### Pull to refresh, not a refresh button [not scanned]

**Slop:**

```tsx
<Button title="Refresh" onPress={reload} />
<FlatList data={items} renderItem={renderItem} />
```

**Fix:**

```tsx
<FlatList data={items} renderItem={renderItem} refreshing={isFetching} onRefresh={reload} />
// ScrollView: refreshControl={<RefreshControl refreshing={isFetching} onRefresh={reload} />}
```

**Why:** `onRefresh`: "If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality. Make sure to also set the `refreshing` prop correctly." Apple also asks apps to "Perform automatic content updates" so people do not have to start every refresh.
Source: https://reactnative.dev/docs/flatlist, https://reactnative.dev/docs/refreshcontrol, https://developer.apple.com/design/human-interface-guidelines/progress-indicators#Refresh-content-controls

### Loading states show content, not a lone spinner [not scanned]

**Slop:** the whole screen swaps to a centered spinner, and remote images pop in from blank.

```tsx
if (loading) {
  return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" /></View>;
}
<Image source={{ uri: avatar }} style={{ width: 48, height: 48, borderRadius: 24 }} />
```

**Fix:**

```tsx
import { Image } from 'expo-image';

<FlatList data={loading ? placeholders : items} renderItem={loading ? renderSkeleton : renderItem} />
<Image source={avatar} placeholder={{ blurhash }} transition={150} contentFit="cover"
  style={{ width: 48, height: 48, borderRadius: 24 }} accessibilityLabel={`${name}'s avatar`} />
```

Keep showing the last data while a refresh runs. Put a small spinner inside a button for button-triggered work.

**Why:** Apple: "Show something as soon as possible. ... consider showing placeholder text, graphics, or animations as content loads". `expo-image` has "Disk and memory caching", a `placeholder` "to display while loading the proper image", and `transition`. Neither reactnative.dev nor docs.expo.dev gives skeleton guidance; the iOS rule is the source here.
Source: https://developer.apple.com/design/human-interface-guidelines/loading#Best-practices, https://docs.expo.dev/versions/latest/sdk/image/

### Respect Reduce Motion [not scanned]

**Slop:** decorative loops that run regardless of the system setting.

```tsx
useEffect(() => {
  pulse.value = withRepeat(withTiming(1.1, { duration: 800 }), -1, true);
}, []);
```

**Fix:**

```tsx
import { useReducedMotion, withRepeat, withTiming } from 'react-native-reanimated';

const reduceMotion = useReducedMotion();
useEffect(() => {
  if (!reduceMotion) pulse.value = withRepeat(withTiming(1.05, { duration: 800 }), -1, true);
}, [reduceMotion]);
// without Reanimated: AccessibilityInfo.isReduceMotionEnabled() and the reduceMotionChanged event
```

**Why:** Apple: when Reduce Motion is on, "ensure your app or game responds by reducing automatic and repetitive animations, including zooming, scaling, and peripheral motion." Reanimated: "useReducedMotion lets you query the reduced motion system setting." On Android the RN event is also `true` when "Transition Animation Scale" is off. Look for `withRepeat(`, `Animated.loop(` and looping Lottie files with no reduce-motion check.
Source: https://developer.apple.com/design/human-interface-guidelines/accessibility#Cognitive, https://reactnative.dev/docs/accessibilityinfo, https://docs.swmansion.com/react-native-reanimated/docs/device/useReducedMotion/

---

## Checklist before you report

- You confirmed Expo SDK, React Native version, router and New Architecture, and every version-dependent fix matches them.
- Every finding has `file:line`, the rule title, the scanner id (or "not scanned") and a one-line fix.
- You ran `npx handfeel scan` (or read its output) and every scanner finding is either fixed, reported, or explained as a false positive.
- Findings the scanner cannot see (edge-to-edge, contrast, lists, pull to refresh, loading, reduce motion) were checked by reading the screens.
- Each fix touches one screen or one shared component and can be reviewed alone.
- New colors, sizes and spacing go into the token files, not into screens.
- Light and dark mode were both considered for every color change.
- Any new dependency is named, with the reason, and installed with `npx expo install`.
- TypeScript still compiles (`npx tsc --noEmit` if the project has a tsconfig) and the linter passes.
- You state which platforms you actually ran the app on. If you only read code, say so.

## Do not

- Do not change features, content, copy, data flow or navigation structure beyond what a rule requires. Moving a drawer to tabs changes navigation, so propose it and wait for approval in audit mode.
- Do not add a dependency without saying so, and do not swap a library the app already uses for a different one to fix a style issue.
- Do not invent a brand color, font or logo. Propose and label it as a proposal.
- Do not remove a gradient, blur or color that is clearly part of the product's brand without asking; reduce it to where it belongs.
- Do not claim something was tested on iOS or Android if it was not run there.
- Do not quote guidelines that are not in this file or invent URLs.
- Do not silence scanner findings to raise the score. If a finding is deliberate, leave the code, explain why, and only then add `// handfeel-ignore-next-line <rule-id>`.
- Do not add haptics, animation or sheets everywhere at once. Each one needs a reason in the screen it is on.
