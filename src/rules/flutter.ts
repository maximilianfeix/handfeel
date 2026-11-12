import { callSpan } from '../lex.js';
import type { SourceFile } from '../source.js';
import { SRC } from './sources.js';
import { hasBottomNav, matches, type Rule } from './api.js';

const FL = ['flutter'] as const;

/** Every `Name(` call in masked code with its argument text (from `code`, so strings are intact). */
function calls(f: SourceFile, name: RegExp): { offset: number; args: string; argsMasked: string; argsStart: number }[] {
  const out: { offset: number; args: string; argsMasked: string; argsStart: number }[] = [];
  for (const m of matches(new RegExp(`\\b(?:${name.source})\\s*\\(`), f.masked)) {
    const paren = m.index + m[0].length - 1;
    const span = callSpan(f.masked, paren);
    if (!span) continue;
    out.push({ offset: m.index, args: f.code.slice(span.args[0], span.args[1]), argsMasked: f.masked.slice(span.args[0], span.args[1]), argsStart: span.args[0] });
  }
  return out;
}

/** Offset of the top-level named argument `name:` inside an argument list (depth 0 only), or -1. */
function topArg(argsMasked: string, name: string): number {
  let depth = 0;
  for (let i = 0; i < argsMasked.length; i++) {
    const c = argsMasked[i];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if (depth === 0 && argsMasked.startsWith(name + ':', i) && !/[\w$]/.test(argsMasked[i - 1] ?? '')) return i;
  }
  return -1;
}
const hasTopArg = (argsMasked: string, name: string) => topArg(argsMasked, name) >= 0;

/** Widgets that pass their child's size through unchanged. */
const SIZE_TRANSPARENT = /^(?:DecoratedBox|Material|Ink|ClipRRect|ClipOval|ClipRect|Center|Align|Opacity|AnimatedOpacity|Semantics|Tooltip|Hero|RepaintBoundary|MouseRegion)$/;

/**
 * Size of the tap target: follow the top-level `child:` through wrappers that keep their
 * child's size until a Container/SizedBox with a literal width or height.
 */
