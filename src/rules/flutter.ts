import { callSpan } from '../lex.js';
import type { SourceFile } from '../source.js';
import { SRC } from './sources.js';
import { matches, type Rule } from './api.js';

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

/** Top-level named argument `name:` inside an argument list (depth 0 only). */
function hasTopArg(argsMasked: string, name: string): boolean {
  let depth = 0;
  for (let i = 0; i < argsMasked.length; i++) {
    const c = argsMasked[i];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if (depth === 0 && argsMasked.startsWith(name + ':', i) && !/[\w$]/.test(argsMasked[i - 1] ?? '')) return true;
  }
  return false;
}

export const flutterTapNoFeedback: Rule = {
  id: 'no-press-feedback',
  title: 'Taps without visual feedback',
  platforms: [...FL],
  weight: 2,
  cap: 10,
  why: 'GestureDetector detects a tap but draws nothing. Without an ink ripple or highlight the user cannot tell whether the tap landed, especially since the thumb covers the control.',
  fix: 'Use InkWell (inside a Material) or a real button (FilledButton, TextButton, IconButton, CupertinoButton). Keep GestureDetector for drags and custom gestures.',
  sources: [SRC.flutter_inkwell, SRC.flutter_gesture, SRC.m3_states],
  file(f, report) {
    for (const c of calls(f, /GestureDetector/)) {
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
      const m = /child:\s*(?:const\s+)?(Container|SizedBox|AnimatedContainer)\s*\(/.exec(c.argsMasked);
      if (!m) continue;
      const open = c.argsStart + m.index + m[0].length - 1;
      const span = callSpan(f.masked, open);
      if (!span) continue;
      const inner = f.code.slice(span.args[0], span.args[1]);
      const innerMasked = f.masked.slice(span.args[0], span.args[1]);
      if (/padding:/.test(innerMasked.split('child:')[0]) === true && /margin:/.test(innerMasked) === false && false) continue;
      const w = /(?:^|[,(\s])width:\s*(\d+(?:\.\d+)?)/.exec(inner.split('child:')[0]);
      const h = /(?:^|[,(\s])height:\s*(\d+(?:\.\d+)?)/.exec(inner.split('child:')[0]);
      const wv = w ? parseFloat(w[1]) : undefined;
      const hv = h ? parseFloat(h[1]) : undefined;
      if ((wv !== undefined && wv < 44) || (hv !== undefined && hv < 44)) {
        report(c.offset, `Tap target is ${wv ?? '?'}×${hv ?? '?'}. Minimum is 48×48 (Material) / 44×44 (iOS).`);
      }
    }
    for (const c of calls(f, /IconButton/)) {
      if (/constraints:\s*(?:const\s+)?BoxConstraints\(\s*\)/.test(c.args) || /visualDensity:\s*VisualDensity\.compact/.test(c.args) && /padding:\s*EdgeInsets\.zero/.test(c.args)) {
        report(c.offset, 'IconButton with its minimum size removed.');
      }
    }
  },
};

export const flutterIconLabel: Rule = {
  id: 'icon-button-no-label',
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

export const flutterSafeArea: Rule = {
  id: 'missing-safe-area',
  title: 'Content under the notch or home indicator',
  platforms: [...FL],
  weight: 3,
  cap: 9,
  why: 'A Scaffold without an AppBar does not pad its body for the status bar, notch or gesture area. Text ends up under the clock or the home indicator.',
  fix: 'Wrap the body in SafeArea (or use an AppBar/SliverAppBar, or read MediaQuery.paddingOf(context)).',
  sources: [SRC.flutter_safearea, SRC.hig_layout, SRC.android_edge],
  file(f, report) {
    const scaffolds = calls(f, /Scaffold/);
    if (!scaffolds.length) return;
    if (/\bSafeArea\s*\(|SliverAppBar|CupertinoSliverNavigationBar|MediaQuery\.(?:of\(context\)\.)?(?:padding|viewPadding)(?:Of)?/.test(f.masked)) return;
    for (const s of scaffolds) {
      if (hasTopArg(s.argsMasked, 'appBar') || hasTopArg(s.argsMasked, 'navigationBar')) continue;
      if (!hasTopArg(s.argsMasked, 'body')) continue;
      report(s.offset, 'Scaffold body without AppBar or SafeArea.');
    }
  },
};

export const flutterDialogForm: Rule = {
  id: 'modal-instead-of-sheet',
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
  why: 'A drawer hides destinations behind a tap at the top of the screen, out of thumb reach. iOS uses a tab bar; Material 3 uses a NavigationBar for three to five top-level destinations.',
  fix: 'Use NavigationBar (Material) / CupertinoTabBar, or NavigationRail on wide screens.',
  sources: [SRC.hig_tabbars, SRC.m3_nav_bar, SRC.m3_nav_drawer],
  file(f, report) {
    for (const m of matches(/\bdrawer:\s*(?:const\s+)?(?:Navigation)?Drawer\s*\(/, f.masked)) report(m.index, 'Scaffold drawer used for navigation.');
  },
};

export const flutterRules: Rule[] = [flutterTapNoFeedback, flutterTouchTarget, flutterIconLabel, flutterFontScaling, flutterMaterial2, flutterSafeArea, flutterDialogForm, flutterDrawer];
