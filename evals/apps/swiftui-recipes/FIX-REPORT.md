# swiftui-recipes: fix report

`handfeel fix` run by Claude Opus 5.5 with SKILL.md, `references/swiftui.md` and `references/signs.md`. It was told not to stop for questions. Only files in `after/` were edited. No dependencies were added.

**Scanner score: 79 → 100** (`node dist/src/cli.js scan after`). Two `gradient-overuse` findings are still listed but cost no points: the artwork gradient in `RecipeArt` and the dark scrim behind the text on `RecipeCard`. Both are artwork or legibility layers, not chrome.

## Passes

- **Touch:** The favorite button grew from 38 to 44 pt. Category chips get a 44 pt minimum height and the `.isSelected` trait. Method steps used `.onTapGesture` and are now `Button`s, so they have a press state and the button trait. Ingredient rows get a 44 pt minimum and `.isSelected`. Two new haptics, both behind the app's existing "Haptic feedback" setting: `.sensoryFeedback(.selection)` when the category changes, and `.success` once, when the last step is ticked off. The existing light impact on favorite is unchanged.
- **Structure:** On recipe detail, `.ignoresSafeArea(edges: .top)` and the hidden toolbar background are gone. Before, the favorite button sat under the status bar and Dynamic Island, and the orange back button sat on orange artwork. Favorites moved from a `ScrollView` of cards to a `List(.insetGrouped)`. Rows get swipe-to-remove, and the existing context menu stays as the second way to remove. Tabs, `NavigationStack`, `.searchable` and the empty states were already native and were left as they were.
- **Color:** The tinted "glow" shadow under each card is removed. The eight per-recipe palettes moved from `SampleData.swift` into `Theme.Art`, the token file. They are still artwork colors (stand-ins for food photos). Chips on the cards no longer use `.ultraThinMaterial`, so there is no glass on content. The selected category chip used white text on `#F2622E` (3.2:1). It is now an inverted neutral, label color on system background, so the accent is left for actions. The category label and the meta line in Favorites changed from accent to `.secondary`, because orange caption text is 3.2:1. The in-app appearance picker already defaults to System, so it was kept, as the reference says.
- **Type:** All text already used text styles. On recipe detail, the "Ingredients" header and the servings stepper now stack vertically at accessibility text sizes (`AnyLayout`). Recipe cards now grow with their text (`minHeight` instead of a fixed 220 pt), so large sizes no longer clip it.
- **Icons:** The eight dish emoji used as artwork became SF Symbols in the model (`emoji` → `symbol`): frying.pan, leaf, fork.knife, flame, sun.horizon, fish, birthday.cake, cup.and.saucer. The artwork is now hidden from VoiceOver. Stat tiles, recipe rows and steps are combined into single VoiceOver elements.
- **Spacing:** Added `Theme.Space` (4/8/12/16/24) and `Theme.Radius` (12/16/24). Off-grid values were replaced: 6, 9, 10, 14, 3 and radii 18/20/22/26/30.
- **Platform details:** Reduce Motion now turns off the `.snappy` animations and the favorite animation. The bouncy spring and the scale "pop" on favorite are gone. The `recipe.colors.last!` force unwrap was removed together with the shadow.

## Suppressions

None. No `handfeel-ignore` comments were added.

## Not verified / open

- **Not built, not run.** There is no Xcode on this machine. I did check the code with `swiftc -parse` (clean). I also type-checked it against the macOS SDK, with small UIKit shims and the iOS-only modifiers stubbed. That run is clean too, and it caught a closure that was slow to type-check; I moved it into `finishedAllSteps`. Nothing was run in a simulator or on a device.
- **Deployment target mismatch.** `Package.swift` declares `.iOS(.v17)`, but `RootView` uses `Tab(...)`, which needs iOS 18 (this is unchanged from `before/`). It compiles with the iOS 18 target that CI uses. With the package's own `.v17` target it would not. I did not touch `Package.swift`.
- **Accent color.** `Theme.accent` (#F2622E) and the `Package.swift` accent `.presetColor(.orange)` are two slightly different oranges. A brand decision for the owner.
- **Not checked.** Contrast of white text over the lightest artwork palettes (panna cotta, pancakes), in either appearance, was not checked on a rendered screen. The scrim was raised from 45% to 60% black to help.
- **Left as is.** The Favorites empty state has no action button; adding one would need a tab-switch flow, and that would be a behaviour change.