function tapTargetSize(f: SourceFile, argsStart: number, argsMasked: string): { w?: number; h?: number } | null {
  for (let hop = 0; hop < 6; hop++) {
    const at = topArg(argsMasked, 'child');
    if (at < 0) return null;
    const m = /^child:\s*(?:const\s+)?([A-Z]\w*)\s*\(/.exec(argsMasked.slice(at));
    if (!m) return null;
    const span = callSpan(f.masked, argsStart + at + m[0].length - 1);
    if (!span) return null;
    const inner = f.masked.slice(span.args[0], span.args[1]);
    if (/^(?:Container|SizedBox|AnimatedContainer)$/.test(m[1])) {
      const code = f.code.slice(span.args[0], span.args[1]);
      const num = (k: string) => {
        const i = topArg(inner, k);
        const v = i >= 0 ? /^\w+:\s*(\d+(?:\.\d+)?)\b/.exec(code.slice(i)) : null;
        return v ? parseFloat(v[1]) : undefined;
      };
      return { w: num('width'), h: num('height') };
    }
    if (!SIZE_TRANSPARENT.test(m[1])) return null;
    argsStart = span.args[0];
    argsMasked = inner;
  }
  return null;
}

export const flutterTapNoFeedback: Rule = {
  id: 'no-press-feedback',
  perOccurrence: true,
  title: 'Taps without visual feedback',
  platforms: [...FL],
  weight: 2,
  cap: 10,
  why: 'GestureDetector detects a tap but draws nothing. Without an ink ripple or highlight the user cannot tell whether the tap landed, especially since the thumb covers the control.',
  fix: 'Use InkWell (inside a Material) or a real button (FilledButton, TextButton, IconButton, CupertinoButton). Keep GestureDetector for drags and custom gestures.',
  sources: [SRC.flutter_inkwell, SRC.flutter_gesture, SRC.m3_states],
  file(f, report) {
    for (const c of calls(f, /GestureDetector/)) {
      // tap outside a field to close the keyboard: not a button
      if (/onTap:[^,]*\bunfocus\b/.test(c.args)) continue;
      if (hasTopArg(c.argsMasked, 'onTap') && !hasTopArg(c.argsMasked, 'onPanUpdate') && !hasTopArg(c.argsMasked, 'onHorizontalDragUpdate') && !hasTopArg(c.argsMasked, 'onVerticalDragUpdate') && !hasTopArg(c.argsMasked, 'onScaleUpdate')) {
        report(c.offset, 'GestureDetector(onTap:) has no ink or highlight; the tap shows nothing.');
      }
    }
    for (const c of calls(f, /InkWell|InkResponse/)) {
      if (/splashFactory:\s*NoSplash\.splashFactory/.test(c.args) && /highlightColor:\s*Colors\.transparent/.test(c.args)) report(c.offset, 'InkWell with splash and highlight both turned off.');
    }
  },
};

export const flutterTouchTarget: Rule = {
  id: 'touch-target-too-small',
  perOccurrence: true,
  title: 'Touch targets under 44 pt',
  platforms: [...FL],
  weight: 2,
  cap: 12,
  why: 'Flutter itself uses 48×48 (Material) and 44×44 (Cupertino) as the minimum interactive size. A 28 px circle wrapped in a GestureDetector is a 28 px target, and thumbs miss it.',
  fix: 'Give the tappable area at least 48×48 (padding, SizedBox, or ConstrainedBox) and keep the visual small inside it; IconButton already does this unless you shrink its constraints.',
  sources: [SRC.flutter_touch, SRC.hig_buttons, SRC.android_a11y_targets],
  file(f, report) {
    for (const c of calls(f, /GestureDetector|InkWell|InkResponse/)) {
      if (!hasTopArg(c.argsMasked, 'onTap')) continue;
      const size = tapTargetSize(f, c.argsStart, c.argsMasked);
      if (!size) continue;
      const { w: wv, h: hv } = size;
      if ((wv !== undefined && wv < 44) || (hv !== undefined && hv < 44)) {
        report(c.offset, `Tap target is ${wv ?? '?'}×${hv ?? '?'}. Minimum is 48×48 (Material) / 44×44 (iOS).`);
      }
    }
    for (const c of calls(f, /IconButton/)) {
      const removed = /constraints:\s*(?:const\s+)?BoxConstraints\(\s*\)/.test(c.args) || (/visualDensity:\s*VisualDensity\.compact/.test(c.args) && /padding:\s*EdgeInsets\.zero/.test(c.args));
      if (!removed) continue;
      // without constraints the button is iconSize (24) + padding (8 per side) big
      const icon = /iconSize:\s*(\d+(?:\.\d+)?)/.exec(c.args);
      const pad = /padding:\s*(?:const\s+)?EdgeInsets\.(?:all\(\s*(\d+(?:\.\d+)?)\s*\)|(zero))/.exec(c.args);
      const side = (icon ? parseFloat(icon[1]) : 24) + 2 * (pad ? (pad[2] ? 0 : parseFloat(pad[1])) : 8);
      if (side < 44) report(c.offset, `IconButton with its minimum size removed (${side}×${side}).`);
    }
  },
};

export const flutterIconLabel: Rule = {
  id: 'icon-button-no-label',
  perOccurrence: true,
  title: 'Icon-only buttons without a label',
  platforms: [...FL],
  weight: 1,
  cap: 6,
  why: 'An IconButton without tooltip is announced as "button" by TalkBack and VoiceOver. The tooltip doubles as the semantic label and shows on long press.',
  fix: "Add tooltip: 'Settings' (or wrap in Semantics(label: ...)).",
  sources: [SRC.flutter_iconbutton, SRC.hig_accessibility],
  file(f, report) {
    for (const c of calls(f, /IconButton(?:\.filled|\.outlined|\.filledTonal)?/)) {
      if (!hasTopArg(c.argsMasked, 'tooltip')) report(c.offset, 'IconButton without tooltip (its accessibility label).');
    }
  },
};

export const flutterFontScaling: Rule = {
  id: 'font-scaling-disabled',
  title: 'Font scaling turned off',
  platforms: [...FL],
  weight: 4,
  cap: 12,
  why: 'Overriding the text scaler pins all text to one size and ignores the system text-size setting many users depend on.',
  fix: 'Remove the override. If layouts break at large sizes, clamp with MediaQuery.textScalerOf(context).clamp(maxScaleFactor: 2) and let rows wrap.',
  sources: [SRC.flutter_textscaler, SRC.hig_typography],
  file(f, report) {
    for (const m of matches(/TextScaler\.noScaling|TextScaler\.linear\(\s*1(?:\.0)?\s*\)|textScaleFactor:\s*1(?:\.0)?\b/, f.code)) {
      report(m.index, `${m[0]} pins text to one size.`);
    }
  },
};

export const flutterMaterial2: Rule = {
  id: 'material-2-theme',
  title: 'Material 2 theme',
  platforms: [...FL],
  weight: 3,
  cap: 3,
  why: 'useMaterial3: false brings back 2018 Material: flat app bars, old shapes and color system. It is a common leftover from old tutorials that models learned from.',
  fix: 'Remove useMaterial3: false and build the ColorScheme with ColorScheme.fromSeed.',
  sources: [SRC.flutter_m3],
  file(f, report) {
    for (const m of matches(/useMaterial3:\s*false/, f.code)) report(m.index, 'useMaterial3: false.');
  },
};

const LAYOUT_BODY = /^body:\s*(?:const\s+)?(?:Column|Row|Stack|Center|Padding|Container|Align|ListView|GridView|SingleChildScrollView|CustomScrollView|Wrap|Flex|PageView)\b/;

export const flutterSafeArea: Rule = {
  id: 'missing-safe-area',
  perOccurrence: true,
  title: 'Content under the notch or home indicator',
  platforms: [...FL],
  weight: 3,
  cap: 9,
  why: 'A Scaffold without an AppBar does not pad its body for the status bar, notch or gesture area. Text ends up under the clock or the home indicator. Only bodies that lay out content in the same file (Column, Stack, ListView ...) are checked.',
  fix: 'Wrap the body in SafeArea (or use an AppBar/SliverAppBar, or read MediaQuery.paddingOf(context)).',
  sources: [SRC.flutter_safearea, SRC.hig_layout, SRC.android_edge],
  file(f, report) {
    const scaffolds = calls(f, /Scaffold/);
    if (!scaffolds.length) return;
    if (/\bSafeArea\s*\(|SliverAppBar|CupertinoSliverNavigationBar|MediaQuery\.(?:of\(context\)\.)?(?:padding|viewPadding)(?:Of)?/.test(f.masked)) return;
    for (const s of scaffolds) {
      if (hasTopArg(s.argsMasked, 'appBar') || hasTopArg(s.argsMasked, 'navigationBar')) continue;
      const at = topArg(s.argsMasked, 'body');
      if (at < 0) continue;
      // only bodies that lay out content right here; `body: child` or `body: LoginForm()` is checked where that widget lives
      if (!LAYOUT_BODY.test(s.argsMasked.slice(at))) continue;
      report(s.offset, 'Scaffold body without AppBar or SafeArea.');
    }
  },
};

export const flutterDialogForm: Rule = {
  id: 'modal-instead-of-sheet',
  perOccurrence: true,
  title: 'Dialogs for input instead of sheets',
  platforms: [...FL],
  weight: 2,
  cap: 6,
  why: 'Centered dialogs with text fields fight the keyboard and feel like a web popup. Material and iOS both present input tasks as bottom sheets or full pages.',
  fix: 'Use showModalBottomSheet(isScrollControlled: true, useSafeArea: true) or push a page; keep dialogs for short confirmations.',
  sources: [SRC.flutter_bottom_sheet, SRC.m3_bottom_sheets, SRC.hig_sheets],
  file(f, report) {
    for (const c of calls(f, /showDialog|showCupertinoDialog|showGeneralDialog/)) {
      if (/TextField|TextFormField|CupertinoTextField|Form\s*\(/.test(c.argsMasked)) report(c.offset, 'Dialog with text input; a bottom sheet works better with the keyboard.');
    }
  },
};

export const flutterDrawer: Rule = {
  id: 'hamburger-navigation',
  title: 'Hamburger drawer as main navigation',
  platforms: [...FL],
  weight: 6,
  cap: 6,
  why: 'A drawer hides destinations behind a tap at the top of the screen, out of thumb reach. iOS uses a tab bar; Material 3 uses a NavigationBar for three to five top-level destinations. A drawer in an app that also has a NavigationBar is not counted.',
  fix: 'Use NavigationBar (Material) / CupertinoTabBar, or NavigationRail on wide screens.',
  sources: [SRC.hig_tabbars, SRC.m3_nav_bar, SRC.m3_nav_drawer],
  file(f, report, p) {
    if (hasBottomNav(p, 'flutter')) return;
    for (const m of matches(/\bdrawer:\s*(?:const\s+)?(?:Navigation)?Drawer\s*\(/, f.masked)) report(m.index, 'Scaffold drawer used for navigation, and the app has no NavigationBar.');
  },
};

export const flutterRules: Rule[] = [flutterTapNoFeedback, flutterTouchTarget, flutterIconLabel, flutterFontScaling, flutterMaterial2, flutterSafeArea, flutterDialogForm, flutterDrawer];
