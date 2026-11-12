# handfeel reference: Flutter

Use this file when the app is built with Flutter. It lists the patterns that make a generated Flutter app look like an unchanged template or a web page in a phone frame, and the native replacement for each. In audit mode, report every finding as `file:line`, the rule title, the scanner id and a one-line fix, and do not edit code. In fix mode, work screen by screen in the pass order below and keep each change small enough to review on its own. Scanner ids in brackets are what `npx handfeel scan` reports.

## Detect

Confirm the stack before you apply any rule. Several fixes depend on the version.

- **Flutter project.** `pubspec.yaml` lists `flutter` under `dependencies` (`sdk: flutter`) and the code lives in `lib/`.
- **SDK version.** Read `environment:` in `pubspec.yaml` (the Dart `sdk:` constraint and, if present, a `flutter:` constraint). `pubspec.lock` records the resolved `sdks:`. If the Flutter CLI is available, `flutter --version` gives the exact release.
- **App shell.** Note whether the root is `MaterialApp`, `MaterialApp.router` or `CupertinoApp`, and whether routing uses `go_router` or `Navigator`.
- **Theme files.** Find where `ThemeData` and `ColorScheme` are built (often `lib/theme/`, `theme.dart`, `colors.dart`). Fixes go there first.
- **Packages.** Note icon packages (`cupertino_icons`), shimmer/skeleton packages and animation packages (`lottie`). Adding a package is a dependency change and must be called out.

Version-dependent choices:

| Choice | Depends on | What the docs say |
|---|---|---|
| Android edge-to-edge | Flutter release, Android target | "Starting in Flutter 3.27, Flutter apps target Android 15 by default", and apps targeting Android 15+ "opt in to edge-to-edge mode". "as of Android 16, you can't" opt out. |
| `TextScaler` | Flutter release | `textScaleFactor` "was deprecated"; `TextScaler` and `MediaQuery.textScalerOf(context)` are the replacement, stable in Flutter 3.16. On older SDKs keep the existing API and only remove overrides. |
| Material 3 | `ThemeData.useMaterial3` | "This flag is true by default." The default changed in stable release 3.16. |
| `HapticFeedback.successNotification()` | Flutter release | Listed on the current API page ("indicating that a task or action has completed successfully"); handfeel did not verify the first release that has it. If it does not compile, use `lightImpact()` or `mediumImpact()`. |
| Color alpha (`withOpacity` vs `withValues`) | Flutter release | `withOpacity` is deprecated since 3.27: "Use .withValues() to avoid precision loss." Write `color.withValues(alpha: 0.5)` on 3.27+; on older SDKs keep `withOpacity`. |
| `surfaceContainer*` color roles | Flutter release | Added in stable release 3.22. Below that, use the closest surface role the SDK has. |
| `PopScope` | Flutter release | Replaced `WillPopScope` for predictive back in stable release 3.16. |
| Dart 3 `switch` expressions | Dart SDK constraint | Used in one fix below; on Dart 2 use an `if`/`else`. |

Sources: https://docs.flutter.dev/release/breaking-changes/default-systemuimode-edge-to-edge, https://docs.flutter.dev/release/breaking-changes/deprecate-textscalefactor, https://docs.flutter.dev/release/breaking-changes/material-3-default, https://api.flutter.dev/flutter/material/ThemeData/useMaterial3.html, https://api.flutter.dev/flutter/services/HapticFeedback-class.html, https://docs.flutter.dev/release/breaking-changes/wide-gamut-framework, https://api.flutter.dev/flutter/dart-ui/Color/withOpacity.html, https://docs.flutter.dev/release/breaking-changes/new-color-scheme-roles, https://docs.flutter.dev/release/breaking-changes/android-predictive-back

---

## Touch

### Tap targets of at least 48x48 [touch-target-too-small]

**Slop:** a small icon in a `GestureDetector`, so the visible icon is the whole target.

```dart
GestureDetector(
  onTap: onClose,
  child: Container(width: 28, height: 28, child: const Icon(Icons.close, size: 16)),
)
```

**Fix:**

```dart
IconButton(onPressed: onClose, icon: const Icon(Icons.close), tooltip: 'Close')
```

Optional regression test, if the project has widget tests:

```dart
testWidgets('meets tap target guidelines', (tester) async {
  final handle = tester.ensureSemantics();
  await tester.pumpWidget(const MyApp());
  await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
  await expectLater(tester, meetsGuideline(iOSTapTargetGuideline));
  handle.dispose();
});
```

**Why:** Flutter's guidelines check "a minimum size of 48 by 48 pixels for Android" and "a minimum size of 44 by 44 pixels for iOS". `IconButton`'s hit region is "at least kMinInteractiveDimension pixels in size, regardless of the actual iconSize". Apple: "a button needs a hit region of at least 44x44 pt". The scanner flags a `GestureDetector`, `InkWell` or `InkResponse` with `onTap` whose child is a `Container`, `SizedBox` or `AnimatedContainer` with a literal width or height under 44, and an `IconButton` whose minimum size was removed (`constraints: BoxConstraints()`, or compact density with `EdgeInsets.zero` padding). Also look for `materialTapTargetSize: MaterialTapTargetSize.shrinkWrap` by hand.
Source: https://docs.flutter.dev/ui/accessibility/accessibility-testing, https://api.flutter.dev/flutter/material/IconButton-class.html, https://developer.apple.com/design/human-interface-guidelines/buttons#Best-practices

### Ink feedback instead of a bare GestureDetector [no-press-feedback]

**Slop:** a tappable card that draws nothing when touched.

