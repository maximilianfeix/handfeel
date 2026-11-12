# handfeel reference: Jetpack Compose (Android)

Load this file when the app's UI is written in Jetpack Compose with Material 3. It lists what makes a generated Android app look generated, and what to write instead. In audit mode, report each finding with `file:line`, the rule title and a one-line fix, and do not edit code. In fix mode, work screen by screen in small, reviewable changes, and re-run `npx handfeel scan` after each screen. Scanner ids in brackets are what `npx handfeel scan` reports. If you could not build the app or run it on an emulator or device, say so clearly in your report.

## Detect

Confirm the stack before you apply anything:

- `build.gradle.kts` / `build.gradle` with `buildFeatures { compose = true }` (or the Compose compiler plugin) and `androidx.compose:compose-bom` in the dependencies or in `gradle/libs.versions.toml`.
- `androidx.compose.material3` imports. If the screens import `androidx.compose.material.*` (Material 2), report that first; the samples below assume Material 3.
- `compileSdk`, `targetSdk` and `minSdk` in the app module. Note the material3 and compose-ui versions that the BOM resolves to.
- Compose Multiplatform or XML views mixed in: the rules still apply to the Compose screens only.

Advice that depends on the SDK or library version:

| Condition | What changes |
|---|---|
| `targetSdk` 35 on Android 15 devices | Edge-to-edge is the default; `setStatusBarColor`, `setNavigationBarColor`, `setDecorFitsSystemWindows` are deprecated and disabled. |
| `targetSdk` 36 | The edge-to-edge opt-out is removed. On Android 16 devices `onBackPressed` is not called and predictive back animations are on by default. |
| `minSdk` below 31 | Dynamic color needs a `Build.VERSION.SDK_INT >= 31` check; `Modifier.blur` is ignored below Android 12. |
| compose-ui below 1.8.0 | `HapticFeedbackType.Confirm`, `Reject`, `ToggleOn`, `ToggleOff` are not available; use `LongPress` and `TextHandleMove`. |
| M3 Expressive (newer material3) | The navigation drawer is being deprecated; `LoadingIndicator` replaces most indeterminate circular indicators. Use these APIs only if the project's material3 version has them. |

## Rules

Work through the rules in this order: Touch, Structure, Color, Type, Icons, Spacing, Platform details.

### Touch targets of at least 48x48 dp [touch-target-too-small]

**Slop:** A 20 dp icon with `.clickable`, so the touch target is 20 dp.

```kotlin
Icon(Icons.Default.Close, null, Modifier.size(20.dp).clickable { onClose() })
```

**Fix:** Use `IconButton`, or reserve 48 dp before the size modifier.

```kotlin
IconButton(onClick = onClose) {
    Icon(Icons.Default.Close, contentDescription = stringResource(R.string.close))
}
// custom view:
Modifier.clickable { onClose() }.minimumInteractiveComponentSize().size(20.dp)
```

**Why:** Android recommends "a focusable area, or touch target size, of at least 48dpx48dp". `minimumInteractiveComponentSize` "reserves at least 48 dp of layout space in each dimension"; put it before any size modifier. Material components already do this.
Source: https://developer.android.com/guide/topics/ui/accessibility/apps, https://developer.android.com/develop/ui/compose/accessibility/api-defaults, spec https://m3.material.io/foundations/accessible-design/overview

### Clickable with a ripple, not raw tap detection [no-press-feedback]

**Slop:** Cards opened through `pointerInput { detectTapGestures }`, or `clickable` with the ripple removed.

```kotlin
Box(Modifier.pointerInput(Unit) { detectTapGestures { open() } }) { ArticleCard() }
Box(Modifier.clickable(
    interactionSource = remember { MutableInteractionSource() },
    indication = null
) { open() })
```

**Fix:** A Material component with `onClick`, or `clickable` with the default indication.

```kotlin
Card(onClick = open) { ArticleContent() }
// or
Modifier.clickable(onClickLabel = stringResource(R.string.open_article)) { open() }
```

**Why:** Android's interaction docs contrast "Buttons that always appear enabled, with no press ripple" with "Buttons with press ripples": the press change "lets the user know that they touched the button". `clickable` and `toggleable` also "merge their children's semantics by default", which `detectTapGestures` does not give you.
Source: https://developer.android.com/develop/ui/compose/touch-input/user-interactions/handling-interactions, https://developer.android.com/develop/ui/compose/accessibility/api-defaults

