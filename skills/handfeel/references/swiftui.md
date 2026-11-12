# handfeel reference: SwiftUI (iOS)

Load this file when the app is written in SwiftUI. It lists what makes a generated iOS app look generated, and what to write instead. In audit mode, report each finding with `file:line`, the rule title and a one-line fix, and do not edit code. In fix mode, work screen by screen in small, reviewable changes, and re-run `npx handfeel scan` after each screen. Scanner ids in brackets are what `npx handfeel scan` reports. The handfeel maintainers build SwiftUI examples only on a CI macOS runner, so you may not be able to build either: if you could not build or run the app, say so clearly in your report.

## Detect

Confirm the stack before you apply anything:

- An `.xcodeproj` / `.xcworkspace`, or a `Package.swift`, plus `.swift` files that `import SwiftUI`.
- Deployment target: `IPHONEOS_DEPLOYMENT_TARGET` in `project.pbxproj`, or `platforms: [.iOS(.v17)]` in `Package.swift`.
- UIKit screens (`UIViewController`, storyboards) mixed in: the rules still apply, but the code samples here are SwiftUI only.

Advice that depends on the deployment target (from the SwiftUI docs `platforms` data):

| API | Needs |
|---|---|
| `.refreshable`, `.swipeActions`, `.safeAreaInset`, `.borderedProminent` | iOS 15 |
| `NavigationStack`, `.presentationDetents` | iOS 16 |
| `.sensoryFeedback`, `ContentUnavailableView` | iOS 17 |
| `Tab("…", systemImage:)` inside `TabView` (use `.tabItem` before that) | iOS 18 |
| `.glassEffect`, `ConcentricRectangle`, `.glass` button styles | iOS 26 |

The HIG is now the iOS 26 Liquid Glass edition. If the target is below 26, the guidance on color, layout and restraint still applies, but do not add iOS 26 APIs without an `if #available` check. If the target is below 17, use `UIImpactFeedbackGenerator` / `UINotificationFeedbackGenerator` instead of `.sensoryFeedback`, and build empty states from `VStack` + `Label` + `Button`.

## Rules

Work through the rules in this order: Touch, Structure, Color, Type, Icons, Spacing, Platform details.

### Hit regions of at least 44x44 pt [touch-target-too-small]

**Slop:** A close or favorite icon gets a 24 pt frame and a tap handler, so the target is 24 pt.

```swift
Image(systemName: "xmark")
    .font(.caption)
    .frame(width: 24, height: 24)
    .onTapGesture { dismiss() }
```

**Fix:** Keep the glyph small, grow the hit region.

```swift
Button { dismiss() } label: {
    Image(systemName: "xmark")
        .frame(minWidth: 44, minHeight: 44)
        .contentShape(Rectangle())
}
.accessibilityLabel("Close")
```

**Why:** Apple: "a button needs a hit region of at least 44x44 pt". The Accessibility page lists 44x44 pt as the default control size and 28x28 pt as the minimum, so treat anything under 44 as a finding and anything under 28 as a clear error.
Source: https://developer.apple.com/design/human-interface-guidelines/buttons#Best-practices, https://developer.apple.com/design/human-interface-guidelines/accessibility#Mobility

### Button with a system style, not onTapGesture [no-press-feedback]

**Slop:** A hand-built pill with a gradient, white text and a shadow, repeated for three or four buttons. Or a `Text` with `.onTapGesture`. Neither has a pressed state or a button trait.

```swift
Text("Save")
    .foregroundColor(.white)
    .frame(maxWidth: .infinity).padding()
    .background(LinearGradient(colors: [.purple, .blue], startPoint: .leading, endPoint: .trailing))
    .cornerRadius(16).shadow(radius: 10)
    .onTapGesture { save() }
```

**Fix:** Use `Button` with a system style. One prominent button per view, two at most.

```swift
Button("Save", action: save)
    .buttonStyle(.borderedProminent)
    .controlSize(.large)
Button("Cancel", role: .cancel, action: cancel)
    .buttonStyle(.bordered)
// custom look: a ButtonStyle that reads configuration.isPressed
```