```dart
GestureDetector(
  onTap: () => open(item),
  child: Container(decoration: cardDecoration, child: row),
)
```

**Fix:**

```dart
Card(
  clipBehavior: Clip.antiAlias,
  child: InkWell(onTap: () => open(item), child: row),
)
// list rows: ListTile(onTap: () => open(item), title: Text(item.title))
```

**Why:** `InkWell` is "A rectangular area of a Material that responds to touch" and "must have a Material widget as an ancestor". The API page points to `GestureDetector` "for listening for gestures without ink splashes". Buttons, `ListTile` and `InkWell` also bring focus and semantics. The scanner flags `GestureDetector` with `onTap` and no drag or scale handler, and `InkWell`/`InkResponse` with both `splashFactory: NoSplash.splashFactory` and `highlightColor: Colors.transparent`.
Source: https://api.flutter.dev/flutter/material/InkWell-class.html, https://api.flutter.dev/flutter/widgets/GestureDetector-class.html

### Haptics on meaningful moments [no-haptics]

**Slop:** custom controls that are silent, or `vibrate()` on every tap.

```dart
GestureDetector(onTap: () => setState(() => selected = i), child: Segment(label))
onPressed: () { HapticFeedback.vibrate(); save(); }
```

**Fix:**

```dart
import 'package:flutter/services.dart';

InkWell(
  onTap: () {
    HapticFeedback.selectionClick();
    setState(() => selected = i);
  },
  child: Segment(label),
)
```

**Why:** `selectionClick()` "Provides a haptic feedback indication selection changing through discrete values"; `lightImpact()`, `mediumImpact()` and `heavyImpact()` cover physical events. "The Material and Cupertino packages automatically trigger the platform appropriate haptic feedback in certain scenarios", so do not add a second haptic to standard controls. Apple: "Avoid overusing haptics." The scanner reports once per project when nothing uses `HapticFeedback.`, `Vibration`, `haptic_feedback` or `enableFeedback: true`. It does not flag `vibrate()`; check for it by hand.
Source: https://api.flutter.dev/flutter/services/HapticFeedback-class.html, https://docs.flutter.dev/ui/adaptive-responsive/platform-adaptations, https://developer.apple.com/design/human-interface-guidelines/playing-haptics#Best-practices

---

## Structure

### Bottom navigation for top-level sections [hamburger-navigation]

**Slop:** three sections behind a drawer.

```dart
Scaffold(
  appBar: AppBar(),
  drawer: Drawer(child: ListView(children: [homeTile, statsTile, settingsTile])),
  body: page,
)
```

**Fix:**

```dart
Scaffold(
  body: pages[index],
  bottomNavigationBar: NavigationBar(
    selectedIndex: index,
    onDestinationSelected: (i) => setState(() => index = i),
    destinations: const [
      NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
      NavigationDestination(icon: Icon(Icons.insights_outlined), label: 'Stats'),
      NavigationDestination(icon: Icon(Icons.settings_outlined), label: 'Settings'),
    ],
  ),
)
```

On iOS use `CupertinoTabBar` (see "Branch on the theme platform" below).

**Why:** Flutter does not adapt this for you: it names "`NavigationBar` widget on Android and the `CupertinoTabBar` widget on iOS". Material: navigation bars are for "Three to five destinations of equal importance", and "The navigation drawer is being deprecated in the Material 3 expressive update". Apple: tab bars "let people quickly switch between sections". The scanner flags `drawer: Drawer(` and `drawer: NavigationDrawer(`; it does not count items, so a drawer for many rarely used destinations or a tablet layout can be valid.
Source: https://docs.flutter.dev/ui/adaptive-responsive/platform-adaptations, https://api.flutter.dev/flutter/material/NavigationBar-class.html, https://developer.android.com/develop/ui/compose/components/navigation-bar, https://github.com/material-components/material-components-android/blob/master/docs/components/NavigationDrawer.md, https://developer.apple.com/design/human-interface-guidelines/tab-bars

### Bottom sheets instead of dialogs for tasks [modal-instead-of-sheet]

**Slop:** an `AlertDialog` used as an options menu or as a form.

```dart
showDialog(
  context: context,
  builder: (_) => AlertDialog(
    title: const Text('New habit'),
    content: Column(mainAxisSize: MainAxisSize.min, children: [nameField, editTile, deleteTile]),
  ),
);
```

**Fix:**

```dart
showModalBottomSheet(
  context: context,
  showDragHandle: true,
  useSafeArea: true,
  isScrollControlled: true,
  builder: (_) => Column(mainAxisSize: MainAxisSize.min, children: [nameField, editTile, deleteTile]),
);
// iOS action list: showCupertinoModalPopup(context: context, builder: (_) => CupertinoActionSheet(actions: [...]))
```

**Why:** "A modal bottom sheet is an alternative to a menu or a dialog". `useSafeArea` defaults to false, so set it. `CupertinoActionSheet` is "An iOS-style action sheet", shown with `showCupertinoModalPopup`. Material: "Dialogs are purposefully interruptive, so they should be used sparingly." Keep dialogs for short, urgent decisions. The scanner flags `showDialog`, `showCupertinoDialog` and `showGeneralDialog` calls that contain `TextField`, `TextFormField`, `CupertinoTextField` or `Form(`; dialogs used as option menus are not scanned.
Source: https://api.flutter.dev/flutter/material/showModalBottomSheet.html, https://api.flutter.dev/flutter/cupertino/CupertinoActionSheet-class.html, https://github.com/material-components/material-components-android/blob/master/docs/components/Dialog.md, https://developer.apple.com/design/human-interface-guidelines/sheets

