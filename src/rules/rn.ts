import { walk, type SourceFile } from '../source.js';
import { SRC } from './sources.js';
import { hasBottomNav, type Project, type Rule } from './api.js';

const RN = ['react-native'] as const;
const PRESSABLES = new Set(['Pressable', 'TouchableOpacity', 'TouchableHighlight', 'TouchableWithoutFeedback', 'TouchableNativeFeedback', 'TouchableBounce', 'RectButton', 'BaseButton']);
const ICON_NAME = /(Icon|Icons|^Ionicons|^Feather|^FontAwesome\d?|^AntDesign|^Entypo|^EvilIcons|^Octicons|^SimpleLineIcons|^Foundation|^Fontisto|^Zocial|^SymbolView|^Image)$/;

type Sheets = Map<string, Map<string, any>>;

function jsxName(n: any): string {
  if (!n) return '';
  if (n.type === 'JSXIdentifier') return n.name;
  if (n.type === 'JSXMemberExpression') return jsxName(n.object) + '.' + n.property.name;
  return '';
}
const baseName = (s: string) => s.split('.').pop() ?? s;

function attr(el: any, name: string): any {
  return el.openingElement.attributes.find((a: any) => a.type === 'JSXAttribute' && a.name?.name === name);
}
function attrExpr(a: any): any {
  if (!a?.value) return null;
  return a.value.type === 'JSXExpressionContainer' ? a.value.expression : a.value;
}

function objectProps(obj: any, into: Map<string, any>) {
  for (const p of obj.properties ?? []) {
    if (p.type !== 'ObjectProperty') continue;
    const k = p.key?.name ?? p.key?.value;
    if (k !== undefined) into.set(String(k), p.value);
  }
}

function styleSheets(f: SourceFile): Sheets {
  const sheets: Sheets = new Map();
  walk(f.ast!.program, (n: any) => {
    if (n.type !== 'VariableDeclarator' || n.id?.type !== 'Identifier' || n.init?.type !== 'CallExpression') return;
    const c = n.init.callee;
    const isCreate = c.type === 'MemberExpression' && c.object?.name === 'StyleSheet' && c.property?.name === 'create';
    const arg = n.init.arguments[0];
    if (!isCreate || arg?.type !== 'ObjectExpression') return;
    const sheet = new Map<string, any>();
    for (const p of arg.properties) {
      if (p.type === 'ObjectProperty' && p.value.type === 'ObjectExpression') sheet.set(String(p.key.name ?? p.key.value), p.value);
    }
    sheets.set(n.id.name, sheet);
  });
  return sheets;
}

/** Merges every style object a `style` expression can resolve to. Unknown parts are ignored. */
function resolveStyle(expr: any, sheets: Sheets, out = new Map<string, any>()): Map<string, any> {
  if (!expr) return out;
  switch (expr.type) {
    case 'ObjectExpression':
      objectProps(expr, out);
      break;
    case 'MemberExpression': {
      const sheet = sheets.get(expr.object?.name);
      const key = expr.property?.name ?? expr.property?.value;
      const obj = sheet?.get(String(key));
      if (obj) objectProps(obj, out);
      break;
    }
    case 'ArrayExpression':
      for (const e of expr.elements) resolveStyle(e, sheets, out);
      break;
    case 'ConditionalExpression':
      resolveStyle(expr.consequent, sheets, out);
      resolveStyle(expr.alternate, sheets, out);
      break;
    case 'LogicalExpression':
      resolveStyle(expr.right, sheets, out);
      break;
    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
      if (expr.body.type !== 'BlockStatement') resolveStyle(expr.body, sheets, out);
      break;
  }
  return out;
}

const num = (v: any): number | undefined => (v?.type === 'NumericLiteral' ? v.value : undefined);

function jsxElements(f: SourceFile, fn: (el: any) => void) {
  walk(f.ast!.program, (n: any) => {
    if (n.type === 'JSXElement') fn(n);
  });
}