### Semantic haptics, not raw vibration [no-haptics]

**Slop:** No haptics at all, or a loud `Vibrator` one-shot for UI feedback.

```kotlin
val v = context.getSystemService(Vibrator::class.java)
v.vibrate(VibrationEffect.createOneShot(200, 255))
```

**Fix:** `LocalHapticFeedback` with a constant that names the event.

```kotlin
val haptics = LocalHapticFeedback.current
Button(onClick = {
    if (save()) haptics.performHapticFeedback(HapticFeedbackType.Confirm)   // compose-ui 1.8.0+
    else haptics.performHapticFeedback(HapticFeedbackType.Reject)
}) { Text(stringResource(R.string.save)) }
```

**Why:** Android recommends going through a `View` because it "doesn't require the `VIBRATE` permission", and says "We strongly discourage using older `Vibrator` methods employing `createOneshot` or `createWaveform`". `Confirm` is meant to "signal the confirmation or successful completion of a user interaction". Use haptics on meaningful moments only. The scanner reports a project with no haptics at all; raw vibration is for you to spot.
Source: https://developer.android.com/develop/ui/views/haptics/haptic-feedback, https://developer.android.com/reference/kotlin/androidx/compose/ui/hapticfeedback/HapticFeedbackType

### NavigationBar on phones, not a hamburger drawer [hamburger-navigation]

**Slop:** Three to five top-level screens hidden in a `ModalNavigationDrawer` behind a menu icon.

```kotlin
ModalNavigationDrawer(drawerContent = { DrawerItems(home, stats, profile) }) {
    Scaffold(topBar = {
        TopAppBar(title = { Text("Habits") }, navigationIcon = {
            IconButton({ open() }) { Icon(Icons.Default.Menu, null) }
        })
    }) { inner -> Content(Modifier.padding(inner)) }
}
```

**Fix:** A bottom `NavigationBar` (or `NavigationSuiteScaffold` to adapt between bar, rail and drawer by window size).

```kotlin
Scaffold(bottomBar = {
    NavigationBar {
        dests.forEach { d ->
            NavigationBarItem(selected = d == current, onClick = { navigate(d) },
                icon = { Icon(d.icon, contentDescription = null) },
                label = { Text(stringResource(d.label)) })
        }
    }
}) { inner -> NavHost(navController, startDestination = Home, Modifier.padding(inner)) { /* destinations */ } }
```

**Why:** Use navigation bars for "Three to five destinations of equal importance" and "Compact window sizes". "`NavigationDrawer` is used for medium-to-large size tablets", and "The navigation drawer is being deprecated in the Material 3 expressive update". The icon in a `NavigationBarItem` can be `null` because the label describes it.
Source: https://developer.android.com/develop/ui/compose/components/navigation-bar, https://developer.android.com/develop/ui/compose/designsystems/material3, https://github.com/material-components/material-components-android/blob/master/docs/components/NavigationDrawer.md

### Bottom sheets for choices, snackbars for status, dialogs for decisions [not scanned]

**Slop:** An `AlertDialog` used as a menu, and a `Toast` for "Item deleted".

```kotlin
AlertDialog(onDismissRequest = {}, title = { Text("Choose") },
    text = { Column { Text("Edit"); Text("Share"); Text("Delete") } }, confirmButton = {})
Toast.makeText(context, "Item deleted", Toast.LENGTH_SHORT).show()
```

**Fix:** `ModalBottomSheet` with list items; a `Snackbar` with an undo action.

```kotlin
if (showActions) ModalBottomSheet(onDismissRequest = { showActions = false }) {
    ListItem(headlineContent = { Text(stringResource(R.string.edit)) },
        leadingContent = { Icon(Icons.Default.Edit, null) },
        modifier = Modifier.clickable { edit() })
}
scope.launch {
    val r = snackbarHostState.showSnackbar("Item deleted", actionLabel = "Undo")
    if (r == SnackbarResult.ActionPerformed) undo()
}
```