### Safe area and edge-to-edge [missing-safe-area]

**Slop:** a full-bleed screen with no app bar and no insets, or the edge-to-edge opt-out.

```dart
return Scaffold(body: Column(children: [header, Expanded(child: list), bottomCta]));
// android/app/src/main/res/values/styles.xml: windowOptOutEdgeToEdgeEnforcement
```

**Fix:**

```dart
return Scaffold(
  appBar: AppBar(title: const Text('Habits')),
  body: list,
  bottomNavigationBar: SafeArea(
    child: Padding(padding: const EdgeInsets.all(16), child: bottomCta),
  ),
);
// no app bar wanted: Scaffold(body: SafeArea(child: ...))
```

**Why:** "By default, apps targeting Android SDK 15+ will opt in to edge-to-edge mode", and "Using the mechanism to opt out of edge-to-edge on Android 16 or later might cause your app to crash." `SafeArea` "insets its child with sufficient padding to avoid intrusions by the operating system." Let backgrounds bleed; keep text and controls inside. The scanner looks at files with a `Scaffold` and no `SafeArea`, `SliverAppBar`, `CupertinoSliverNavigationBar` or `MediaQuery` padding lookup, and flags each `Scaffold` with a `body` but no `appBar` or `navigationBar`. Hard-coded notch padding such as `EdgeInsets.only(top: 47)` and the styles.xml opt-out are not scanned.
Source: https://docs.flutter.dev/release/breaking-changes/default-systemuimode-edge-to-edge, https://api.flutter.dev/flutter/widgets/SafeArea-class.html, https://developer.apple.com/design/human-interface-guidelines/layout#Guides-and-safe-areas

### Keep inputs above the keyboard [not scanned]

**Slop:** turning off keyboard resizing to hide the overflow stripes.

```dart
Scaffold(
  resizeToAvoidBottomInset: false,
  body: Column(children: [form, const Spacer(), submit]),
)
```

**Fix:**

```dart
Scaffold(
  body: SafeArea(
    child: ListView(padding: const EdgeInsets.all(16), children: [form, submit]),
  ),
)
```

**Why:** `resizeToAvoidBottomInset`: "If true the body and the scaffold's floating widgets should size themselves to avoid the onscreen keyboard". It defaults to true. Fix the overflow with a scrollable body instead. Search for `resizeToAvoidBottomInset: false`.
Source: https://api.flutter.dev/flutter/material/Scaffold/resizeToAvoidBottomInset.html

### Keyboard type, autofill and the action key [not scanned]

**Slop:** a login form where every field opens the text keyboard and the password manager offers nothing.

```dart
TextField(decoration: const InputDecoration(labelText: 'Email'))
TextField(decoration: const InputDecoration(labelText: 'Password'), obscureText: true)
```

**Fix:**

```dart
AutofillGroup(
  child: Column(children: [
    TextField(
      decoration: const InputDecoration(labelText: 'Email'),
      keyboardType: TextInputType.emailAddress,
      autofillHints: const [AutofillHints.email],
      textInputAction: TextInputAction.next,
    ),
    TextField(
      decoration: const InputDecoration(labelText: 'Password'),
      obscureText: true,
      autofillHints: const [AutofillHints.password],
      textInputAction: TextInputAction.done,
      onSubmitted: (_) => signIn(),
    ),
  ]),
)
```

Use `AutofillHints.newPassword` on sign-up, `oneTimeCode` for SMS codes, and `TextInputType.phone` or `TextInputType.numberWithOptions(decimal: true)` where they fit.

**Why:** `autofillHints` is "A list of strings that helps the autofill service identify the type of this text input." `AutofillHints.password`: "The input field expects a password." Apple: "Choose a keyboard that matches the type of content people are editing", and "Consider customizing the Return key type if it helps clarify the text-entry experience." Search for `TextField(` and `TextFormField(` without `keyboardType` or `autofillHints` on email, phone, password and code fields.
Source: https://api.flutter.dev/flutter/material/TextField/autofillHints.html, https://api.flutter.dev/flutter/services/AutofillHints-class.html, https://developer.apple.com/design/human-interface-guidelines/virtual-keyboards#Best-practices

### Back works with gestures, and predictive back [not scanned]

**Slop:** `WillPopScope`, a fade route that drops the iOS back swipe, or a screen that swaps its body from state.

```dart
WillPopScope(onWillPop: () async => confirmLeave(), child: form)
Navigator.of(context).push(PageRouteBuilder(pageBuilder: (_, __, ___) => const Detail(),
    transitionsBuilder: (_, a, __, child) => FadeTransition(opacity: a, child: child)));
```

**Fix:**