**Why:** System buttons "offer a range of styles that support customization while providing built-in interaction states, accessibility support, and appearance adaptation". Apple also says "Keep the number of prominent buttons to one or two per view" and "Always include a press state for a custom button". Keep `.onTapGesture(count: 2)` and similar gestures; only replace single taps that act as buttons.
Source: https://developer.apple.com/design/human-interface-guidelines/buttons#Style, https://developer.apple.com/design/human-interface-guidelines/buttons#Best-practices, https://developer.apple.com/documentation/swiftui/button

### Semantic haptics on meaningful events [no-haptics]

**Slop:** Either no haptics at all, or a heavy impact on every tap, plus a second haptic on controls that already play one.

```swift
Button("Next") {
    UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
    next()
}
```

**Fix:** Play the system pattern that matches the event, only when it happens.

```swift
Button("Save") { save() }
    .sensoryFeedback(.success, trigger: savedCount)      // iOS 17+
CustomSegmentedPicker(selection: $range)
    .sensoryFeedback(.selection, trigger: range)
// Toggle, Slider, Picker already play system haptics: add nothing.
```

**Why:** Apple: "Use system-provided haptic patterns according to their documented meanings" and "Avoid overusing haptics". Standard controls "play Apple-designed system haptics by default". The scanner reports a project with no `.sensoryFeedback` or feedback generator at all; heavy taps on every button are for you to spot.
Source: https://developer.apple.com/design/human-interface-guidelines/playing-haptics#Best-practices, https://developer.apple.com/documentation/swiftui/view/sensoryfeedback(_:trigger:)

### TabView for top-level sections, no hamburger menu [not scanned]

**Slop:** A `line.3.horizontal` toolbar button that slides in a custom side menu, or a hand-built `HStack` bottom bar on `.ultraThinMaterial`.

```swift
ZStack(alignment: .leading) {
    content
    if menuOpen { SideMenu().transition(.move(edge: .leading)) }
}
.toolbar { Button { menuOpen.toggle() } label: { Image(systemName: "line.3.horizontal") } }
```

**Fix:** Two to five top-level sections go in a system tab bar with SF Symbols and single-word labels.

```swift
TabView {
    Tab("Today", systemImage: "sun.max") { TodayView() }        // iOS 18+
    Tab("Library", systemImage: "books.vertical") { LibraryView() }
    Tab("Settings", systemImage: "gear") { SettingsView() }
}
// before iOS 18: TodayView().tabItem { Label("Today", systemImage: "sun.max") }
```

**Why:** The HIG does not mention hamburger menus; this is handfeel judgement derived from the tab bar guidance. Apple says tab bars "let people quickly switch between sections of the view while preserving the current navigation state within each section", and asks for labels with "single words whenever possible".
Source: handfeel judgement, see docs/slop-catalog.md. Related: https://developer.apple.com/design/human-interface-guidelines/tab-bars

### NavigationStack with real titles [deprecated-navigation-view]

**Slop:** `NavigationView`, or a hidden navigation bar replaced by an `HStack` with a chevron and the app name in a fixed font.

```swift
VStack {
    HStack {
        Button { dismiss() } label: { Image(systemName: "chevron.left") }
        Spacer(); Text("My Awesome App").font(.system(size: 22, weight: .bold)); Spacer()
    }.padding()
    ScrollView { rows }
}
.navigationBarHidden(true)
```

**Fix:** `NavigationStack`, a short title per screen, actions in `.toolbar`.

```swift
NavigationStack {
    List { rows }
        .navigationTitle("Workouts")          // large title on the root screen
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button { add() } label: { Label("Add", systemImage: "plus") }
            }
        }
}
```

**Why:** `NavigationView` is deprecated. Apple: "Use a large title to help people stay oriented as they navigate and scroll", "Don't title windows with your app name", and keep the title "under 15 characters long". Apple also says "people expect to find a Back button in a top toolbar" and that many apps "also offer a shortcut gesture", the edge swipe, "while continuing to provide the Back button". A hidden bar with a hand-made back arrow is where that swipe usually goes missing (handfeel observation; Apple does not document the interaction), so keep the system back button and test the edge swipe on every pushed screen.
Source: https://developer.apple.com/documentation/swiftui/navigationview, https://developer.apple.com/design/human-interface-guidelines/toolbars#iOS, https://developer.apple.com/design/human-interface-guidelines/gestures

### Sheets with detents for short tasks [modal-instead-of-sheet]

**Slop:** `fullScreenCover` for a three-toggle filter with a custom X button, or a `ZStack` "bottom sheet" built from `DragGesture` and `.offset(y:)`.

