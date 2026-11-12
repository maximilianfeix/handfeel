# Signs of a generated mobile app

The tells, across all four platforms, in pass order. The id in brackets is what `npx handfeel scan` reports; "manual" means you have to look. Platform details and code are in the platform reference.

## Touch

- **Small targets** [touch-target-too-small]. 24-36 point circles and icons with a tap handler. Minimum is 44×44 pt on iOS, 48×48 dp on Android.
- **Taps that show nothing** [no-press-feedback]. Pressable without a pressed style, GestureDetector instead of InkWell, `.onTapGesture` instead of Button, `indication = null`.
- **No haptics** [no-haptics], or the opposite (manual): a vibration on every tap. Haptics belong on selection changes, success, error and long press.
- **Opacity fade on Android** [no-android-ripple]. TouchableOpacity everywhere and no ripple.

## Structure

- **Hamburger drawer for main sections** [hamburger-navigation]. Phones use a tab bar / navigation bar for three to five destinations.
- **Centered popups for tasks** [modal-instead-of-sheet]. A dimmed overlay with a card and a text field. Use a sheet.
- **Content under the notch, status bar or home indicator** [missing-safe-area, rn-safe-area-view]. Or the reverse (manual): hard-coded `paddingTop: 44` / `.padding(.top, 50)` to dodge the notch.
- **Keyboard covers the field** [keyboard-covers-input].
- **Web layout on a phone** (manual). A centered hero headline with a gradient "Get started" button, a footer, a max-width column, horizontal scrolling chips that do nothing.

## Color

- **Indigo-to-violet gradients** [purple-gradient] and the default accents (#6366F1, #8B5CF6, #7C3AED, #667EEA → #764BA2, #6C63FF) [default-ai-accent].
- **Gradients on everything** [gradient-overuse]: hero card, avatar ring, buttons, progress bars.
- **Glass cards** [glassmorphism]: blur plus `rgba(255,255,255,0.1)` and a thin white border.
- **Hex values in screens** [hardcoded-color] instead of color roles.
- **No dark mode, or only dark mode** [no-dark-mode, forced-color-scheme]. A "premium" dark theme that ignores the system setting counts too.
- **Glow and colored shadows** (manual): shadows tinted with the accent, neon outlines.

## Type

- **A new size per label** [type-scale-sprawl, type-outside-scale, fixed-font-size]. 11, 12, 13, 14, 15, 17, 22, 28, 34, 42.
- **Scaling turned off** [font-scaling-disabled] to keep a layout from breaking.
- **Shouting copy** (manual): "Crush your goals!", "Let's go!", exclamation marks on buttons, title case everywhere, "Welcome back, Champion".

## Icons

- **Emoji as icons** [emoji-as-icon]: 🔥 for streaks, 💰 for money, ⚙️ for settings, 🏠 in the tab bar.
- **Icon buttons with no label** [icon-button-no-label].
- **Mixed icon sets** (manual): Ionicons next to Material next to emoji.

## Spacing

- **Values off the 4/8 grid** [off-grid-spacing]: 10, 14, 15, 18, 22 next to 16 and 24.
- **Same padding everywhere** (manual): every card 20 px all round, no grouping, no difference between related and unrelated items.

## Platform details

- **One UI for both platforms** [no-platform-adaptation]: Material switches and dialogs on iOS, iOS-style shadows that vanish on Android [ios-only-shadow].
- **Old platform APIs** [material-2-theme, deprecated-navigation-view, rn-safe-area-view].
- **Spinners for everything** (manual): a full-screen spinner where a placeholder in the shape of the content would hold the layout.
- **Animations everywhere** (manual): every card fades and slides in on mount, numbers count up, nothing respects Reduce Motion.
- **Empty states with an emoji and "Nothing here yet!"** (manual). An empty state should say what will appear and offer the one action that creates it.