function importsFrom(f: SourceFile, pred: (src: string) => boolean): { names: Set<string>; node: any | null } {
  const names = new Set<string>();
  let node: any = null;
  for (const st of f.ast!.program.body as any[]) {
    if (st.type === 'ImportDeclaration' && pred(st.source.value)) {
      node ??= st;
      for (const s of st.specifiers) names.add(s.imported?.name ?? s.local.name);
    }
  }
  return { names, node };
}

function children(el: any): any[] {
  return (el.children ?? []).filter((c: any) => c.type === 'JSXElement' || (c.type === 'JSXText' && c.value.trim()) || c.type === 'JSXExpressionContainer');
}

// ---------------------------------------------------------------- touch targets

export const rnTouchTarget: Rule = {
  id: 'touch-target-too-small',
  perOccurrence: true,
  title: 'Touch targets under 44 pt',
  platforms: [...RN],
  weight: 2,
  cap: 12,
  why: 'Thumbs are imprecise. Apple asks for a hit region of at least 44×44 pt and Material for 48×48 dp. Small targets cause mis-taps, which users feel as "this app is fiddly" without knowing why.',
  fix: 'Make the pressable itself at least 44×44 (48×48 on Android), or keep the visual small and add hitSlop to reach the minimum.',
  sources: [SRC.hig_buttons, SRC.hig_accessibility, SRC.android_a11y_targets],
  file(f, report) {
    if (!f.ast) return;
    const sheets = styleSheets(f);
    jsxElements(f, (el) => {
      const name = baseName(jsxName(el.openingElement.name));
      const isPressable = PRESSABLES.has(name);
      const iconPress = ICON_NAME.test(name) && !!attr(el, 'onPress');
      if (!isPressable && !iconPress) return;
      if (attr(el, 'hitSlop') || attr(el, 'pressRetentionOffset')) return;
      if (iconPress) {
        const size = num(attrExpr(attr(el, 'size')));
        if (size !== undefined && size < 44) report(el.start, `Icon with onPress is ${size} pt; the tap area is the icon itself. Wrap it in a 44×44 Pressable or add hitSlop.`);
        return;
      }
      const st = resolveStyle(attrExpr(attr(el, 'style')), sheets);
      const dims = (s: Map<string, any>) => {
        const w = Math.max(num(s.get('width')) ?? -1, num(s.get('minWidth')) ?? -1);
        const h = Math.max(num(s.get('height')) ?? -1, num(s.get('minHeight')) ?? -1);
        return { w: w < 0 ? undefined : w, h: h < 0 ? undefined : h };
      };
      let { w, h } = dims(st);
      const padded = ['padding', 'paddingVertical', 'paddingHorizontal', 'paddingTop', 'paddingBottom', 'flex', 'width', 'height', 'minWidth', 'minHeight', 'aspectRatio', 'alignSelf'].some((k) => st.has(k));
      if (w === undefined && h === undefined && !padded) {
        // Pressable without size of its own: its single child decides the target
        const kids = children(el);
        if (kids.length === 1 && kids[0].type === 'JSXElement') {
          const kid = kids[0];
          const ks = resolveStyle(attrExpr(attr(kid, 'style')), sheets);
          ({ w, h } = dims(ks));
          const kname = baseName(jsxName(kid.openingElement.name));
          if (w === undefined && h === undefined && ICON_NAME.test(kname)) {
            const size = num(attrExpr(attr(kid, 'size')));
            if (size !== undefined) w = h = size;
          }
        }
      }
      const small = (w !== undefined && w < 44) || (h !== undefined && h < 44);
      if (small) {
        const shown = `${w ?? '?'}×${h ?? '?'}`;
        report(el.start, `${name} is ${shown} pt. Minimum is 44×44 pt on iOS and 48×48 dp on Android; add size or hitSlop.`);
      }
    });
  },
};

// ---------------------------------------------------------------- press feedback