**Why:** Modal bottom sheets "are an alternative to inline menus and simple dialogs on mobile devices". "Dialogs are purposefully interruptive, so they should be used sparingly." Snackbars "shouldn't interrupt the user experience" and "can also offer the ability to perform an action, such as undoing an action". Pass the `SnackbarHostState` to `Scaffold(snackbarHost = …)`.
Source: https://developer.android.com/develop/ui/compose/components/bottom-sheets, https://github.com/material-components/material-components-android/blob/master/docs/components/BottomSheet.md, https://github.com/material-components/material-components-android/blob/master/docs/components/Dialog.md, https://github.com/material-components/material-components-android/blob/master/docs/components/Snackbar.md

### Edge-to-edge with insets, no system bar color hacks [missing-safe-area]

**Slop:** No `enableEdgeToEdge()`, a `Scaffold` that drops its padding, and code that paints the status bar.

```kotlin
window.statusBarColor = Color.parseColor("#6200EE")
WindowCompat.setDecorFitsSystemWindows(window, true)
setContent {
    Scaffold(topBar = { TopAppBar(title = { Text("Inbox") }) }) { _ -> Content() }
}
```

**Fix:** Go edge-to-edge and pass the insets to the content.

```kotlin
enableEdgeToEdge()
setContent {
    Scaffold(topBar = { TopAppBar(title = { Text("Inbox") }) }) { inner ->
        Content(Modifier.padding(inner))
    }
}
// without Scaffold: Modifier.safeDrawingPadding() / windowInsetsPadding(WindowInsets.safeDrawing)
```

**Why:** "Apps are edge-to-edge by default on devices running Android 15 if the app is targeting Android 15 (API level 35)", and for target SDK 36 "your app can't opt-out of going edge-to-edge". `Window#setStatusBarColor`, `setNavigationBarColor` and `setDecorFitsSystemWindows` are "deprecated and disabled" on Android 15. "Use `WindowInsets.safeDrawing` to protect content that shouldn't be drawn underneath any system UI." Also remove `windowOptOutEdgeToEdgeEnforcement` from themes.
Source: https://developer.android.com/about/versions/15/behavior-changes-15, https://developer.android.com/about/versions/16/behavior-changes-16, https://developer.android.com/develop/ui/compose/layouts/insets

### Keyboard insets, keyboard type and autofill [not scanned]

**Slop:** A chat or form whose bottom bar ends up behind the keyboard.

```kotlin
Column(Modifier.fillMaxSize()) {
    Messages(Modifier.weight(1f))
    Composer()
}
```

**Fix:** Pad for the IME, and set the keyboard type.

```kotlin
Column(Modifier.fillMaxSize().imePadding()) {
    Messages(Modifier.weight(1f))
    Composer()
}
OutlinedTextField(email, onValueChange = { email = it }, label = { Text("Email") },
    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
    modifier = Modifier.semantics { contentType = ContentType.EmailAddress })   // compose-ui 1.8.0+
OutlinedTextField(password, onValueChange = { password = it }, label = { Text("Password") },
    visualTransformation = PasswordVisualTransformation(),
    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
    modifier = Modifier.semantics { contentType = ContentType.Password })
```

**Why:** `WindowInsets.ime` describes "the amount of space on the bottom that the software keyboard occupies". With edge-to-edge enforced, the window does not shrink for the keyboard by itself, so the layout must apply the inset. If `Scaffold` padding already includes the IME inset, do not add it twice. For autofill, "set the ContentType semantics with the types that the field can accept"; `ContentType` was added in compose-ui 1.8.0. Use `ContentType.NewPassword` on sign-up, where "the system may suggest a strong password". The supported keyboard options are "capitalization autoCorrect keyboardType imeAction".
Source: https://developer.android.com/develop/ui/compose/layouts/insets, https://developer.android.com/develop/ui/compose/text/autofill, https://developer.android.com/develop/ui/compose/text/user-input

### Back handling with BackHandler and predictive back [not scanned]

**Slop:** `onBackPressed` overridden in the activity to close a sheet.

```kotlin
override fun onBackPressed() {
    if (sheetOpen) closeSheet() else super.onBackPressed()
}
```

**Fix:** Intercept back in the composable that owns the state.

```kotlin
BackHandler(enabled = sheetOpen) { closeSheet() }
// progress-aware animation: PredictiveBackHandler
```