```swift
.fullScreenCover(isPresented: $showFilter) { FilterView() }
```

**Fix:** A sheet with medium and large detents, Cancel leading, Done trailing.

```swift
.sheet(isPresented: $showFilter) {
    NavigationStack {
        FilterForm().toolbar {
            ToolbarItem(placement: .cancellationAction) { Button("Cancel") { showFilter = false } }
            ToolbarItem(placement: .confirmationAction) { Button("Done") { apply() } }
        }
    }
    .presentationDetents([.medium, .large])                // iOS 16+
    .presentationDragIndicator(.visible)
}
```

**Why:** "A sheet is useful for requesting specific information from people or presenting a simple task". The full-screen style suits video, photos, camera views or multistep tasks such as editing. Keep a `fullScreenCover` that really is immersive or multistep. If the sheet has unsaved changes, use `.interactiveDismissDisabled(hasChanges)` with a confirmation, not a blanket `true`.
Source: https://developer.apple.com/design/human-interface-guidelines/sheets, https://developer.apple.com/design/human-interface-guidelines/modality

### Content inside the safe area, only backgrounds bleed [not scanned]

**Slop:** `.ignoresSafeArea()` on the whole stack, so the header sits under the Dynamic Island, then magic padding to "fix" it.

```swift
ZStack {
    LinearGradient(colors: bg, startPoint: .top, endPoint: .bottom)
    VStack { header; content; Spacer(); ctaButton }
        .padding(.top, 50).padding(.bottom, 34)
}
.ignoresSafeArea()
```

**Fix:** Let the background extend, keep content in the safe area, pin bottom actions with `safeAreaInset`.

```swift
VStack { header; content }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color(.systemGroupedBackground).ignoresSafeArea())
    .safeAreaInset(edge: .bottom) {
        Button("Continue") { next() }
            .buttonStyle(.borderedProminent).controlSize(.large).padding()
    }
```

**Why:** Apple: "Respecting the safe area is essential to make sure system UI and hardware features like the Dynamic Island don't obstruct content and controls." Full-screen backgrounds may extend under bars. Also replace the deprecated `.edgesIgnoringSafeArea` and layout based on `UIScreen.main.bounds`.
Source: https://developer.apple.com/design/human-interface-guidelines/layout#Guides-and-safe-areas, https://developer.apple.com/documentation/swiftui/view/ignoressafearea(_:edges:)

### Keyboard type, content type and avoidance [not scanned]

**Slop:** Default keyboard for email, no password content type, and manual keyboard-height hacks that fight SwiftUI.

```swift
VStack { Spacer(); TextField("Email", text: $email); SecureField("Password", text: $pw) }
    .ignoresSafeArea()
    .padding(.bottom, keyboardHeight)   // from keyboardWillShowNotification
```

**Fix:** Set the keyboard and content type, let SwiftUI avoid the keyboard.

```swift
Form {
    TextField("Email", text: $email)
        .keyboardType(.emailAddress).textContentType(.emailAddress)
        .textInputAutocapitalization(.never).autocorrectionDisabled()
        .submitLabel(.next).focused($focus, equals: .email)
    SecureField("Password", text: $pw)
        .textContentType(.password).submitLabel(.go)
}
.scrollDismissesKeyboard(.interactively)
```

**Why:** Apple: "Choose a keyboard that matches the type of content people are editing" and "Consider customizing the Return key type if it helps clarify the text-entry experience." Use `.newPassword` and `.oneTimeCode` content types where they fit. By default SwiftUI sizes views so that "system content like the software keyboard or edges of the device don't obstruct your views", so `.ignoresSafeArea()` on a form undoes that. Use `.phonePad`, `.decimalPad` and `.URL` the same way.
Source: https://developer.apple.com/design/human-interface-guidelines/virtual-keyboards#Best-practices, https://developer.apple.com/documentation/swiftui/view/ignoressafearea(_:edges:)

### Semantic system colors, not literals [hardcoded-color]

**Slop:** `Color.white` surfaces, `Color(red:green:blue:)` grays and `Color(hex:)` in every screen.

```swift
VStack { rows }
    .background(Color.white)
Text(subtitle).foregroundColor(Color(red: 0.55, green: 0.55, blue: 0.6))
Text(title).foregroundColor(.black)
```