```dart
PopScope(
  canPop: !hasChanges,
  onPopInvokedWithResult: (didPop, result) async {
    if (didPop) return;
    if (await confirmLeave() && context.mounted) Navigator.of(context).pop(result);
  },
  child: form,
)
Navigator.of(context).push(MaterialPageRoute(builder: (_) => const Detail()));
```

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<application android:enableOnBackInvokedCallback="true" ...>
```

**Why:** Flutter: "On iOS, an edge swipe gesture can be used to pop the top route", and `MaterialPageRoute` uses "a platform-adaptive transition"; a custom `PageRouteBuilder` gives up that platform behaviour. "PopScope replaces the deprecated WillPopScope widget and supports predictive back gestures." Predictive back on Android needs `android:enableOnBackInvokedCallback="true"`. Apple: "people expect to find a Back button in a top toolbar". Search for `WillPopScope`, `PageRouteBuilder` and `onWillPop`.
Source: https://docs.flutter.dev/ui/adaptive-responsive/platform-adaptations, https://api.flutter.dev/flutter/material/MaterialPageRoute-class.html, https://docs.flutter.dev/platform-integration/android/predictive-back, https://developer.apple.com/design/human-interface-guidelines/gestures

---

## Color

### Colors come from the ColorScheme [hardcoded-color]

**Slop:**

```dart
Container(
  color: const Color(0xFF6C63FF),
  child: const Text('Pro', style: TextStyle(color: Colors.white)),
)
```

**Fix:**

```dart
final cs = Theme.of(context).colorScheme;
Container(
  color: cs.primaryContainer,
  child: Text('Pro', style: TextStyle(color: cs.onPrimaryContainer)),
)
```

**Why:** "Material components typically depend exclusively on the colorScheme and textTheme", and the themes cookbook reads `Theme.of(context).colorScheme.primary` in widgets. Roles come in pairs (`primary`/`onPrimary`), which keeps contrast right in light and dark. The scanner skips token files (`theme.dart`, `colors.dart`, `palette`, `tokens`, `lib/theme/`) and flags `Color(0x...)`, `Color.fromARGB`, `Color.fromRGBO` and every `Colors.*` except `Colors.transparent` elsewhere.
Source: https://api.flutter.dev/flutter/material/ThemeData-class.html, https://docs.flutter.dev/cookbook/design/themes, https://developer.apple.com/design/human-interface-guidelines/dark-mode#Dark-Mode-colors

### Light and dark theme that follow the system [no-dark-mode]

**Slop:** only a light theme, or `ThemeMode.light` forced.

```dart
MaterialApp(
  theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple)),
  home: const Home(),
)
```

**Fix:**

```dart
MaterialApp(
  theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: brand)),
  darkTheme: ThemeData(
    colorScheme: ColorScheme.fromSeed(seedColor: brand, brightness: Brightness.dark),
  ),
  home: const Home(),
) // themeMode stays at its default, ThemeMode.system
```

**Why:** `themeMode` "Determines which theme will be used by the application if both theme and darkTheme are provided", and "The default value is ThemeMode.system." Apple: people "generally expect all apps and games to respect their preference" and "Avoid offering an app-specific appearance setting." The scanner reports once per project when nothing uses `darkTheme:`, `Brightness.dark`, `platformBrightnessOf`, `MediaQuery.of(context).platformBrightness` or `CupertinoDynamicColor`. A forced `themeMode: ThemeMode.light` next to a `darkTheme` is not flagged; search for it.
Source: https://api.flutter.dev/flutter/material/MaterialApp/themeMode.html, https://api.flutter.dev/flutter/material/MaterialApp/darkTheme.html, https://developer.apple.com/design/human-interface-guidelines/dark-mode#Best-practices

### Keep Material 3 [material-2-theme]

**Slop:**

```dart
ThemeData(useMaterial3: false, primarySwatch: Colors.blue)
```

**Fix:**

```dart
ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: brand))
```

**Why:** `useMaterial3`: "This flag is true by default." With it, ThemeData uses Material 3 defaults for color, typography and splash. `primarySwatch` is an M2-era API. Switching to M3 changes component shapes and spacing, so check every screen after this change. The scanner flags `useMaterial3: false`; `primarySwatch` is not scanned.
Source: https://api.flutter.dev/flutter/material/ThemeData/useMaterial3.html

### No default AI purple [default-ai-accent]

**Slop:** the `flutter create` seed left in place, or a stock purple.

```dart
ColorScheme.fromSeed(seedColor: Colors.deepPurple)
const accent = Color(0xFF6C63FF);
```

**Fix:**

```dart
// lib/theme/colors.dart: a color chosen for this product, defined once
const brand = Color(0xFF0A7C66);
ColorScheme.fromSeed(seedColor: brand)
```

The value above is a placeholder. Ask the user for a brand color; if you propose one, say it is a proposal.

**Why:** `seedColor: Colors.deepPurple` is the `flutter create` default, a strong sign of an unchanged template. Tailwind indigo, violet and purple 400 to 600, `#667EEA`, `#764BA2` and `#6C63FF` are what generated apps pick when nobody chose a color. The scanner flags `Color(0x...)` literals matching `#6366F1 #4F46E5 #818CF8 #8B5CF6 #7C3AED #A78BFA #A855F7 #9333EA #C084FC #667EEA #764BA2 #6C63FF #6C5CE7 #7F5AF0`, including in token files. `Colors.deepPurple` is only reported as `hardcoded-color`.
Source: handfeel judgement, see docs/slop-catalog.md

### Gradients only for artwork [purple-gradient, gradient-overuse]

**Slop:** gradient backgrounds on the screen, cards and buttons.

```dart
Container(
  decoration: const BoxDecoration(
    gradient: LinearGradient(colors: [Color(0xFF667EEA), Color(0xFF764BA2)]),
  ),
  child: const Text('Daily goal', style: TextStyle(color: Colors.white70)),
)
```

**Fix:**

```dart
final cs = Theme.of(context).colorScheme;
Card(
  color: cs.surfaceContainerHigh,
  child: Padding(
    padding: const EdgeInsets.all(16),
    child: Text('Daily goal', style: TextStyle(color: cs.onSurface)),
  ),
)
```

Keep one or two gradients for brand moments or artwork if the app relies on them. Check text contrast at both ends of any gradient that stays.