**Why:** For apps targeting Android 16 on Android 16 devices, "`onBackPressed` is not called and `KeyEvent.KEYCODE_BACK` is not dispatched anymore." Android: "If you only need to intercept the back gesture without tracking progress, use `BackHandler`." `PredictiveBackHandler` needs "androidx.activity:activity:1.6.0 or higher", and Navigation Compose animates predictive back from "navigation-compose 2.8.0". "Intercepting back at the root activity (e.g. MainActivity.kt) disables the back-to-home animation", so enable a `BackHandler` only while there is something to close. `android:enableOnBackInvokedCallback="false"` in the manifest is a temporary opt-out; report it.
Source: https://developer.android.com/about/versions/16/behavior-changes-16, https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture, https://developer.android.com/develop/ui/compose/system/predictive-back-setup, https://developer.android.com/develop/ui/compose/system/predictive-back-progress

### Colors from the color scheme [hardcoded-color]

**Slop:** Hex literals and `Color.White` in screens.

```kotlin
Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF7C3AED))) {
    Text("Pro", color = Color.White)
}
```

**Fix:** Use color roles, and keep literals in `Color.kt` / `Theme.kt`.

```kotlin
Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
    Text("Pro", color = MaterialTheme.colorScheme.onPrimaryContainer)
}
```

**Why:** "You can access Material theme colors in your app via `MaterialTheme.colorScheme`", and "Use on-primary on top of primary, and on-primary-container on top of primary-container … to provide accessible contrast". A literal stays the same in dark theme and with dynamic color. The scanner skips theme and token files.
Source: https://developer.android.com/develop/ui/compose/designsystems/material3, spec https://m3.material.io/styles/color/roles

### Light and dark schemes, dynamic color [no-dark-mode]

**Slop:** Only a light scheme, so the app stays white at night.

```kotlin
MaterialTheme(colorScheme = lightColorScheme(primary = Purple500)) { App() }
```

**Fix:** Switch on the system setting and use dynamic color where it exists.

```kotlin
val dark = isSystemInDarkTheme()
val ctx = LocalContext.current
val scheme = when {
    Build.VERSION.SDK_INT >= 31 && dark -> dynamicDarkColorScheme(ctx)
    Build.VERSION.SDK_INT >= 31 -> dynamicLightColorScheme(ctx)
    dark -> DarkColors
    else -> LightColors
}
MaterialTheme(colorScheme = scheme) { App() }
```

**Why:** "To support light and dark themes, use `isSystemInDarkTheme()`." "Dynamic color is available on Android 12 and above … If not, you should fall back to using a custom light or dark `ColorScheme`." Dynamic color is optional for brand-led apps; a dark scheme is not. Do not add an in-app theme switch the owner did not ask for.
Source: https://developer.android.com/develop/ui/compose/designsystems/material3, spec https://m3.material.io/styles/color/dynamic-color/overview

### No default "AI purple" accent [default-ai-accent]

**Slop:** The seed or primary color is one of the stock values a model picks when nobody chose a brand color: Tailwind indigo/violet/purple 400-600 (`0xFF6366F1`, `0xFF7C3AED`, `0xFF8B5CF6` …), `#667EEA`, `#764BA2`, `#6C63FF`. The Android template's `Purple40`/`Purple80` left unchanged has the same effect.

```kotlin
val Primary = Color(0xFF7C3AED)
private val LightColors = lightColorScheme(primary = Primary)
```

**Fix:** Ask for the brand color, or use dynamic color until there is one. Define the brand color once in `Color.kt`.

```kotlin
val BrandPrimary = Color(0xFF0A7C66)   // placeholder: the owner picks it, with a matching onPrimary
private val LightColors = lightColorScheme(primary = BrandPrimary, onPrimary = BrandOnPrimary)
```

**Why:** These values are the most common accent in generated apps, so the app reads as generated before anyone uses it. This is handfeel judgement, not a Material rule. In fix mode, do not invent a brand color: propose one and flag it for the owner.
Source: handfeel judgement, see docs/slop-catalog.md

### Gradients for artwork, flat fills for surfaces [purple-gradient, gradient-overuse]

**Slop:** A violet-to-pink gradient behind the whole screen, on cards and on the main button.

```kotlin
Box(Modifier.fillMaxSize().background(
    Brush.verticalGradient(listOf(Color(0xFF7C3AED), Color(0xFFDB2777)))
)) { Dashboard() }
```