**Fix:** Use semantic styles and system backgrounds. Put brand colors in an asset color set with Any and Dark appearances.

```swift
VStack { rows }
    .background(Color(.systemBackground))
Text(subtitle).foregroundStyle(.secondary)
Text(title).foregroundStyle(.primary)
let brand = Color("BrandAccent")   // asset catalog, light + dark variants
```

**Why:** Apple: "Avoid hard-coding system color values in your app" and, for Dark Mode, "Avoid using hard-coded color values or colors that don't adapt." Use the grouped background set (`systemGroupedBackground` …) behind grouped lists and the system set elsewhere. The scanner skips theme and token files, so a single `Theme.swift` with literals is fine.
Source: https://developer.apple.com/design/human-interface-guidelines/color#System-colors, https://developer.apple.com/design/human-interface-guidelines/dark-mode#Dark-Mode-colors

### Follow the system appearance [forced-color-scheme]

**Slop:** The app is locked to light (or dark), or has its own dark-mode toggle.

```swift
WindowGroup { ContentView().preferredColorScheme(.light) }
@AppStorage("darkMode") var darkMode = false
Toggle("Dark mode", isOn: $darkMode)
```

**Fix:** Remove the override and check both appearances in previews.

```swift
WindowGroup { ContentView() }
#Preview("Dark") { ContentView().preferredColorScheme(.dark) }
```

**Why:** Apple: people "generally expect all apps and games to respect their preference" and "Avoid offering an app-specific appearance setting." A dark-only interface is acceptable in rare cases such as immersive media viewing. If the product owner wants an in-app setting, it must default to "System" (`nil`); do not remove an existing setting without asking.
Source: https://developer.apple.com/design/human-interface-guidelines/dark-mode#Best-practices

### No default "AI purple" accent [default-ai-accent]

**Slop:** The accent is one of the stock values a model picks when nobody chose a brand color: Tailwind indigo/violet/purple 400-600 (`#6366F1`, `#7C3AED`, `#8B5CF6` …), `#667EEA`, `#764BA2`, `#6C63FF`.

```swift
static let accent = Color(hex: "#6C63FF")
```

**Fix:** Ask for the brand color, or keep the system tint until there is one. Define the accent once in the asset catalog as `AccentColor`.

```swift
// Assets.xcassets/AccentColor.colorset with Any + Dark values chosen on purpose
Button("Start") { start() }.buttonStyle(.borderedProminent)   // uses the accent
```

**Why:** These values are the most common accent in generated apps, so the app reads as generated before anyone uses it. This is handfeel judgement, not an Apple rule. In fix mode, do not invent a brand color: propose one and flag it for the owner.
Source: handfeel judgement, see docs/slop-catalog.md

### Gradients for artwork, flat fills for controls [purple-gradient, gradient-overuse]

**Slop:** Multi-stop gradients on the screen background, every card and the main button; gradient text on the title.

```swift
.background(LinearGradient(colors: [.purple, .pink, .orange],
                           startPoint: .topLeading, endPoint: .bottomTrailing))
Text("Welcome").foregroundStyle(LinearGradient(colors: [.indigo, .purple], startPoint: .leading, endPoint: .trailing))
```

**Fix:** System backgrounds for surfaces, one accent for the primary action and selection.

```swift
.background(Color(.systemGroupedBackground))
Text("Welcome").font(.largeTitle.bold())
Button("Start") { start() }.buttonStyle(.borderedProminent).tint(.accentColor)
```

**Why:** The HIG has no gradient ban; this is handfeel judgement. Related Apple guidance: "Apply color sparingly", "Refrain from adding color to the background of multiple controls", and "Use color consistently throughout your interface". Gradients inside artwork, charts and SF Symbol gradient rendering are fine.
Source: handfeel judgement, see docs/slop-catalog.md. Related: https://developer.apple.com/design/human-interface-guidelines/color#Liquid-Glass-color, https://developer.apple.com/design/human-interface-guidelines/color#Best-practices

### Materials and glass on bars, not on content [not scanned]

**Slop:** Every row is a frosted card on a gradient.

```swift
ForEach(items) { item in
    ItemRow(item)
        .padding()
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 20))
}
```

**Fix:** Plain rows on the system background. Glass only on a floating custom control, if at all.

```swift
List(items) { item in ItemRow(item) }
    .listStyle(.insetGrouped)
FloatingControl().glassEffect()      // iOS 26+, use sparingly
```