**Why:** Strong color should mark the few things a user acts on. No Flutter or Apple doc forbids gradients; the HIG says "Apply color sparingly" and "Refrain from adding color to the background of multiple controls." `gradient-overuse` reports every `LinearGradient(`, `RadialGradient(` and `SweepGradient(` after two free ones per project. `purple-gradient` reports gradients with a stop in the indigo to violet band (hue 235 to 295), from `Color(0x...)` literals or theme constants.
Source: handfeel judgement, see docs/slop-catalog.md. Related: https://developer.apple.com/design/human-interface-guidelines/color#Liquid-Glass-color

### Glass belongs to bars, not content [glassmorphism]

**Slop:** a blurred, translucent card per list item.

```dart
ListView.builder(
  itemBuilder: (_, i) => ClipRRect(
    borderRadius: BorderRadius.circular(24),
    child: BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
      child: Container(color: Colors.white.withOpacity(0.15), child: tiles[i]),
    ),
  ),
)
```

**Fix:**

```dart
ListView.builder(
  itemCount: tiles.length,
  itemBuilder: (context, i) => Card(
    color: Theme.of(context).colorScheme.surfaceContainerHigh,
    child: tiles[i],
  ),
)
```

If a blurred bar stays, clip it (`ClipRect`) so the filter covers only the bar.

**Why:** `BackdropFilter`: "This effect is relatively expensive, especially if the filter is non-local, such as a blur", and without a clip it applies to "all the area within its parent or ancestor widget's clip". Apple: "Don't use Liquid Glass in the content layer." The scanner flags every `BackdropFilter(` (one free per project) and `Colors.white.withOpacity(x)` or `Colors.white.withValues(alpha: x)` with x from 0.04 to 0.35.
Source: https://api.flutter.dev/flutter/widgets/BackdropFilter-class.html, https://docs.flutter.dev/perf/best-practices, https://developer.apple.com/design/human-interface-guidelines/materials#Liquid-Glass

### Dim with color, not the Opacity widget [not scanned]

**Slop:**

```dart
Opacity(opacity: 0.6, child: Text('Last synced 2m ago'))
```

**Fix:**

```dart
Text(
  'Last synced 2m ago',
  style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
)
// animated fades: AnimatedOpacity or FadeTransition
```

**Why:** "Avoid using the `Opacity` widget, and particularly avoid it in an animation." For text and simple shapes "it's usually faster to just draw them with a semitransparent color." A theme role also keeps contrast checked in both modes, which a 0.6 opacity over an unknown background does not. Text needs 4.5:1 against its background (3:1 for large text). Search for `Opacity(` that is not `AnimatedOpacity`.
Source: https://docs.flutter.dev/perf/best-practices, https://developer.android.com/guide/topics/ui/accessibility/apps

---

## Type

### Text styles from the textTheme [type-outside-scale, type-scale-sprawl]

**Slop:** a new `TextStyle` with a literal size for each label.

```dart
const Text('Good morning', style: TextStyle(fontSize: 30, fontWeight: FontWeight.w900))
Text(subtitle, style: const TextStyle(fontSize: 13.5, color: Colors.grey))
```

**Fix:**

```dart
final tt = Theme.of(context).textTheme;
Text('Good morning', style: tt.headlineMedium)
Text(subtitle, style: tt.bodySmall?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant))
```

To change sizes or the font family app-wide, edit `ThemeData.textTheme` once.

**Why:** Material components "depend exclusively on the colorScheme and textTheme", and the cookbook uses `Theme.of(context).textTheme.bodyMedium`. The Material 3 scale names the roles (`displayLarge` to `labelSmall`). `type-outside-scale` flags every `fontSize: <number>` outside token files. `type-scale-sprawl` collects distinct `fontSize` values across the project and, above 8, reports each at its first use.
Source: https://api.flutter.dev/flutter/material/ThemeData-class.html, https://docs.flutter.dev/cookbook/design/themes, https://developer.android.com/develop/ui/compose/designsystems/material3

### Let text scale with the system setting [font-scaling-disabled]

**Slop:** text scaling pinned app-wide.

```dart
MaterialApp(
  builder: (ctx, child) => MediaQuery(
    data: MediaQuery.of(ctx).copyWith(textScaler: TextScaler.noScaling),
    child: child!,
  ),
)
```

**Fix:**

```dart
MaterialApp(
  builder: (ctx, child) => MediaQuery.withClampedTextScaling(maxScaleFactor: 2.0, child: child!),
)
```

Then fix what breaks at large sizes: let rows wrap, remove fixed heights around `Text`.

**Why:** `textScaleFactor` was deprecated "In preparation for adopting the Android 14 nonlinear font scaling feature". Flutter: "The UI should remain legible and usable at very large scale factors for text size and display scaling." The scanner flags `TextScaler.noScaling`, `TextScaler.linear(1)` / `TextScaler.linear(1.0)` and `textScaleFactor: 1` / `textScaleFactor: 1.0`.
Source: https://docs.flutter.dev/release/breaking-changes/deprecate-textscalefactor, https://docs.flutter.dev/ui/accessibility-and-internationalization/accessibility, https://api.flutter.dev/flutter/painting/TextScaler-class.html

### Layouts that survive the largest text size [not scanned]

**Slop:** fixed heights and single-line rows around text.

```dart
SizedBox(height: 56, child: Row(children: [Text(title, maxLines: 1), const Spacer(), Text(amount)]))
```

**Fix:**

```dart
ConstrainedBox(
  constraints: const BoxConstraints(minHeight: 56),
  child: Wrap(
    alignment: WrapAlignment.spaceBetween,
    spacing: Space.sm,
    children: [Text(title), Text(amount)],
  ),
)
// or ListTile, which grows with its text
```

