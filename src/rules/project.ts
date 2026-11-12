import type { Platform } from '../types.js';
import { SRC } from './sources.js';
import type { Project, Rule, ProjectReport } from './api.js';

function anchor(p: Project, platform: Platform): { file: string; line: number } {
  if (platform === 'react-native' && p.manifests.rnPackages.length) {
    const d = p.manifests.rnPackages[0].dir;
    return { file: (d ? d + '/' : '') + 'package.json', line: 1 };
  }
  if (platform === 'flutter' && p.manifests.pubspecs.length) {
    const d = p.manifests.pubspecs[0].dir;
    return { file: (d ? d + '/' : '') + 'pubspec.yaml', line: 1 };
  }
  const f = p.files.find((x) => x.platform === platform);
  return { file: f?.rel ?? '.', line: 1 };
}

const filesOf = (p: Project, pl: Platform) => p.files.filter((f) => f.platform === pl);
const anyCode = (p: Project, pl: Platform, re: RegExp) => filesOf(p, pl).some((f) => re.test(f.code));

function perPlatform(p: Project, report: ProjectReport, check: Partial<Record<Platform, () => string | null>>) {
  for (const pl of p.platforms) {
    const fn = check[pl];
    if (!fn || !filesOf(p, pl).length) continue;
    const msg = fn();
    if (msg) {
      const at = anchor(p, pl);
      report(at.file, at.line, msg);
    }
  }
}

export const noHaptics: Rule = {
  id: 'no-haptics',
  title: 'No haptic feedback anywhere',
  platforms: ['react-native', 'flutter', 'swiftui', 'compose'],
  weight: 6,
  cap: 6,
  why: 'Native apps confirm toggles, completions and errors with a light tap you feel. An app with none feels like a website in a frame, even if it looks right.',
  fix: 'Add semantic haptics on meaningful moments only: selection changes, success/error, long press. expo-haptics, HapticFeedback (Flutter), .sensoryFeedback (SwiftUI), LocalHapticFeedback / View.performHapticFeedback (Compose).',
  sources: [SRC.hig_haptics, SRC.android_haptics, SRC.expo_haptics, SRC.flutter_haptics, SRC.swiftui_sensory],
  project(p, report) {
    perPlatform(p, report, {
      'react-native': () => (anyCode(p, 'react-native', /expo-haptics|react-native-haptic-feedback|react-native-haptics|Vibration\.vibrate|performAndroidHapticsAsync/) ? null : 'No haptics library is used anywhere in the app.'),
      flutter: () => (anyCode(p, 'flutter', /HapticFeedback\.|\bVibration\b|haptic_feedback|enableFeedback:\s*true/) ? null : 'HapticFeedback is never called.'),
      swiftui: () => (anyCode(p, 'swiftui', /sensoryFeedback|UIImpactFeedbackGenerator|UINotificationFeedbackGenerator|UISelectionFeedbackGenerator|CHHapticEngine/) ? null : 'No .sensoryFeedback or feedback generator anywhere.'),
      compose: () => (anyCode(p, 'compose', /LocalHapticFeedback|performHapticFeedback|HapticFeedbackConstants|VibrationEffect/) ? null : 'No LocalHapticFeedback / performHapticFeedback anywhere.'),
    });
  },
};