**Fix:** Surface roles for backgrounds, the primary role for the one main action.

```kotlin
Scaffold(containerColor = MaterialTheme.colorScheme.surface) { inner ->
    Dashboard(Modifier.padding(inner))
}
Button(onClick = start) { Text(stringResource(R.string.start)) }   // primary color
```

**Why:** No Android or Material page bans gradients; this is handfeel judgement. It rests on the color roles guidance and on text contrast: text over a gradient rarely keeps 4.5:1 across the whole fill. Gradients inside artwork, charts and illustrations are fine.
Source: handfeel judgement, see docs/slop-catalog.md. Related: https://developer.android.com/develop/ui/compose/designsystems/material3, https://developer.android.com/guide/topics/ui/accessibility/apps

### Tonal surfaces, not glass or heavy shadows [glassmorphism]

**Slop:** Frosted cards built from `Modifier.blur` and translucent white, or a 24 dp shadow on every card.

```kotlin
Card(Modifier.blur(20.dp).alpha(0.7f),
    colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.2f))) {
    Text("Balance", color = Color.White)
}
Box(Modifier.shadow(24.dp, RoundedCornerShape(24.dp)).background(Color.White)) { Row() }
```

**Fix:** Surface container roles and tonal elevation.

```kotlin
Card(colors = CardDefaults.cardColors(
    containerColor = MaterialTheme.colorScheme.surfaceContainerHigh)) {
    Text("Balance", style = MaterialTheme.typography.titleMedium)
}
Surface(tonalElevation = 2.dp) { Row() }
```

**Why:** `Modifier.blur` "is only supported on Android 12 and above. Attempts to use this Modifier on older Android versions will be ignored", and it "renders the corresponding composable into a separate graphics layer". "Material 3 represents elevation mainly using tonal color overlays."
Source: https://developer.android.com/reference/kotlin/androidx/compose/ui/draw/blur.modifier, https://developer.android.com/develop/ui/compose/designsystems/material3, spec https://m3.material.io/styles/elevation/overview

### Type scale roles, text in sp [type-outside-scale, type-scale-sprawl]

**Slop:** A literal size and weight on every `Text`, sometimes converted from dp so it no longer follows the font-size setting.

```kotlin
Text("Good morning, Alex", fontSize = 28.sp, fontWeight = FontWeight.ExtraBold)
Text("Total", fontSize = with(LocalDensity.current) { 18.dp.toSp() })
Text(caption, fontSize = 10.sp, color = Color.Gray)
```

**Fix:** Use `MaterialTheme.typography` roles and adjust the theme, not each `Text`.

```kotlin
Text("Good morning, Alex", style = MaterialTheme.typography.headlineMedium)
Text("Total", style = MaterialTheme.typography.titleMedium)
Text(caption, style = MaterialTheme.typography.labelSmall,
    color = MaterialTheme.colorScheme.onSurfaceVariant)
```

**Why:** M3 defines "display, headline, title, body, and label, with large, medium, and small sizes for each", read through `MaterialTheme.typography`. "The sp unit is the same size as a dp, by default, but it resizes based on the user's preferred text size. Never use sp for layout sizes." So `dp.toSp()` and `fontSize = N.dp` freeze text, and `N.sp` heights in layout grow with the font setting.
Source: https://developer.android.com/develop/ui/compose/designsystems/material3, https://developer.android.com/training/multiscreen/screendensities, spec https://m3.material.io/styles/typography/overview

### Layouts that survive 200% font size [not scanned]

**Slop:** fixed heights around text and single-line titles.

```kotlin
Row(Modifier.height(56.dp), verticalAlignment = Alignment.CenterVertically) {
    Text(title, maxLines = 1); Spacer(Modifier.weight(1f)); Text(amount)
}
```

**Fix:**

```kotlin
ListItem(headlineContent = { Text(title) }, trailingContent = { Text(amount) })   // grows with its text
// custom row: Modifier.heightIn(min = 56.dp) instead of height(56.dp), and let Text wrap
```

**Why:** "Starting in Android 14, the system supports font scaling up to 200%", and Android asks you to "perform UI testing with the maximum font size enabled (200%)". Text in `sp` grows; a `height` in `dp` around it does not. Look for `.height(` and `.size(` on containers of `Text`, and `maxLines = 1` on titles.
Source: https://developer.android.com/about/versions/14/features#non-linear-font-scaling, https://developer.android.com/training/multiscreen/screendensities