**Why:** Flutter: "The UI should remain legible and usable at very large scale factors for text size and display scaling." Android 14 "supports font scaling up to 200%", and Apple asks: "Make sure your app's layout adapts to all font sizes." Test at the largest setting; look for `SizedBox(height:` and `Container(height:` around `Text`, and `maxLines: 1` on titles.
Source: https://docs.flutter.dev/ui/accessibility-and-internationalization/accessibility, https://developer.android.com/about/versions/14/features#non-linear-font-scaling, https://developer.apple.com/design/human-interface-guidelines/typography#Supporting-Dynamic-Type

---

## Icons

### Icons, not emoji [emoji-as-icon]

**Slop:** an emoji as a tab or button icon.

```dart
const NavigationDestination(icon: Text('\u{1F3E0}'), label: 'Home') // house emoji
Text('\u{1F525} Streak') // fire emoji as the streak icon
```

**Fix:**

```dart
const NavigationDestination(
  icon: Icon(Icons.home_outlined),
  selectedIcon: Icon(Icons.home),
  label: 'Home',
)
Row(children: [Icon(Icons.local_fire_department, color: cs.primary), const Text('Streak')])
```

Material `Icons` ship with Flutter. For iOS-styled icons use `CupertinoIcons`; its API page says "make sure you add a dependency on cupertino_icons in your project's pubspec.yaml file" (`flutter create` adds it).

**Why:** Emoji render differently per OS and vendor, ignore the theme color, and read as placeholder art. Apple asks that interface icons "use a consistent size, level of detail, stroke thickness (or weight), and perspective"; no Flutter or Apple doc mentions emoji. The scanner flags string literals made of one to three emoji; five or more in a row are treated as content (a reaction bar or picker) and skipped. An emoji inside a longer string, like the second slop line, is not scanned.
Source: handfeel judgement, see docs/slop-catalog.md. Related: https://developer.apple.com/design/human-interface-guidelines/icons#Best-practices

### Labels on icon-only controls [icon-button-no-label]

**Slop:**

```dart
IconButton(onPressed: share, icon: const Icon(Icons.ios_share))
GestureDetector(onTap: share, child: const Icon(Icons.ios_share))
Image.network(avatarUrl)
```

**Fix:**

```dart
IconButton(onPressed: share, icon: const Icon(Icons.ios_share), tooltip: 'Share')
Semantics(button: true, label: 'Share', child: InkWell(onTap: share, child: shareIcon))
Image.network(avatarUrl, semanticLabel: "$name's avatar")
// decorative: Image.asset('assets/blob.png', excludeFromSemantics: true)
```

**Why:** `tooltip` is "Text that describes the action that will occur when the button is pressed." "if your app needs something different, it can be customized using the `Semantics` widget." `labeledTapTargetGuideline` "Checks that touch targets with a tap or long press action are labeled", so it can go in the same widget test as the tap target check. The scanner flags every `IconButton` (including `.filled`, `.outlined`, `.filledTonal`) without `tooltip:`. Unlabeled `GestureDetector`/`InkWell` icons and images without `semanticLabel` are not scanned.
Source: https://api.flutter.dev/flutter/material/IconButton-class.html, https://docs.flutter.dev/ui/accessibility/assistive-technologies, https://docs.flutter.dev/ui/accessibility/accessibility-testing

---

## Spacing

### Spacing on a 4/8 grid [off-grid-spacing]

**Slop:**

```dart
Padding(padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10), child: row)
const SizedBox(height: 14)
```

**Fix:**

```dart
// lib/theme/space.dart
abstract final class Space {
  static const double xs = 4, sm = 8, md = 12, lg = 16, xl = 24, xxl = 32;
}

Padding(padding: const EdgeInsets.symmetric(horizontal: Space.lg, vertical: Space.sm), child: row)
const SizedBox(height: Space.md)
```

`abstract final class` needs Dart 3; on Dart 2 use a plain `class` with a private constructor. Round to the nearest step and check the screen still looks right; do not redesign the layout.

**Why:** A fixed scale makes rows and edges line up across screens. The scanner reads numbers in `EdgeInsets.all/symmetric/only/fromLTRB/fromSTEB`, standalone `SizedBox(height:)`/`SizedBox(width:)`, and `spacing`, `runSpacing`, `mainAxisSpacing`, `crossAxisSpacing`; 0, 1, 2 and multiples of 4 are on the grid. It allows three distinct off-grid values per project and then reports each at its first use.
Source: handfeel judgement, see docs/slop-catalog.md. The scanner also links https://developer.android.com/design/ui/mobile/guides/layout-and-content/grids-and-units and https://developer.apple.com/design/human-interface-guidelines/layout; the research for this file did not capture a quote from them.

---

## Platform details

### Adaptive widgets per platform [no-platform-adaptation]

**Slop:** Material controls on iOS, or Cupertino controls on Android.

```dart
CupertinoSwitch(value: on, onChanged: setOn) // on every platform
showDialog(context: context, builder: (_) => AlertDialog(title: const Text('Delete habit?'), actions: actions));
const Center(child: CircularProgressIndicator())
```

**Fix:**

```dart
Switch.adaptive(value: on, onChanged: setOn)
showAdaptiveDialog(context: context, builder: (_) => AlertDialog.adaptive(title: const Text('Delete habit?'), actions: actions));
const CircularProgressIndicator.adaptive()
```