**Why:** Apple: "Don't use Liquid Glass in the content layer" and "Use Liquid Glass effects sparingly". For standard materials: "Choose materials and effects based on semantic meaning and recommended usage", not for the color they add. System bars pick up glass on their own. The `glassmorphism` scanner rule does not cover Swift yet, so check this by hand.
Source: https://developer.apple.com/design/human-interface-guidelines/materials#Liquid-Glass, https://developer.apple.com/design/human-interface-guidelines/materials

### Text styles and Dynamic Type [fixed-font-size, type-scale-sprawl]

**Slop:** A new point size on every label, ultralight headings and 9 pt captions.

```swift
Text("Good morning").font(.system(size: 34, weight: .ultraLight))
Text(item.subtitle).font(.system(size: 13))
Text("v1.0").font(.system(size: 9))
Text(title).font(.custom("Inter-Bold", fixedSize: 28))
```

**Fix:** Map each size to a text style. For a custom font, scale it relative to a style.

```swift
Text("Good morning").font(.largeTitle)
Text(item.subtitle).font(.footnote).foregroundStyle(.secondary)
Text("Version 1.0").font(.caption2)
Text(title).font(.custom("Inter-Bold", size: 28, relativeTo: .title))
@ScaledMetric(relativeTo: .body) private var iconSize = 24.0
```

**Why:** Apple: "Using text styles with the system fonts also ensures support for Dynamic Type". `custom(_:size:)` scales relative to body (use `relativeTo:` for headings), and `custom(_:fixedSize:)` creates a font "that does not scale with Dynamic Type." Apple does not say `.system(size:)` ignores Dynamic Type; the problem is that it is not tied to a text style. Also: "avoid Ultralight, Thin, and Light font weights", and 11 pt is the iOS minimum.
Source: https://developer.apple.com/design/human-interface-guidelines/typography#Using-system-fonts, https://developer.apple.com/design/human-interface-guidelines/typography#Ensuring-legibility, https://developer.apple.com/documentation/swiftui/applying-custom-fonts-to-text, https://developer.apple.com/documentation/swiftui/font/custom(_:fixedsize:)

### Layouts that survive the largest text size [not scanned]

**Slop:** fixed frames and one-line rows that clip at accessibility sizes.

```swift
HStack { Text(title).lineLimit(1); Spacer(); Text(amount) }
    .frame(height: 56)
```

**Fix:** let rows grow, and stack them when the text is very large.

```swift
@Environment(\.dynamicTypeSize) private var typeSize

let layout = typeSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading)) : AnyLayout(HStackLayout())
layout { Text(title); Spacer(minLength: 8); Text(amount) }
    .frame(minHeight: 44)
// or ViewThatFits { HStack { ... }; VStack(alignment: .leading) { ... } }   // iOS 16+
```

**Why:** Apple: "Make sure your app's layout adapts to all font sizes" and "Keep text truncation to a minimum as font size increases." `isAccessibilitySize` is "A Boolean value indicating whether the size is one that is associated with accessibility" (iOS 15+); `AnyLayout` and `ViewThatFits` need iOS 16. Check every screen at the largest accessibility size in the simulator or with previews such as `.dynamicTypeSize(.accessibility5)`.
Source: https://developer.apple.com/design/human-interface-guidelines/typography#Supporting-Dynamic-Type, https://developer.apple.com/documentation/swiftui/dynamictypesize/isaccessibilitysize, https://developer.apple.com/documentation/swiftui/viewthatfits

### SF Symbols, not emoji [emoji-as-icon]

**Slop:** Emoji as button icons, tab icons and section headers.

```swift
Button("\u{1F525} Start workout") { start() }    // fire emoji
Text("\u{1F4CA} Stats").font(.headline)          // bar chart emoji
HomeView().tabItem { Text("\u{1F3E0}") }         // house emoji
```

**Fix:** SF Symbols through `Label` or `Image(systemName:)`.

```swift
Button { start() } label: { Label("Start Workout", systemImage: "flame.fill") }
Label("Stats", systemImage: "chart.bar").font(.headline)
HomeView().tabItem { Label("Home", systemImage: "house") }
```

