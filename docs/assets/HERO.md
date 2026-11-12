# Hero demo: how it was made

| File | What | Size |
|---|---|---|
| `hero.webp` | README hero. Animated WebP, 1200×1060, 25 fps, 10.4 s, loops | 962 KB |
| `hero.mp4` | For X, 16:9. 1920×1080, H.264 High, yuv420p, 30 fps, 16.6 s, no audio | 867 KB |
| `hero-square.mp4` | For X, 1:1. 1080×1080, same encoding, 16.6 s | 675 KB |
| `hero-still.png` | One frame of `hero.mp4` (phone in light mode, both home screens), 1920×1080 | 383 KB |

## What is shown

Two phones side by side, same screens, same scripted taps at the same moments:

- **Generated**: `evals/apps/expo-budget/before`, built from a plain prompt by Claude Sonnet.
- **After handfeel fix**: `evals/apps/expo-budget/after`, the same app after an agent ran `handfeel fix` (see `evals/apps/expo-budget/FIX-REPORT.md`).

Sequence: phone in dark mode, home screen (3 s) → phone set to light mode → tap Add, tap the Transport chip, tap Budgets, tap Home → phone back in dark mode. The generated app stays dark because its `app.json` forces `"userInterfaceStyle": "dark"` and its colours are hard-coded; the fixed app follows the system.

The scores under the phones are the real output of the scanner in this repo:

```
node dist/src/cli.js scan evals/apps/expo-budget/before --summary   # 51 / 100  looks generated (49 before the 2026-11-12 calibration)
node dist/src/cli.js scan evals/apps/expo-budget/after  --summary   # 100 / 100 feels native
```

The rule ids in `hero.mp4` ("What the scanner found") are the seven rules that cost points in that `before` scan. The list "What the fix changed" is taken from `FIX-REPORT.md`.

## Recorded where: Expo Web only, no emulator

All footage is **Expo Web** (react-native-web 0.19.13, Expo SDK 52, RN 0.76.9 in the runner) in headless Chromium through Playwright, viewport 390×844 at 2× (frames are 780×1688), `isMobile` and `hasTouch` on. The Android emulator was tried and dropped: on this 8 GB Mac with about 2.5 GB free disk, booting the `raai36` AVD grew macOS swap until free disk fell to 357 MB, and a second start with `-memory 1536` was refused by the emulator for lack of disk space. Nothing in the hero comes from the emulator.

What this means for the content:

- **Pressed states, ripple and haptics are not shown.** In the fixed app the pressed background is `Platform.OS === 'ios'` only and the ripple is `android_ripple`; on web neither renders, and `expo-haptics` does nothing on web. Showing a press on the right phone and none on the left would have been fake, so taps look the same on both phones. `hero.mp4` says so in a note under "What the fix changed".
- **Light mode is a cold start in light mode, not a live switch.** Each app was recorded in two takes, one with Playwright `colorScheme: 'dark'` and one with `'light'`, joined with a 0.3 s cross-fade at the moment the caption changes. A live switch (`page.emulateMedia`) was tried first: the fixed app's `useColorScheme` updated, but react-native-web kept stale classes for some styles built with `StyleSheet.create` (stat icons, chips, stepper buttons stayed dark on a light screen). That is a web rendering artefact, not the app on a phone, so the live-switch footage was not used.
- **The touch dot** (clay circle with a white ring) is drawn by the recorder into the page just before each tap. It is an indicator for the viewer, not part of either app.
- The web build has no safe-area inset at the bottom, so the tab bar labels sit close to the lower edge of the screen. Phone corners use a small radius so no label is cut off.

Captions, labels, scores, phone bodies and the intro/end cards are drawn around the recordings. App pixels are only scaled (Lanczos) and corner-masked; nothing inside the screens was retouched.

## Provenance of the two apps

The runner project is `.work/run/budget` (Expo SDK 52 with `node_modules`). For each app, `app/`, `src/` and `app.json` were copied in from `evals/apps/expo-budget/<before|after>` and checked with `diff -r` (identical), then exported as a static web build. Nothing under `evals/` was modified, and the after app was not edited by hand.

The runner's `package.json` is not byte-identical to the eval's. Differences (`diff evals/apps/expo-budget/after/package.json .work/run/budget/package.json`):

- added to make the generated app run: `query-string`, `expo-font`, `expo-asset`
- added for the web target: `react-dom`, `react-native-web`, `@expo/metro-runtime`
- `react-native` 0.76.5 → 0.76.9 (the SDK 52 patch release), `@expo/vector-icons` `^14.0.4` → `~14.0.4`

`before` and `after` declare the same dependencies, so both ran on the same runtime.

## Commands

Scratch folder `$W` (any empty folder). Tools: Node 26, Playwright 1.65 (repo dev dependency), ffmpeg 9.0.2 (Homebrew, libx264, no drawtext), `img2webp` from Homebrew `webp` 1.6.0. Scripts are in `scripts/hero/`.

```sh
R=.work/run/budget
E=evals/apps/expo-budget

# 1. Static web builds of both apps
for app in before after; do
  cp -R $E/$app/app/. $R/app/ && cp -R $E/$app/src/. $R/src/ && cp $E/$app/app.json $R/app.json
  diff -r $E/$app/app $R/app && diff -r $E/$app/src $R/src && diff $E/$app/app.json $R/app.json
  (cd $R && CI=1 npx expo export --platform web --clear --output-dir $W/web-$app)
done
(cd $W/web-before && python3 -m http.server 8090 &)
(cd $W/web-after  && python3 -m http.server 8091 &)

# 2. Four takes (app × system scheme), then constant 30 fps clips
for app in before:8090 after:8091; do
  a=${app%%:*}; port=${app##*:}
  node scripts/hero/record.mjs $W/rec-$a-dark  http://localhost:$port dark
  node scripts/hero/record.mjs $W/rec-$a-light http://localhost:$port light
  node scripts/hero/tovideo.mjs $W/rec-$a-dark  $W/$a-dark.mp4  3.0
  node scripts/hero/tovideo.mjs $W/rec-$a-light $W/$a-light.mp4 7.6
done

# 3. Compose: hero (README), wide (16:9) and square (1:1) with intro and end cards
HERO_WORK=$W node scripts/hero/build.mjs all   # reads both scores from the scanner

# 4. Deliverables
mkdir -p $W/wf && ffmpeg -i $W/build/hero-main.mp4 -vf fps=25 -q:v 1 $W/wf/f%04d.jpg
img2webp -loop 0 -lossy -q 88 -m 6 -d 40 $W/wf/*.jpg -o docs/assets/hero.webp
cp $W/build/wide-full.mp4   docs/assets/hero.mp4
cp $W/build/square-full.mp4 docs/assets/hero-square.mp4
ffmpeg -ss 4.0 -i $W/build/wide-main.mp4 -frames:v 1 docs/assets/hero-still.png
```

`record.mjs` loads the app, visits Add, Budgets and Home once (so later taps do not hit a first-load flash), then captures full-resolution screenshots in a loop (about 28 per second) while it runs the timeline, stamping each frame with its capture time. `tovideo.mjs` resamples those frames to a constant 30 fps. `build.mjs` renders the chrome with Playwright and does the rest in one ffmpeg filter graph per format: dark take, 0.3 s cross-fade to the light take, cross-fade back to dark (so the WebP loops without a jump), scale, rounded-corner mask, overlay.

The `"The method or property Haptic.selectionAsync is not available on web"` errors in the console come from both apps calling `expo-haptics` on web. They are unhandled promise rejections and do not stop navigation or selection.