**Why:** "Adaptive constructors substitute the corresponding Cupertino components when the app is run on an iOS device". `showAdaptiveDialog` "Displays either a Material or Cupertino dialog depending on platform." Material everywhere can be a deliberate brand choice; ask before changing it. The scanner reports once per project when nothing uses `.adaptive`, `Adaptive(`, `Cupertino*`, `Platform.isIOS`/`isAndroid`, `defaultTargetPlatform`, `TargetPlatform.` or `.platform`.
Source: https://docs.flutter.dev/ui/adaptive-responsive/platform-adaptations, https://api.flutter.dev/flutter/material/showAdaptiveDialog.html, https://api.flutter.dev/flutter/material/CircularProgressIndicator/CircularProgressIndicator.adaptive.html

### Branch on the theme platform, not dart:io [not scanned]

**Slop:**

```dart
import 'dart:io';

final nav = Platform.isIOS ? CupertinoTabBar(items: items) : NavigationBar(destinations: destinations);
```

**Fix:**

```dart
final isCupertino = switch (Theme.of(context).platform) {
  TargetPlatform.iOS || TargetPlatform.macOS => true,
  _ => false,
};
final nav = isCupertino
    ? CupertinoTabBar(items: items, currentIndex: index, onTap: select)
    : NavigationBar(destinations: destinations, selectedIndex: index, onDestinationSelected: select);
```

**Why:** `ThemeData.platform` is "The platform the material widgets should adapt to target", and widgets "should use this getter (via Theme.of) to determine the current platform". `dart:io` `Platform` is for cases where the real host must be known, such as before a system API call; it also breaks on web. Search for `Platform.isIOS` and `Platform.isAndroid` in files that import `package:flutter/`.
Source: https://api.flutter.dev/flutter/material/ThemeData/platform.html

### Lazy lists for long or unbounded data [not scanned]

**Slop:**

```dart
SingleChildScrollView(child: Column(children: txs.map((t) => TxTile(t)).toList()))
```

**Fix:**

```dart
ListView.builder(itemCount: txs.length, itemBuilder: (context, i) => TxTile(txs[i]))
// with dividers: ListView.separated(..., separatorBuilder: (_, __) => const Divider(height: 1))
```

**Why:** `ListView.builder` is "appropriate for list views with a large (or infinite) number of children" because "the builder is called only for those children that are actually visible". The default constructor is for "a small number of children". Short fixed content can stay a `Column`. Search for `children: x.map(` inside `ListView` or `Column`, and `SingleChildScrollView(child: Column(` with a `.map(`.
Source: https://api.flutter.dev/flutter/widgets/ListView-class.html, https://docs.flutter.dev/perf/best-practices

### Pull to refresh, not a refresh button [not scanned]

**Slop:**

```dart
AppBar(actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: reload)])
```

**Fix:**

```dart
RefreshIndicator.adaptive(
  onRefresh: reload, // Future<void> Function()
  child: ListView.builder(itemCount: items.length, itemBuilder: (context, i) => ItemTile(items[i])),
)
```

**Why:** `RefreshIndicator` is the widget for the Material swipe-to-refresh idiom, and `RefreshIndicator.adaptive` picks the iOS style on iOS and macOS. Apple also asks apps to "Perform automatic content updates" so people do not start every refresh. The child must be scrollable, also when the list is short.
Source: https://api.flutter.dev/flutter/material/RefreshIndicator-class.html, https://developer.apple.com/design/human-interface-guidelines/progress-indicators#Refresh-content-controls

### Loading states show content shapes [not scanned]

**Slop:** the whole screen swaps to a centered spinner.

```dart
if (loading) return const Center(child: CircularProgressIndicator());
```

**Fix:**

```dart
if (loading) {
  return ListView.builder(itemCount: 6, itemBuilder: (_, __) => const TxTileSkeleton());
}
// TxTileSkeleton: the same layout as TxTile, filled with cs.surfaceContainerHighest blocks

// remote images: a placeholder while loading and a fallback on error
FadeInImage.assetNetwork(
  placeholder: 'assets/images/avatar_placeholder.png', // a small asset the app ships
  image: url,
  imageErrorBuilder: (_, __, ___) => const Icon(Icons.broken_image_outlined),
)
```

Keep showing the last data during a refresh. For a short wait on a button action, put `CircularProgressIndicator.adaptive()` inside the button.

**Why:** Flutter's cookbook: "the most important thing is to show your users that loading is taking place", and one popular approach is "a chrome color with a shimmer animation over the shapes that approximate the type of content that is loading." Apple: "Show something as soon as possible." The cookbook does not say "instead of a spinner"; that part is the HIG's guidance. `FadeInImage` "shows a placeholder image while the target image is loading", and `errorBuilder` / `imageErrorBuilder` replace a failed image instead of reporting the exception. Search for `return Center(child: CircularProgressIndicator`, the same inside `Scaffold(body:`, and `Image.network(` with no `loadingBuilder` or `errorBuilder`.
Source: https://docs.flutter.dev/cookbook/effects/shimmer-loading, https://developer.apple.com/design/human-interface-guidelines/loading#Best-practices, https://api.flutter.dev/flutter/widgets/FadeInImage-class.html, https://api.flutter.dev/flutter/widgets/Image/errorBuilder.html

### Empty and error states that say what to do [not scanned]

**Slop:** a lone "No data" or the raw exception text.

```dart
if (snapshot.hasError) return Text(snapshot.error.toString());
if (items.isEmpty) return const Center(child: Text('No data'));
```

**Fix:**

```dart
if (snapshot.hasError) {
  return StateMessage(
    title: "Couldn't load transactions",
    body: 'Check your connection and try again.',
    action: FilledButton(onPressed: retry, child: const Text('Try again')),
  );
}
if (items.isEmpty) {
  return StateMessage(
    title: 'No transactions',
    body: 'Transactions you add show up here.',
    action: FilledButton(onPressed: add, child: const Text('Add transaction')),
  );
}
```