**Why:** The HIG does not mention emoji; the ban is handfeel judgement. Related Apple guidance: symbols work "wherever interface icons can appear", "When you use SF Symbols, you get icons that scale automatically with Dynamic Type size changes", and interface icons "need to use a consistent size, level of detail, stroke thickness (or weight), and perspective". Emoji that are content (reactions, a mood picker, user text) stay.
Source: handfeel judgement, see docs/slop-catalog.md. Related: https://developer.apple.com/design/human-interface-guidelines/sf-symbols, https://developer.apple.com/design/human-interface-guidelines/typography#Supporting-Dynamic-Type, https://developer.apple.com/design/human-interface-guidelines/icons#Best-practices

### Labels on icon-only controls, hide decoration [not scanned]

**Slop:** An icon-only button that VoiceOver reads as the symbol name, and a decorative image read by file name.

```swift
Button { share() } label: { Image(systemName: "square.and.arrow.up") }
Image("hero-blob")
```

**Fix:** Give the control a real label and mark decoration as decorative.

```swift
Button { share() } label: { Label("Share", systemImage: "square.and.arrow.up") }
    .labelStyle(.iconOnly)
Image(decorative: "hero-blob")
// custom tappable view: .accessibilityAddTraits(.isButton)
// grouped row: .accessibilityElement(children: .combine)
```

**Why:** Apple: "Provide alternative labels for all key interface elements" and "Exclude purely decorative images from VoiceOver." The `icon-button-no-label` scanner rule does not cover Swift yet.
Source: https://developer.apple.com/design/human-interface-guidelines/voiceover#Descriptions, https://developer.apple.com/design/human-interface-guidelines/icons#Best-practices

### Spacing on a scale, consistent corners [off-grid-spacing]

**Slop:** `.padding(10)`, `.padding(14)`, `spacing: 18` next to 16 and 24, and a different `cornerRadius` on every element, often through the deprecated `.cornerRadius()`.

```swift
VStack(spacing: 18) {
    header.padding(14)
    card.padding(10).cornerRadius(24)
    button.padding(15).cornerRadius(18)
}
```

**Fix:** Pick a few steps (4, 8, 12, 16, 24, 32) and a few radii. Prefer default padding where the system has one.

```swift
VStack(spacing: 16) {
    header.padding()
    card.padding(12)
        .clipShape(RoundedRectangle(cornerRadius: 12))   // continuous by default
    button
}
// iOS 26: nested shapes can use ConcentricRectangle()
```

**Why:** Apple suggests "about 12 points of padding around elements that include a bezel" and about 24 points around elements without one. The 4-point scale itself is handfeel judgement. `View.cornerRadius(_:antialiased:)` is deprecated ("Use `clipShape` or `fill` instead."), and Apple asks that custom components in bars use radii "concentric with the bar's corners".
Source: https://developer.apple.com/design/human-interface-guidelines/accessibility#Mobility, https://developer.apple.com/design/human-interface-guidelines/layout, https://developer.apple.com/design/human-interface-guidelines/toolbars#Best-practices

### Lists, row actions and pull to refresh [not scanned]

**Slop:** Settings and feeds as `ScrollView { VStack { card } }` with a hand-drawn chevron, a trash button on every row and a toolbar "Refresh" button.

```swift
ScrollView {
    ForEach(items) { item in
        HStack { Text(item.title); Spacer(); Image(systemName: "chevron.right") }
            .padding().background(Color.white).cornerRadius(12).shadow(radius: 4)
    }
}
.toolbar { Button { Task { await load() } } label: { Image(systemName: "arrow.clockwise") } }
```

**Fix:** `List` or `Form` with sections, swipe actions with a second path, `.refreshable`.

```swift
List(items) { item in
    NavigationLink(item.title) { DetailView(item: item) }
        .swipeActions {
            Button(role: .destructive) { delete(item) } label: { Label("Delete", systemImage: "trash") }
        }
        .contextMenu { Button(role: .destructive) { delete(item) } label: { Label("Delete", systemImage: "trash") } }
}
.listStyle(.insetGrouped)
.refreshable { await store.reload() }
.task { await store.reload() }
```

**Why:** Apple: "Prefer displaying text in a list or table", the grouped style "uses headers, footers, and additional space to separate groups of data". A refresh control "lets people immediately reload content", and "Don't make people responsible for initiating every update". Swipe is hidden, so "Offer alternatives to gestures".
Source: https://developer.apple.com/design/human-interface-guidelines/lists-and-tables#Best-practices, https://developer.apple.com/design/human-interface-guidelines/progress-indicators#Refresh-content-controls, https://developer.apple.com/design/human-interface-guidelines/accessibility#Mobility

