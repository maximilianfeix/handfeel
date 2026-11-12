# compose-tasks: fix report

`handfeel fix` run by Claude Opus 5.5 with SKILL.md, `references/compose.md` and `references/signs.md`. It was told not to stop for questions. Only files in `after/` were edited. No dependencies were added: everything used is in the existing Compose BOM 2025.04.01 (compose-ui 1.8.0, material3 1.3.x).

**Scanner score: 87 → 100** (`node dist/src/cli.js scan after`, nothing left to report).

## Passes

- **Touch:** Haptics were added through `LocalHapticFeedback`, only on meaningful moments:
  - `ToggleOn` / `ToggleOff` on task and checklist checkboxes and settings switches
  - `Confirm` on save, complete and delete
  - `Reject` when you save without a title
  - `SegmentTick` when you change the week day, category or appearance

  Each checklist row is now one `toggleable` target; the `Checkbox` only shows the state, so there is no double target. Each settings row now toggles its `Switch`, which gives a whole-row target, a ripple and a single TalkBack stop.
- **Structure:** The hand-built header became a Material `TopAppBar` with zero insets, because Scaffold padding already covers the status bar. Scaffold padding is now consumed (`consumeWindowInsets`), so the editor's `imePadding` no longer adds the navigation bar height twice when the keyboard is open. Text fields get IME actions and sentence capitalization. The bottom `NavigationBar`, `BackHandler`, edge-to-edge and dialogs were already right.
- **Color:**
  - Dark mode was a switch that defaulted to off, which forced light theme. It is now System / Light / Dark (`SegmentedButton`), and System is the default. An old saved "dark on" value becomes Dark.
  - Added `values-night/styles.xml`, so the launch window is no longer white in dark mode.
  - Both color schemes now set every M3 role. Before, secondary/tertiary containers, surface containers and `inversePrimary` fell back to the purple Material baseline, so dialogs, menus and chips had a lavender tint.
  - The high-priority flag and the category colors moved from screen literals into `DaylightTheme.colors`, with a lighter dark-mode variant. The flag was 3.2:1 on the dark surface and is now 6.7:1.
  - Light `onSurfaceVariant` changed from 4.45:1 to 5.5:1 on the background.
- **Type:** Removed `fontSize = 11.sp` / `18.sp` (now `labelSmall` / `titleMedium`). Theme sizes and line heights were aligned to the M3 scale (38→36, 30→32, 23→24, 20→22). No text uses dp, and scaling is untouched.
- **Icons:** The "✓" text marker in the status menu became a `leadingIcon` check. Icon sizes were normalized to 16/24 dp and `ButtonDefaults.IconSize`.
- **Spacing:** Off-grid values replaced: 3, 5, 6, 7, 10, 14, 15, 18, 22 and a 150 dp width. Radii are now 8/12/16/24 (`BadgeShape`/`ChipShape`/`RowShape`/`CardShape`). Buttons and the FAB use the default Material shapes.
- **Platform details:** The empty state's "Create a task" became a `FilledTonalButton`, not a bare text link. Lists were already lazy with keys. The data is local, so pull to refresh was not added.

## Suppressions

None. No `handfeel-ignore` comments were added.

## Not verified / open

- **Not built, not run.** Gradle, kotlinc and the Android SDK are not usable here, so nothing was compiled or run on an emulator or device.
- **Compile risk.** The new haptic constants (`Confirm`, `Reject`, `ToggleOn/Off`, `SegmentTick`) need compose-ui 1.8.0. I am relying on BOM 2025.04.01 resolving to 1.8.0. If CI fails on them, replace them with `LongPress` / `TextHandleMove`.
- **Touch targets.** The seven week-day cells are about 40 dp wide on a 360 dp phone, under the 48 dp target. I left this as is: fitting a 7-day strip at 48 dp would need horizontal scrolling or a different layout.
- **Owner decisions.**
  - The 40 dp "Your workspace" avatar in the list header looks tappable but does nothing.
  - The `widthIn(max = 760.dp)` column is a web-style layout. `NavigationSuiteScaffold` would be the adaptive alternative on tablets.
  - Both are reported, not changed.
- **Proposals, not brand decisions.** The dark-mode category and priority colors, and the new secondary/tertiary/surface-container tones, are my choices derived from the existing forest green.
- `README.md` in `after/` was updated to describe the new appearance setting.