`StateMessage` is a small widget you write once. Keep the app's own wording.

**Why:** Apple: "Provide clear next steps on any blank screens", and for errors: "display it as close to the problem as possible, avoid blame, and be clear about what someone can do to fix it." Search for `hasError`, `isEmpty` and `error.toString()` in widgets.
Source: https://developer.apple.com/design/human-interface-guidelines/writing#Best-practices

### Respect reduced motion [not scanned]

**Slop:** a looping decorative animation that ignores the system setting.

```dart
_ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))
  ..repeat(reverse: true);
```

**Fix:**

```dart
@override
void didChangeDependencies() {
  super.didChangeDependencies();
  if (MediaQuery.disableAnimationsOf(context)) {
    _ctrl.stop();
  } else if (!_ctrl.isAnimating) {
    _ctrl.repeat(reverse: true);
  }
}
```

Read `MediaQuery` in `didChangeDependencies` or `build`, not in `initState`.

**Why:** `disableAnimations`: "Whether the platform is requesting that animations be disabled or reduced as much as possible." Apple: with Reduce Motion on, apps should reduce "automatic and repetitive animations, including zooming, scaling, and peripheral motion." Search for `.repeat(` on controllers and `Lottie.` with `repeat: true` in files with no `disableAnimations`.
Source: https://api.flutter.dev/flutter/widgets/MediaQueryData/disableAnimations.html, https://api.flutter.dev/flutter/widgets/MediaQuery/disableAnimationsOf.html, https://developer.apple.com/design/human-interface-guidelines/accessibility#Cognitive

### Start and end, not left and right [not scanned]

Only if the app ships, or plans to ship, a right-to-left language.

**Slop:**

```dart
const EdgeInsets.only(left: 16, right: 8)
const Icon(Icons.chevron_right)
```

**Fix:**

```dart
const EdgeInsetsDirectional.only(start: 16, end: 8)
Icon(Icons.adaptive.arrow_forward) // or an Icon with matchTextDirection: true
```

**Why:** `EdgeInsetsDirectional` pads "from the left in TextDirection.ltr text and padding from the right in TextDirection.rtl text without having to be aware of the current text direction." Apple: "Flip controls that show progress from one value to another." Search for `EdgeInsets.only(left:` and `Alignment.centerLeft` in apps with RTL locales.
Source: https://api.flutter.dev/flutter/painting/EdgeInsetsDirectional-class.html, https://developer.apple.com/design/human-interface-guidelines/right-to-left

### Native launch screen, no timed splash route [not scanned]

**Slop:** a `SplashScreen` widget with a gradient, logo and tagline, shown on a timer before the first real screen.

```dart
Future.delayed(const Duration(seconds: 3), () => Navigator.pushReplacementNamed(context, '/home'));
```

**Fix:** remove the timed route. Configure the native launch screens (Android: `LaunchTheme` in `res/values/styles.xml`; iOS: `LaunchScreen.storyboard`) with a plain background and the app icon, and show the first screen as soon as it can render.

**Why:** Apple: a launch screen "isn't an opportunity for artistic expression", "Avoid including text on your launch screen", and "Don't advertise." Android 12 and later launch with "a splash screen showing your app icon", and Android asks apps with a custom splash to "migrate your app to the SplashScreen compat library". A second splash drawn in Flutter only adds a wait. Flutter documents both native screens. Do not remove a splash that does real startup work; shorten it to that work.
Source: https://developer.apple.com/design/human-interface-guidelines/launching#Launch-screens, https://developer.android.com/guide/topics/ui/splash-screen, https://docs.flutter.dev/platform-integration/android/splash-screen, https://docs.flutter.dev/platform-integration/ios/launch-screen

---

## Checklist before you report

- You confirmed the Flutter and Dart SDK versions, the app shell and the theme files, and every version-dependent fix matches them.
- Every finding has `file:line`, the rule title, the scanner id (or "not scanned") and a one-line fix.
- You ran `npx handfeel scan` (or read its output) and every scanner finding is fixed, reported, or explained as a false positive.
- Findings the scanner cannot see (keyboard, input types and autofill, back navigation, `Opacity`, large text, `dart:io` platform checks, lists, pull to refresh, loading and images, empty and error states, reduced motion, RTL, launch screen, action-list dialogs) were checked by reading the screens.
- New colors, text styles and spacing go into the theme, not into widgets.
- Light and dark themes were both considered for every color change.
- Each fix touches one screen or one shared widget and can be reviewed alone.
- Any new package is named, with the reason, and added with `flutter pub add`.
- `flutter analyze` reports no new issues, and existing widget tests still pass if you could run them.
- You state which platforms you actually ran the app on. If you only read code, say so.

## Do not

- Do not change features, content, copy, data flow or navigation structure beyond what a rule requires. Moving a drawer to a bottom bar changes navigation, so propose it and wait for approval in audit mode.
- Do not add a package without saying so, and do not replace the app's state management, router or theming approach to fix a style issue.
- Do not invent a brand color, font or logo. Propose it and label it as a proposal.
- Do not remove a gradient, blur or color that is clearly part of the brand without asking; reduce it to where it belongs.
- Do not switch a deliberately Material-only or Cupertino-only design to adaptive widgets without asking.
- Do not claim something was tested on iOS or Android if it was not run there.
- Do not quote guidelines that are not in this file or invent URLs.
- Do not silence scanner findings to raise the score. If a finding is deliberate, leave the code, explain why, and only then add `// handfeel-ignore-next-line <rule-id>`.