### Placeholders, not a lone spinner [not scanned]

**Slop:** A blank screen with a centered spinner and "Loading...".

```swift
if isLoading {
    VStack { ProgressView(); Text("Loading...") }
} else { FeedList(items: items) }
```

**Fix:** Show the layout right away with redacted placeholders. Use determinate progress for long tasks, and a spinner inside the button for button actions.

```swift
FeedList(items: isLoading ? Item.placeholders : items)
    .redacted(reason: isLoading ? .placeholder : [])
ProgressView(value: progress) { Text("Importing 12 of 40 photos") }
AsyncImage(url: avatarURL) { image in
    image.resizable().scaledToFill()
} placeholder: {
    Color(.secondarySystemFill)
}
.frame(width: 48, height: 48).clipShape(Circle())
```

**Why:** Apple: "Show something as soon as possible" and "When possible, use a determinate progress indicator." It also says to avoid "vague terms like loading or authenticating". `AsyncImage` is "A view that asynchronously loads and displays an image" (iOS 15+); give it a placeholder the size of the final image so rows do not jump.
Source: https://developer.apple.com/design/human-interface-guidelines/loading#Best-practices, https://developer.apple.com/design/human-interface-guidelines/progress-indicators#Best-practices, https://developer.apple.com/documentation/swiftui/asyncimage

### Empty and error states that explain and offer an action [not scanned]

**Slop:** A gray "No items" and nothing else, or the raw error text.

```swift
if items.isEmpty { Text("No items").foregroundColor(.gray) }
if let error { Text(error.localizedDescription) }
```

**Fix:** Say what goes here and give the action.

```swift
if items.isEmpty {
    ContentUnavailableView {                                   // iOS 17+
        Label("No Workouts Yet", systemImage: "figure.run")
    } description: {
        Text("Log your first workout to see your progress here.")
    } actions: {
        Button("Add Workout") { showAdd = true }.buttonStyle(.borderedProminent)
    }
}
// search: ContentUnavailableView.search(text: query)
// error: the same view with "Couldn't Load Workouts", what to check, and a "Try Again" button
```

**Why:** Apple: "Provide clear next steps on any blank screens" and "give them a button or link to do so if possible". `ContentUnavailableView` is meant for "a list without items, a search that returns no results". For errors: "display it as close to the problem as possible, avoid blame, and be clear about what someone can do to fix it." Below iOS 17, build the same thing from `Label`, `Text` and `Button`. Keep the app's own wording; do not invent features in the description.
Source: https://developer.apple.com/design/human-interface-guidelines/writing#Best-practices, https://developer.apple.com/documentation/swiftui/contentunavailableview

### Respect Reduce Motion [not scanned]

**Slop:** Pulsing decoration that never stops and very bouncy springs on frequent interactions.

```swift
Circle().scaleEffect(pulse ? 1.2 : 0.8)
    .animation(.easeInOut(duration: 1).repeatForever(), value: pulse)
card.transition(.move(edge: .bottom).combined(with: .scale))
    .animation(.spring(response: 0.6, dampingFraction: 0.4), value: shown)
```

**Fix:** Read the setting, fall back to fades, drop decorative loops.

```swift
@Environment(\.accessibilityReduceMotion) private var reduceMotion

card.transition(reduceMotion ? .opacity : .move(edge: .bottom))
    .animation(reduceMotion ? nil : .easeInOut(duration: 0.25), value: shown)
```

**Why:** Apple: when Reduce Motion is on, "ensure your app or game responds by reducing automatic and repetitive animations, including zooming, scaling, and peripheral motion", and "Don't add motion for the sake of adding motion."
Source: https://developer.apple.com/design/human-interface-guidelines/accessibility#Cognitive, https://developer.apple.com/design/human-interface-guidelines/motion#Best-practices

### Text contrast in both appearances [not scanned]

**Slop:** Light gray captions on white, white text on pastel or yellow fills, text at 40% opacity.

```swift
Text("Last synced 2 min ago").foregroundColor(Color(white: 0.75)).font(.caption)
Text("Pro").foregroundColor(.white).padding(4).background(Color.yellow)
```