### Material icons, not emoji [emoji-as-icon]

**Slop:** Emoji as navigation icons, button icons and headings.

```kotlin
NavigationBarItem(selected = sel, onClick = go, icon = { Text("\uD83C\uDFE0") }, label = { Text("Home") })   // house emoji
Text("\uD83D\uDD25 Streak", style = MaterialTheme.typography.titleMedium)   // fire emoji
```

**Fix:** `Icons.*` from the Material icons library, or Material Symbols added as vector drawables. One set, one style.

```kotlin
NavigationBarItem(selected = sel, onClick = go,
    icon = { Icon(Icons.Default.Home, contentDescription = null) },
    label = { Text(stringResource(R.string.home)) })
Row(verticalAlignment = Alignment.CenterVertically) {
    Icon(painterResource(R.drawable.ic_local_fire_department), contentDescription = null)
    Spacer(Modifier.width(8.dp))
    Text(stringResource(R.string.streak), style = MaterialTheme.typography.titleMedium)
}
```

**Why:** No Android doc forbids emoji; this is handfeel judgement. Emoji ignore `LocalContentColor` and the theme, differ by device vendor, and do not match the icon weight of the rest of the UI. Emoji that are content (reactions, a mood picker, user text) stay.
Source: handfeel judgement, see docs/slop-catalog.md. Related: https://developer.android.com/develop/ui/compose/accessibility/api-defaults

### contentDescription on actionable icons [icon-button-no-label]

**Slop:** An icon-only button with `contentDescription = null`, or a hard-coded English description.

```kotlin
IconButton(onClick = onShare) { Icon(Icons.Default.Share, contentDescription = null) }
IconButton(onClick = onDelete) { Icon(Icons.Default.Delete, contentDescription = "Delete button") }
```

**Fix:** A localized description that names the action, `null` only for decoration.

```kotlin
IconButton(onClick = onShare) {
    Icon(Icons.Default.Share, contentDescription = stringResource(R.string.share))
}
Image(painterResource(R.drawable.hero_wave), contentDescription = null)   // decorative
```

**Why:** "Use a localized string, as it is visible to the user." Setting it to `null` says "that this element does not have associated actions or state". Android also says to avoid redundancy: "Submit", not "Submit button".
Source: https://developer.android.com/develop/ui/compose/accessibility/api-defaults, https://developer.android.com/guide/topics/ui/accessibility/apps, https://developer.android.com/develop/ui/compose/accessibility/key-steps

### Spacing on the grid, radii from the shape scale [off-grid-spacing]

**Slop:** `10.dp`, `14.dp`, `18.dp` next to 16 and 24, and a different `RoundedCornerShape` per component.

```kotlin
Column(verticalArrangement = Arrangement.spacedBy(18.dp)) {
    Card(Modifier.padding(14.dp), shape = RoundedCornerShape(28.dp)) { Body() }
    Button(onClick = go, shape = RoundedCornerShape(18.dp)) { Text("Go") }
    Box(Modifier.padding(10.dp).clip(RoundedCornerShape(22.dp)))
}
```

**Fix:** A few steps (4, 8, 12, 16, 24, 32 dp), radii from `MaterialTheme.shapes`, default button shape.

```kotlin
Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
    Card(Modifier.padding(16.dp), shape = MaterialTheme.shapes.large) { Body() }
    Button(onClick = go) { Text(stringResource(R.string.go)) }
    Box(Modifier.padding(8.dp).clip(MaterialTheme.shapes.medium))
}
```

**Why:** Android's layout guidance uses an 8 dp grid with 4 dp for smaller elements. "The shape scale defines the style of container corners, offering a range of roundedness from square to fully circular." Values that almost line up read as careless. Put shared steps in one `Dimens.kt` if the project has none.
Source: https://developer.android.com/design/ui/mobile/guides/layout-and-content/grids-and-units, https://developer.android.com/develop/ui/compose/designsystems/material3, spec https://m3.material.io/styles/shape/overview

### Lazy lists with keys, pull to refresh [not scanned]

**Slop:** A feed in a scrolling `Column` with `forEach`, and a "Refresh" button above it.