export const rnNoPressFeedback: Rule = {
  id: 'no-press-feedback',
  perOccurrence: true,
  title: 'Taps without visual feedback',
  platforms: [...RN],
  weight: 2,
  cap: 10,
  why: 'Pressable shows nothing when pressed unless you style the pressed state; TouchableWithoutFeedback never does. On a phone the finger covers the control, so a missing highlight makes taps feel dropped. Empty Pressables that fill their parent (backdrops) and tap-to-dismiss-keyboard handlers are not counted.',
  fix: 'Use style={({ pressed }) => ...} or android_ripple on Pressable, or a component with built-in feedback. Pair important actions with haptics.',
  sources: [SRC.rn_pressable, SRC.m3_states, SRC.hig_buttons],
  file(f, report) {
    if (!f.ast) return;
    jsxElements(f, (el) => {
      const name = baseName(jsxName(el.openingElement.name));
      // tapping outside a field to close the keyboard is not a button
      const onPress = attr(el, 'onPress');
      if (onPress && /Keyboard\.dismiss|\.blur\(\)/.test(f.code.slice(onPress.start, onPress.end))) return;
      if (name === 'TouchableWithoutFeedback' && onPress) {
        report(el.start, 'TouchableWithoutFeedback gives no visual response to a tap.');
        return;
      }
      if (name === 'TouchableOpacity') {
        const ao = num(attrExpr(attr(el, 'activeOpacity')));
        if (ao !== undefined && ao >= 0.95) report(el.start, `activeOpacity={${ao}} turns the press feedback off.`);
        return;
      }
      if (name !== 'Pressable' || !attr(el, 'onPress')) return;
      // an empty Pressable that fills its parent is a backdrop (tap outside to close): there is nothing to highlight
      const st = attr(el, 'style');
      if (!children(el).length && st && /absoluteFill|inset_0|\bflex_1\b|flex:\s*1\b|position:\s*['"]absolute/.test(f.code.slice(st.start, st.end))) return;
      // spread props usually carry the pressed state or handlers from a hook; unknown, so not flagged
      if (el.openingElement.attributes.some((a: any) => a.type === 'JSXSpreadAttribute')) return;
      const style = attrExpr(attr(el, 'style'));
      const fnStyle = style && (style.type === 'ArrowFunctionExpression' || style.type === 'FunctionExpression');
      const fnChild = (el.children ?? []).some((c: any) => c.type === 'JSXExpressionContainer' && /Function/.test(c.expression?.type ?? ''));
      if (fnStyle || fnChild || attr(el, 'android_ripple') || attr(el, 'onPressIn')) return;
      report(el.start, 'Pressable has no pressed style, ripple or onPressIn, so a tap shows nothing.');
    });
  },
};

// ---------------------------------------------------------------- a11y label

export const rnIconButtonLabel: Rule = {
  id: 'icon-button-no-label',
  perOccurrence: true,
  title: 'Icon-only buttons without a label',
  platforms: [...RN],
  weight: 1,
  cap: 6,
  why: 'A screen reader announces an unlabeled icon button as "button" and nothing else. Labels also feed Voice Control and Switch Access, so "tap Settings" works.',
  fix: 'Add accessibilityLabel (and accessibilityRole="button") to every pressable whose only child is an icon.',
  sources: [SRC.rn_a11y, SRC.hig_accessibility],
  file(f, report) {
    if (!f.ast) return;
    const lucide = importsFrom(f, (s) => /lucide|heroicons|phosphor|tabler/.test(s)).names;
    jsxElements(f, (el) => {
      const name = baseName(jsxName(el.openingElement.name));
      if (!PRESSABLES.has(name)) return;
      if (attr(el, 'accessibilityLabel') || attr(el, 'aria-label') || attr(el, 'accessibilityLabelledBy') || attr(el, 'aria-labelledby')) return;
      let hasText = false;
      let hasIcon = false;
      walk(el.children, (n: any, parent: any) => {
        if (n.type === 'JSXText' && n.value.trim()) hasText = true;
        const isChild = !parent || parent.type === 'JSXElement' || parent.type === 'JSXFragment';
        if (isChild && n.type === 'JSXExpressionContainer' && n.expression?.type !== 'JSXEmptyExpression' && n.expression?.type !== 'JSXElement') hasText = true;
        if (n.type === 'JSXOpeningElement') {
          const nm = baseName(jsxName(n.name));
          if (/Text$/.test(nm)) hasText = true;
          if (ICON_NAME.test(nm) || lucide.has(nm)) hasIcon = true;
        }
      });
      if (hasIcon && !hasText) report(el.start, `${name} contains only an icon and has no accessibilityLabel.`);
    });
  },
};

// ---------------------------------------------------------------- safe area

export const rnDeprecatedSafeArea: Rule = {
  id: 'rn-safe-area-view',
  perOccurrence: true,
  title: "React Native's built-in SafeAreaView",
  platforms: [...RN],
  weight: 3,
  cap: 6,
  why: "React Native's own SafeAreaView only pads on iOS and is deprecated; on Android content slides under the status bar and the gesture bar, especially now that Android 15 draws apps edge to edge.",
  fix: "Import SafeAreaView (or useSafeAreaInsets) from 'react-native-safe-area-context', which works on both platforms.",
  sources: [SRC.rn_safeareaview, SRC.expo_safe_areas],
  file(f, report) {
    if (!f.ast) return;
    for (const st of f.ast.program.body as any[]) {
      if (st.type !== 'ImportDeclaration' || st.source.value !== 'react-native') continue;
      const sp = st.specifiers.find((s: any) => s.imported?.name === 'SafeAreaView');
      if (sp) report(sp.start, "SafeAreaView from 'react-native' is iOS-only and deprecated.");
    }
  },
};

// ---------------------------------------------------------------- font scaling

export const rnFontScaling: Rule = {
  id: 'font-scaling-disabled',
  title: 'Font scaling turned off',
  platforms: [...RN],
  weight: 4,
  cap: 12,
  why: 'People who set a larger text size in system settings depend on apps following it. Turning scaling off pins every label to one size, which makes the app hard to read for exactly those people. Icon components are not counted. Each finding costs points regardless of app size: one override in a shared Text component turns scaling off everywhere.',
  fix: 'Remove allowFontScaling={false}. If a layout breaks at large sizes, cap growth with maxFontSizeMultiplier (around 1.5-2) and let rows wrap.',
  sources: [SRC.rn_text_scaling, SRC.hig_typography],
  file(f, report) {
    if (!f.ast) return;
    walk(f.ast.program, (n: any, parent: any) => {
      // an icon font glyph is an icon, sized like the SVG icons next to it, not text
      if (n.type === 'JSXAttribute' && parent?.type === 'JSXOpeningElement' && (ICON_NAME.test(baseName(jsxName(parent.name))) || /IconSet$|Glyph/.test(jsxName(parent.name)))) return;
      if (n.type === 'JSXAttribute' && n.name?.name === 'allowFontScaling') {
        const v = attrExpr(n);
        if (v?.type === 'BooleanLiteral' && v.value === false) report(n.start, 'allowFontScaling={false} ignores the user’s text size.');
      }
      if (n.type === 'JSXAttribute' && n.name?.name === 'maxFontSizeMultiplier') {
        const v = num(attrExpr(n));
        if (v !== undefined && v > 0 && v <= 1.15) report(n.start, `maxFontSizeMultiplier={${v}} effectively disables font scaling.`);
      }
      if (n.type === 'AssignmentExpression' && n.left?.type === 'MemberExpression' && n.left.property?.name === 'allowFontScaling' && n.right?.type === 'BooleanLiteral' && !n.right.value) {
        report(n.start, 'Font scaling disabled globally.');
      }
    });
  },
};

// ---------------------------------------------------------------- modal

export const rnModal: Rule = {
  id: 'modal-instead-of-sheet',
  perOccurrence: true,
  title: 'Custom modals instead of sheets',
  platforms: [...RN],
  weight: 2,
  cap: 6,
  why: 'A full-screen <Modal> with a centered card is a web pattern. Both platforms present secondary tasks as sheets that slide up, can be dismissed with a swipe, and keep context visible.',
  fix: 'Use presentationStyle="pageSheet"/"formSheet" on iOS, an Expo Router route with presentation: "formSheet", or a bottom sheet component.',
  sources: [SRC.rn_modal, SRC.hig_sheets, SRC.m3_bottom_sheets],
  file(f, report) {
    if (!f.ast) return;
    const rnImports = importsFrom(f, (s) => s === 'react-native').names;
    if (!rnImports.has('Modal')) return;
    // presentationStyle is iOS-only; an Android-only file has no sheet style to pick
    if (/\.android\.[jt]sx?$/.test(f.rel)) return;
    jsxElements(f, (el) => {
      if (jsxName(el.openingElement.name) !== 'Modal') return;
      const ps = attrExpr(attr(el, 'presentationStyle'));
      // also `presentationStyle={isPad ? 'formSheet' : 'pageSheet'}`
      if (ps && /pageSheet|formSheet/.test(f.code.slice(ps.start, ps.end))) return;
      report(el.start, 'Modal without a sheet presentation; consider a native sheet.');
    });
  },
};

// ---------------------------------------------------------------- keyboard

const KEYBOARD_HANDLED = /KeyboardAvoidingView|KeyboardAware|KeyboardAvoidingScrollView|keyboard-controller|automaticallyAdjustKeyboardInsets|KeyboardStickyView|KeyboardToolbar|softwareKeyboardLayoutMode/;
/** Components that move content out of the keyboard's way (not just a KeyboardProvider at the root). */
const KEYBOARD_AVOIDS = /<(?:KeyboardAvoidingView|KeyboardAware\w*|KeyboardAvoidingScrollView|KeyboardStickyView)\b|automaticallyAdjustKeyboardInsets/;

/** `Foo.tsx`, `Foo.ios.tsx` and `Foo/index.tsx` all define the component `Foo`. */
function componentName(rel: string): string {
  const parts = rel.split('/');
  const base = parts[parts.length - 1].replace(/(\.(?:ios|android|native))?\.[cm]?[jt]sx?$/, '');
  return base === 'index' ? parts[parts.length - 2] ?? base : base;
}

const keyboardCache = new WeakMap<Project, Set<string>>();

/**
 * Files whose TextInputs are covered by keyboard handling somewhere in the tree:
 * the file handles it, renders a wrapper whose file avoids the keyboard (e.g. a ScreenWrapper
 * with a KeyboardAvoidingView), or is rendered by a covered file. Matching is by component name.
 */
function keyboardCovered(p: Project): Set<string> {
  const hit = keyboardCache.get(p);
  if (hit) return hit;
  const files = p.files.filter((f) => f.platform === 'react-native' && f.ast);
  const renders = new Map<string, Set<string>>();
  for (const f of files) {
    const names = new Set<string>();
    walk(f.ast!.program, (n: any) => {
      if (n.type !== 'JSXOpeningElement') return;
      let x = n.name;
      while (x?.type === 'JSXMemberExpression') x = x.object;
      if (x?.type === 'JSXIdentifier') names.add(x.name);
    });
    renders.set(f.rel, names);
  }
  // a wrapper avoids the keyboard itself, or passes its children into another wrapper (ScreenWrapper -> Container -> KeyboardAvoidingView)
  const wrappers = new Set(files.filter((f) => KEYBOARD_AVOIDS.test(f.code)).map((f) => componentName(f.rel)));
  for (let grew = true; grew; ) {
    grew = false;
    for (const f of files) {
      const name = componentName(f.rel);
      if (wrappers.has(name) || !/\bchildren\b/.test(f.code) || ![...renders.get(f.rel)!].some((n) => wrappers.has(n))) continue;
      wrappers.add(name);
      grew = true;
    }
  }
  // seeds avoid the keyboard for everything they render; a bare keyboard-controller import (a KeyboardProvider at the root) only counts for its own file
  const seeds = files.filter((f) => KEYBOARD_AVOIDS.test(f.code) || [...renders.get(f.rel)!].some((n) => wrappers.has(n))).map((f) => f.rel);
  const covered = new Set([...seeds, ...files.filter((f) => KEYBOARD_HANDLED.test(f.code)).map((f) => f.rel)]);
  const byName = new Map<string, string[]>();
  for (const f of files) byName.set(componentName(f.rel), [...(byName.get(componentName(f.rel)) ?? []), f.rel]);
  const queue = [...seeds];
  while (queue.length) {
    const rel = queue.pop()!;
    for (const n of renders.get(rel) ?? []) {
      for (const child of byName.get(n) ?? []) {
        if (covered.has(child)) continue;
        covered.add(child);
        queue.push(child);
      }
    }
  }
  keyboardCache.set(p, covered);
  return covered;
}

export const rnKeyboard: Rule = {
  id: 'keyboard-covers-input',
  perOccurrence: true,
  title: 'Keyboard can cover text fields',
  platforms: [...RN],
  weight: 3,
  cap: 6,
  why: 'Without keyboard handling the field the user is typing into slides under the keyboard, together with the submit button. A field counts as handled when its file avoids the keyboard, renders a wrapper component that does (such as a ScreenWrapper with a KeyboardAvoidingView), or is rendered, at any depth, by such a file.',
  fix: 'Wrap the form in KeyboardAvoidingView (behavior="padding" on iOS), use automaticallyAdjustKeyboardInsets on the ScrollView, or react-native-keyboard-controller.',
  sources: [SRC.rn_kav, SRC.expo_keyboard],
  file(f, report, p) {
    if (!f.ast) return;
    if (keyboardCovered(p).has(f.rel)) return;
    let first: any = null;
    jsxElements(f, (el) => {
      if (!first && baseName(jsxName(el.openingElement.name)) === 'TextInput') first = el;
    });
    if (first) report(first.start, 'TextInput on a screen with no keyboard avoidance.');
  },
};

// ---------------------------------------------------------------- navigation

export const rnDrawer: Rule = {
  id: 'hamburger-navigation',
  title: 'Hamburger drawer as main navigation',
  platforms: [...RN],
  weight: 6,
  cap: 6,
  why: 'A drawer hides destinations behind a tap and sits at the top of the screen, out of thumb reach. iOS uses a tab bar for top-level sections; Material 3 uses a navigation bar for three to five destinations. A drawer in an app that also has a tab bar is not counted.',
  fix: 'Move top-level destinations into bottom tabs (Expo Router Tabs or NativeTabs). Keep a drawer only for large, rarely used sets of destinations or tablets.',
  sources: [SRC.hig_tabbars, SRC.m3_nav_bar, SRC.m3_nav_drawer],
  file(f, report, p) {
    if (!f.ast) return;
    const imp = importsFrom(f, (s) => s === '@react-navigation/drawer' || s === 'expo-router/drawer');
    if (imp.node && !hasBottomNav(p, 'react-native')) report(imp.node.start, 'Drawer navigation used for app sections, and the app has no tab bar.');
  },
};

// ---------------------------------------------------------------- shadows

export const rnIosOnlyShadow: Rule = {
  id: 'ios-only-shadow',
  perOccurrence: true,
  title: 'Shadows that only exist on iOS',
  platforms: [...RN],
  weight: 1,
  cap: 4,
  why: 'shadowColor/shadowOffset/shadowRadius are iOS-only in React Native. On Android the card renders flat, so the design differs per platform by accident.',
  fix: 'Add elevation for Android, or use the cross-platform boxShadow style (React Native 0.76+, New Architecture).',
  sources: [SRC.rn_shadow, SRC.m3_elevation],
  file(f, report) {
    if (!f.ast) return;
    walk(f.ast.program, (n: any, parent: any) => {
      if (n.type !== 'ObjectExpression') return;
      if (parent?.type === 'ObjectProperty' && (parent.key?.name ?? parent.key?.value) === 'ios') return;
      const keys = new Set(n.properties.map((p: any) => p.key?.name ?? p.key?.value));
      const hasShadow = keys.has('shadowColor') || keys.has('shadowRadius') || keys.has('shadowOffset');
      if (hasShadow && !keys.has('elevation') && !keys.has('boxShadow') && !keys.has('android')) report(n.start, 'Shadow props without elevation: flat on Android.');
    });
  },
};

export const rnRules: Rule[] = [rnTouchTarget, rnNoPressFeedback, rnIconButtonLabel, rnDeprecatedSafeArea, rnFontScaling, rnModal, rnKeyboard, rnDrawer, rnIosOnlyShadow];