export const noDarkMode: Rule = {
  id: 'no-dark-mode',
  title: 'Dark mode not supported',
  platforms: ['react-native', 'flutter', 'compose'],
  weight: 10,
  cap: 10,
  why: 'iOS and Android both let people pick dark mode (or switch it on automatically at night) and both guidelines expect apps to follow it. An app that stays white at night, or dark in daylight, shows nobody tested it on a phone.',
  fix: 'Define light and dark color roles and follow the system: useColorScheme + userInterfaceStyle "automatic" (Expo), MaterialApp(theme:, darkTheme:) (Flutter), isSystemInDarkTheme() + darkColorScheme (Compose).',
  sources: [SRC.hig_dark, SRC.expo_color_themes, SRC.rn_color_scheme, SRC.flutter_dark, SRC.compose_dark],
  project(p, report) {
    perPlatform(p, report, {
      'react-native': () => {
        const followsSystem = anyCode(p, 'react-native', /useColorScheme|Appearance\.|useTheme\(|DarkTheme|PlatformColor|DynamicColorIOS|nativewind|dark:/);
        const styles = p.manifests.appJson.map((a) => a.json?.expo?.userInterfaceStyle ?? a.json?.userInterfaceStyle).filter(Boolean);
        const automatic = styles.includes('automatic');
        if (!followsSystem) return 'The app never reads the system color scheme (no useColorScheme / Appearance).';
        if (p.manifests.appJson.length && !automatic) return `app.json userInterfaceStyle is ${styles[0] ? `"${styles[0]}"` : 'not set (Expo defaults to "light")'}, so the OS keeps the app light.`;
        return null;
      },
      flutter: () => {
        const forced = filesOf(p, 'flutter').flatMap((f) => [...f.code.matchAll(/themeMode:\s*ThemeMode\.(light|dark)\b/g)].map((m) => m[1]));
        if (forced.length) return `themeMode: ThemeMode.${forced[0]} forces one appearance and ignores the system setting.`;
        if (anyCode(p, 'flutter', /darkTheme:|platformBrightnessOf|\.platformBrightness\b|CupertinoDynamicColor/)) return null;
        if (anyCode(p, 'flutter', /Brightness\.dark/)) return 'There is only a dark theme: the app ignores the system appearance (no light theme / darkTheme pair).';
        return 'MaterialApp has no darkTheme and nothing reads the platform brightness.';
      },
      compose: () => (anyCode(p, 'compose', /isSystemInDarkTheme|darkColorScheme|dynamicDarkColorScheme/) ? null : 'No darkColorScheme / isSystemInDarkTheme.'),
    });
  },
};

export const noPlatformAdaptation: Rule = {
  id: 'no-platform-adaptation',
  title: 'Same UI on iOS and Android',
  platforms: ['flutter', 'react-native'],
  weight: 4,
  cap: 4,
  why: 'Material widgets on an iPhone (or iOS-style controls on Android) are noticed immediately: wrong switches, wrong back behaviour, wrong dialogs. Flutter and React Native both expose the platform so details can follow each OS.',
  fix: 'Use adaptive constructors (Switch.adaptive, showAdaptiveDialog, CupertinoPageRoute on iOS) or Platform.select for platform details such as ripples, shadows and haptics.',
  sources: [SRC.flutter_adaptive, SRC.hig_buttons, SRC.m3_states],
  project(p, report) {
    perPlatform(p, report, {
      flutter: () => (anyCode(p, 'flutter', /\.adaptive\b|Adaptive\(|Cupertino|Platform\.is(IOS|Android)|defaultTargetPlatform|TargetPlatform\.|\.platform\b/) ? null : 'No adaptive widgets or platform checks: Material everywhere, including iOS.'),
      'react-native': () => (anyCode(p, 'react-native', /Platform\.(OS|select)|\.ios\.tsx?|\.android\.tsx?|android_ripple|expo-symbols|NativeTabs|native-tabs|PlatformColor/) ? null : 'No Platform.OS / Platform.select anywhere: one UI for both platforms.'),
    });
  },
};

export const noEdgeToEdge: Rule = {
  id: 'missing-safe-area',
  title: 'Edge-to-edge not handled',
  platforms: ['compose'],
  weight: 3,
  cap: 9,
  why: 'Apps targeting Android 15+ draw behind the status and navigation bars. Without enableEdgeToEdge() and inset handling, content collides with the system bars or the bars show the wrong colors.',
  fix: 'Call enableEdgeToEdge() in onCreate and pass Scaffold’s innerPadding (or WindowInsets.safeDrawing) to your content.',
  sources: [SRC.android_edge],
  project(p, report) {
    perPlatform(p, report, {
      compose: () => {
        const hasActivity = anyCode(p, 'compose', /setContent\s*\{/);
        if (!hasActivity) return null;
        return anyCode(p, 'compose', /enableEdgeToEdge\s*\(/) ? null : 'setContent without enableEdgeToEdge().';
      },
    });
    // Scaffold content lambdas that drop the padding
    for (const f of p.files) {
      if (f.platform !== 'compose') continue;
      const re = /\bScaffold\s*\([\s\S]{0,400}?\)\s*\{\s*_\s*->/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(f.masked))) report(f.rel, f.lines.pos(m.index).line, 'Scaffold content ignores its innerPadding; content runs under the bars.');
    }
  },
};

export const opacityOnlyFeedback: Rule = {
  id: 'no-android-ripple',
  title: 'No ripple on Android',
  platforms: ['react-native'],
  weight: 3,
  cap: 3,
  why: 'On Android, pressed controls ripple. An app that only fades opacity (TouchableOpacity everywhere) feels like an iOS port.',
  fix: 'Use Pressable with android_ripple (or Platform.select for pressed styles), or a component library that ripples on Android.',
  sources: [SRC.m3_states, SRC.rn_pressable],
  project(p, report) {
    const files = filesOf(p, 'react-native');
    const opacity = files.filter((f) => /<TouchableOpacity\b/.test(f.code));
    if (!opacity.length) return;
    if (files.some((f) => /android_ripple|TouchableNativeFeedback|RectButton|BorderlessButton|react-native-paper|@react-native-material/.test(f.code))) return;
    report(opacity[0].rel, 1, `TouchableOpacity in ${opacity.length} file(s) and no android_ripple anywhere.`);
  },
};

export const projectRules: Rule[] = [noHaptics, noDarkMode, noPlatformAdaptation, noEdgeToEdge, opacityOnlyFeedback];