```kotlin
Column {
    Button(onClick = vm::reload) { Text("Refresh") }
    Column(Modifier.verticalScroll(rememberScrollState())) {
        transactions.forEach { TxRow(it) }
    }
}
```

**Fix:** `LazyColumn` with stable keys inside `PullToRefreshBox`.

```kotlin
PullToRefreshBox(isRefreshing = state.loading, onRefresh = vm::reload) {
    LazyColumn(contentPadding = innerPadding) {
        items(transactions, key = { it.id }) { TxRow(it) }
    }
}
```

**Why:** With `Column`, "all the items will be composed and laid out whether or not they are visible", and "Providing a stable key enables item state to be consistent across dataset changes". "Use the `PullToRefreshBox` composable to implement pull-to-refresh." Check that the project's material3 version has `PullToRefreshBox` before you add it.
Source: https://developer.android.com/develop/ui/compose/lists, https://developer.android.com/develop/ui/compose/components/pull-to-refresh

### Placeholders while loading, a next step when empty or failed [not scanned]

**Slop:** A full-screen spinner on every screen, then a bare "No data" text.

```kotlin
if (loading) Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
    CircularProgressIndicator()
} else if (items.isEmpty()) Text("No data") else Feed(items)
```

**Fix:** Rows sized like the content while loading; an explanation plus the action when empty.

```kotlin
when {
    loading -> LazyColumn { items(6) { TxRowPlaceholder() } }
    items.isEmpty() -> EmptyState(
        icon = painterResource(R.drawable.ic_receipt_long),
        title = stringResource(R.string.no_transactions),
        action = { Button(onClick = onAdd) { Text(stringResource(R.string.add_transaction)) } })
    else -> LazyColumn { items(items, key = { it.id }) { TxRow(it) } }
}
// remote images (Coil): a placeholder of the final size, and an error painter
AsyncImage(model = avatarUrl, contentDescription = stringResource(R.string.avatar, name),
    placeholder = painterResource(R.drawable.avatar_placeholder),
    error = painterResource(R.drawable.avatar_placeholder),
    modifier = Modifier.size(48.dp).clip(CircleShape))
```

**Why:** Android suggests "adding some placeholders" so item sizing "remains the same before and after loading". In M3 Expressive, "The loading indicator is designed to show progress that loads in under five seconds. It should replace most uses of the indeterminate circular progress indicator." M3 has no skeleton or empty-state component; the empty-state advice is handfeel judgement, and the same goes for errors: say what failed and offer "Try again", never the raw exception text. `EmptyState` above is a small composable you write, using the app's own wording. For network images Android points to libraries such as Coil, whose `AsyncImage` supports "setting `placeholder`/`error`/`fallback` painters"; adding Coil is a dependency change.
Source: https://developer.android.com/develop/ui/compose/lists, https://github.com/material-components/material-components-android/blob/master/docs/components/LoadingIndicator.md, https://developer.android.com/develop/ui/compose/components/progress, https://developer.android.com/develop/ui/compose/graphics/images/loading, https://coil-kt.github.io/coil/compose/. Empty and error states: handfeel judgement, see docs/slop-catalog.md

### Restrained motion [not scanned]

**Slop:** Decorative animations that never stop, and bouncy springs on every list item.

```kotlin
val pulse by rememberInfiniteTransition().animateFloat(
    initialValue = 0.8f, targetValue = 1.2f,
    animationSpec = infiniteRepeatable(tween(1000), RepeatMode.Reverse))
Box(Modifier.scale(pulse).background(MaterialTheme.colorScheme.primary, CircleShape))
```

**Fix:** Animate state changes the user caused, keep them short, and drop loops that only decorate.

```kotlin
AnimatedVisibility(visible = expanded, enter = fadeIn() + expandVertically(), exit = fadeOut() + shrinkVertically()) {
    Details()
}
```

**Why:** handfeel judgement. The research behind this file found no Android or Compose page that tells apps how to react to the system "Remove animations" setting, so this rule cites no official source. Test with that setting on and make sure no information exists only in an animation.
Source: handfeel judgement, see docs/slop-catalog.md

### Text contrast [not scanned]

**Slop:** White text at 60% alpha on a pastel gradient, gray captions on white.