**Fix:** Semantic foreground styles, or a pair that you have measured in light and dark.

```swift
Text("Last synced 2 min ago").foregroundStyle(.secondary).font(.caption)
Text("Pro").foregroundStyle(.black).padding(4).background(Color.yellow)
```

**Why:** Apple uses WCAG AA as guidance: 4.5:1 for text up to 17 pt, 3:1 for 18 pt or bold, and "check the minimum contrast in both light and dark appearances". When both colors are literals, compute the ratio; text over images or gradients needs a look at the rendered screen.
Source: https://developer.apple.com/design/human-interface-guidelines/accessibility#Vision, https://developer.apple.com/design/human-interface-guidelines/dark-mode#Dark-Mode-colors

### Leading and trailing, not left and right [not scanned]

Only if the app ships, or plans to ship, a right-to-left language. SwiftUI already uses leading and trailing; the slop is hard-coded direction.

```swift
Image(systemName: "chevron.right")                 // slop: points the wrong way in RTL
.frame(maxWidth: .infinity, alignment: .leading)   // fine
.environment(\.layoutDirection, .leftToRight)      // slop: forces LTR on the whole screen
```

**Fix:** use `chevron.forward` / `chevron.backward` and remove forced layout directions, except around content that must stay LTR such as a phone number.

**Why:** Apple: "System-provided UI frameworks support right-to-left (RTL) by default", "Flip controls that show progress from one value to another", and numerals such as phone numbers "always appear in the same order". Preview with `.environment(\.layoutDirection, .rightToLeft)`.
Source: https://developer.apple.com/design/human-interface-guidelines/right-to-left

### A quiet launch screen and a layered app icon [not scanned]

**Slop:** a SwiftUI "splash" view with a gradient, logo and tagline shown on a timer, and an icon with the app name written in it.

```swift
.onAppear { DispatchQueue.main.asyncAfter(deadline: .now() + 2) { showSplash = false } }
```

**Fix:** remove the timed view. Set `UILaunchScreen` in Info.plist (a background color that matches the first screen, in light and dark), and show the first screen as soon as it is ready. Build the icon in Icon Composer with layers, and check the dark, clear and tinted appearances.

**Why:** Apple: a launch screen "isn't an opportunity for artistic expression", "Design a launch screen that's nearly identical to the first screen of your app or game", "Avoid including text on your launch screen", and "Don't advertise." For icons: "Include text only when it's essential to your experience or brand", and people can choose "default, dark, clear, or tinted" icons; "the system automatically generates variants you don't provide." A timed splash that does real startup work can stay; shorten it to that work.
Source: https://developer.apple.com/design/human-interface-guidelines/launching#Launch-screens, https://developer.apple.com/design/human-interface-guidelines/app-icons, https://developer.apple.com/documentation/bundleresources/information-property-list/uilaunchscreen

## Checklist before you report

- You confirmed SwiftUI and read the deployment target, and every suggested API is available at that target or wrapped in `if #available`.
- You ran `npx handfeel scan` (or said why you could not) and each scanner finding is either fixed, reported, or explained as a false positive.
- Every finding has `file:line`, the rule title, the scanner id or "not scanned", and a one-line fix.
- Rules marked "handfeel judgement" are reported as judgement, not as Apple requirements.
- Tappable views are `Button`s with a 44x44 pt hit region and a label VoiceOver can read.
- Top-level navigation is a `TabView`; screens use `NavigationStack` with short titles.
- No forced color scheme; screens use semantic colors and were checked in light and dark (previews count only if you ran them).
- Fonts map to text styles; no size under 11 pt, no ultralight/thin/light UI text.
- Lists, empty, error and loading states use the system patterns above, and screens were checked at the largest accessibility text size (or you said you could not run them).
- In fix mode, each change is small, scoped to one screen, and listed with its file.
- You stated plainly whether you built the app, ran it in a simulator or on a device, or neither.

## Do not

- Do not change features, content, copy meaning, data or user flows. handfeel changes how the app looks and feels, not what it does.
- Do not invent a brand color, icon meaning or empty-state promise. Propose it and flag it for the owner.
- Do not raise the deployment target to use a newer API. Use the older equivalent or `if #available`.
- Do not present handfeel judgement as an Apple quote, and do not invent quotes or URLs.
- Do not claim the app was built, run or tested in a simulator or on a device unless you did it in this session.