```kotlin
Text("Track your habits", color = Color.White.copy(alpha = 0.6f),
    modifier = Modifier.background(Brush.linearGradient(listOf(Color(0xFFA78BFA), Color(0xFFF0ABFC)))))
```

**Fix:** Pair each container role with its on-role.

```kotlin
Surface(color = MaterialTheme.colorScheme.primaryContainer) {
    Text("Track your habits", color = MaterialTheme.colorScheme.onPrimaryContainer)
}
```

**Why:** "If the text is smaller than 18sp, or if the text is bold and smaller than 14sp, use foreground and background colors that result in a color contrast ratio of at least 4.5:1. For all other text, set the color contrast ratio to at least 3:1." Check light and dark schemes. When both colors are literals, compute the ratio; text over images or gradients needs a look at the rendered screen.
Source: https://developer.android.com/guide/topics/ui/accessibility/apps

### Start and end, auto-mirrored icons [not scanned]

Only if the app ships, or plans to ship, a right-to-left language. Compose `padding(start = ...)` already follows the layout direction.

**Slop:**

```kotlin
Icon(Icons.Default.ArrowForward, contentDescription = null)
Modifier.absolutePadding(left = 16.dp)
```

**Fix:**

```kotlin
Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null)
Modifier.padding(start = 16.dp)
```

**Why:** "The AutoMirrored icons are a subset of Icons that will automatically mirror themselves when displayed in an RTL layout." Directional icons from `Icons.Default` do not. `absolutePadding` ignores the layout direction.
Source: https://developer.android.com/reference/kotlin/androidx/compose/material/icons/Icons.AutoMirrored

### System splash screen, no splash activity [not scanned]

**Slop:** a `SplashActivity` or a splash composable with a logo and a timer.

```kotlin
LaunchedEffect(Unit) { delay(2500); navController.navigate("home") }
```

**Fix:**

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    val splash = installSplashScreen()          // androidx.core:core-splashscreen
    super.onCreate(savedInstanceState)
    splash.setKeepOnScreenCondition { !viewModel.isReady.value }
    enableEdgeToEdge()
    setContent { App() }
}
```

**Why:** "Starting in Android 12, apps launch with a system splash screen", and "If you implemented a custom splash screen in Android 11 or lower, migrate your app to the SplashScreen compat library". Keep the splash only while startup work is running, not for a fixed time. For the launcher icon: "If you want to support user theming of app icons, provide a single layer for the monochrome version of the icon."
Source: https://developer.android.com/guide/topics/ui/splash-screen, https://developer.android.com/develop/ui/views/launch/icon_design_adaptive

## Checklist before you report

- You confirmed Compose with Material 3 and read `compileSdk`, `targetSdk`, `minSdk` and the BOM version, and every suggested API exists at those versions.
- You ran `npx handfeel scan` (or said why you could not) and each scanner finding is either fixed, reported, or explained as a false positive.
- Every finding has `file:line`, the rule title, the scanner id or "not scanned", and a one-line fix.
- Rules marked "handfeel judgement" are reported as judgement, not as Material or Android requirements.
- Tappable elements are 48x48 dp, show a ripple, and have a localized `contentDescription` when icon-only.
- Phones use a `NavigationBar` for three to five top-level destinations; back is handled with `BackHandler`.
- `enableEdgeToEdge()` is called, `Scaffold` padding is used, and no code paints the system bars.
- Colors come from `MaterialTheme.colorScheme`, and both light and dark schemes exist.
- Text uses `MaterialTheme.typography` roles and `sp`, never `dp` for text.
- Lists are lazy with keys; loading, empty and error states follow the patterns above; screens were checked at 200% font size (or you said you could not run them).
- In fix mode, each change is small, scoped to one screen, and listed with its file.
- You stated plainly whether you built the app, ran it on an emulator or a device, or neither.

## Do not

- Do not change features, content, copy meaning, data or user flows. handfeel changes how the app looks and feels, not what it does.
- Do not invent a brand color, icon meaning or empty-state promise. Propose it and flag it for the owner.
- Do not raise `minSdk`, `targetSdk` or library versions to use a newer API unless the owner asks; use the older equivalent.
- Do not present handfeel judgement as a Google quote, and do not invent quotes or URLs.
- Do not claim the app was built, run or tested on an emulator or device unless you did it in this session.
