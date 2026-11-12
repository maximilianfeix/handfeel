import { DEFAULT_AI_ACCENTS, hex6, isAiPurple, parseArgbInt, parseCssColor, type RGB } from '../color.js';
import { callSpan } from '../lex.js';
import { walk, type SourceFile } from '../source.js';
import { SRC } from './sources.js';
import { colorLiterals, matches, numbersIn, onGrid, type Project, type Rule } from './api.js';

const ALL = ['react-native', 'flutter', 'swiftui', 'compose'] as const;

// ---------------------------------------------------------------- emoji

const PICTO = /\p{Extended_Pictographic}/u;
let segmenter: Intl.Segmenter | undefined;
function isEmojiOnly(raw: string): boolean {
  const s = raw.trim();
  if (!s || s.length > 16) return false;
  // U+FE0E asks for the text glyph (⚠︎), a typographic symbol rather than a color emoji
  if (s.includes('\uFE0E')) return false;
  // every grapheme must be pictographic, so a string without one cannot qualify (cheap pre-check)
  if (!PICTO.test(s)) return false;
  const seg = (segmenter ??= new Intl.Segmenter('en', { granularity: 'grapheme' }));
  const parts = [...seg.segment(s)].map((x) => x.segment).filter((g) => g.trim());
  if (parts.length < 1 || parts.length > 3) return false;
  return parts.every((g) => {
    const cp = g.codePointAt(0)!;
    return PICTO.test(g) && cp >= 0x2300;
  });
}

/** The emoji is a placeholder in string processing (`.replaceAll('☢', ...)`), not something shown. */
function isEmojiData(f: SourceFile, offset: number): boolean {
  const lineStart = f.code.lastIndexOf('\n', offset - 1) + 1;
  const before = f.code.slice(lineStart, offset);
  return /\.(?:replace|replaceAll|split|includes|indexOf|startsWith|endsWith|contains|join)\(\s*(?:[^,()]*,\s*)?$/.test(before);
}

export const emojiAsIcon: Rule = {
  id: 'emoji-as-icon',
  perOccurrence: true,
  title: 'Emoji used as icons',
  platforms: [...ALL],
  weight: 2,
  cap: 10,
  why: 'Emoji render differently on every OS version and vendor, ignore your tint color and text weight, and read as placeholder art. Platform icon sets (SF Symbols, Material Symbols) match the system font and scale with Dynamic Type.',
  fix: 'Replace with SF Symbols (iOS), Material Symbols (Android) or one consistent icon set; give icon-only controls an accessibility label.',
  sources: [SRC.hig_sfsymbols, SRC.m3_icons, SRC.catalog],
  file(f, report) {
    const hits = f.strings.filter((s) => isEmojiOnly(s.value) && !isEmojiData(f, s.start));
    // Five or more emoji strings in one list are a picker or a reaction bar: content, not icons.
    const skip = new Set<number>();
    let run: typeof hits = [];
    const flush = () => {
      if (run.length >= 5) for (const h of run) skip.add(h.start);
      run = [];
    };
    for (const h of hits) {
      const prev = run[run.length - 1];
      if (prev && /^[\s,]*$/.test(f.masked.slice(prev.end, h.start))) run.push(h);
      else {
        flush();
        run = [h];
      }
    }
    flush();
    for (const s of hits) if (!skip.has(s.start)) report(s.start, `"${s.value.trim()}" is an emoji standing in for an icon.`);
  },
};

// ---------------------------------------------------------------- colors

function namedColorHits(f: SourceFile): { offset: number; raw: string }[] {
  const out: { offset: number; raw: string }[] = [];
  // translucent black is a scrim or shadow (see isScrim)
  if (f.lang === 'dart') {
    for (const m of matches(/\bColors\.(?!transparent\b)([a-zA-Z]+)\b/, f.masked)) {
      if (m[1] === 'black' && /^\.with(?:Opacity|Values|Alpha)\(/.test(f.code.slice(m.index + m[0].length))) continue;
      out.push({ offset: m.index, raw: m[0] });
    }
  } else if (f.lang === 'kotlin') {
    for (const m of matches(/\bColor\.(White|Black|Red|Green|Blue|Yellow|Cyan|Magenta|Gray|LightGray|DarkGray)\b/, f.masked)) {
      if (m[1] === 'Black' && /^\s*\.copy\(\s*alpha/.test(f.code.slice(m.index + m[0].length))) continue;
      out.push({ offset: m.index, raw: m[0] });
    }
  } else if (f.lang === 'swift') {
    // Color.red, .blue, .indigo ... are system colors that adapt to dark mode and
    // Increase Contrast; only white and black are fixed.
    for (const m of matches(/\bColor\.(white|black)\b/, f.masked)) {
      if (m[1] === 'black' && /^\s*\.opacity\(/.test(f.code.slice(m.index + m[0].length))) continue;
      out.push({ offset: m.index, raw: m[0] });
    }
  }
  return out;
}

/** Fully transparent, or translucent black: a scrim or shadow, the same in light and dark (Material's scrim role is black in both). */
function isScrim(c: RGB): boolean {
  return c.a === 0 || (c.r === 0 && c.g === 0 && c.b === 0 && c.a < 1);
}

const SCHEME_WORD = /isDark|darkMode|DarkTheme|Brightness\.dark|\.dark\b|['"]dark['"]|isLight|['"]light['"]|(?:scheme|brightness|appearance)\s*===?/i;
const CONDITIONAL = /\?(?![.?:])|\bif\b|\belse\b|\bwhen\b/;

/** The literal is one side of a light/dark choice (`isDark ? '#10161F' : '#FFFFFF'`), which is what adapting means. */
function inSchemeConditional(f: SourceFile, offset: number): boolean {
  let start = offset;
  for (let i = 0; i < 3 && start > 0; i++) start = Math.max(0, f.code.lastIndexOf('\n', start - 1));
  const win = f.code.slice(start, offset);
  return SCHEME_WORD.test(win) && CONDITIONAL.test(win);
}

/** Attribute ranges of react-native-svg elements: fills in a vector logo or illustration are artwork. */
function svgImports(f: SourceFile): Set<string> {
  const names = new Set<string>();
  if (f.lang !== 'js' || !f.ast) return names;
  for (const st of f.ast.program.body as any[]) {
    if (st.type !== 'ImportDeclaration' || st.source.value !== 'react-native-svg') continue;
    for (const sp of st.specifiers) names.add(sp.local.name);
  }
  return names;
}

function svgArtworkRanges(f: SourceFile): [number, number][] {
  const out: [number, number][] = [];
  const names = svgImports(f);
  if (!names.size || !f.ast) return out;
  walk(f.ast.program, (n: any) => {
    if (n.type !== 'JSXOpeningElement') return;
    const root = n.name.type === 'JSXMemberExpression' ? n.name.object?.name : n.name.name;
    if (names.has(root) && n.attributes.length) out.push([n.attributes[0].start, n.attributes[n.attributes.length - 1].end]);
  });
  return out;
}

/**
 * Membership test for a set of [start, end) ranges: merged and binary-searched, so a large file
 * with thousands of JSX attributes is not quadratic.
 */
function inAnyRange(ranges: [number, number][]): (o: number) => boolean {
  const sorted = [...ranges].sort((x, y) => x[0] - y[0]);
  const merged: [number, number][] = [];
  for (const [a, b] of sorted) {
    const last = merged[merged.length - 1];
    if (last && a <= last[1]) last[1] = Math.max(last[1], b);
    else merged.push([a, b]);
  }
  return (o) => {
    let lo = 0;
    let hi = merged.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (o < merged[mid][0]) hi = mid - 1;
      else if (o >= merged[mid][1]) lo = mid + 1;
      else return true;
    }
    return false;
  };
}

const STYLE_KEY = /color$|^(?:fill|stroke|background|tint|border|shadow|outline)$/i;

/**
 * Offsets of colors that are given a name rather than applied: `gray1: '#F3F3F8'` in a palette
 * object, `const accent = '#0085FF'`, `static const brand = Color(0xFF...)`. Naming a color is
 * what a token does; literals under style keys (backgroundColor, color, fill) or inside
 * StyleSheet.create and JSX are applications and still count.
 */
function namedColorDefinitions(f: SourceFile): Set<number> {
  const out = new Set<number>();
  if (f.lang === 'js') {
    if (!f.ast) return out;
    const applied: [number, number][] = [];
    walk(f.ast.program, (n: any) => {
      if (n.type === 'JSXAttribute') applied.push([n.start, n.end]);
      if (n.type === 'CallExpression' && n.callee?.type === 'MemberExpression' && n.callee.object?.name === 'StyleSheet') applied.push([n.start, n.end]);
    });
    const inApplied = inAnyRange(applied);
    walk(f.ast.program, (n: any) => {
      if (n.type === 'ObjectProperty' && n.value?.type === 'StringLiteral') {
        const key = String(n.key?.name ?? n.key?.value ?? '');
        if (key && !STYLE_KEY.test(key) && !inApplied(n.value.start)) out.add(n.value.start);
      }
      if (n.type === 'VariableDeclarator' && n.init?.type === 'StringLiteral' && !STYLE_KEY.test(n.id?.name ?? '') && !inApplied(n.init.start)) out.add(n.init.start);
    });
    return out;
  }
  for (const m of matches(/^[ \t]*(?:(?:static|private|public|internal|override|fileprivate)\s+)*(?:const|final|val|let|var)\s+([A-Za-z_]\w*)\s*(?::\s*[\w.?]+\s*)?=\s*(?:const\s+)?/m, f.code)) {
    if (STYLE_KEY.test(m[1])) continue;
    out.add(m.index + m[0].length);
  }
  // a color per enum case: `WonderType.petra => Color(...)` (Dart), `Kind.Alert -> Color(...)` (Kotlin), `case .alert: return Color(...)` (Swift)
  for (const m of matches(/^[ \t]*(?:[A-Z]\w*)?\.\w+\s*(?:=>|->)\s*(?:const\s+)?|^[ \t]*case\s+\.\w+\s*:\s*(?:return\s+)?/m, f.code)) out.add(m.index + m[0].length);
  return out;
}

export const hardcodedColor: Rule = {
  id: 'hardcoded-color',
  perOccurrence: true,
  title: 'Colors hard-coded in screens',
  platforms: [...ALL],
  weight: 0.5,
  cap: 10,
  why: 'A hex value in a screen is the same in light and dark mode, in high-contrast mode and in every theme. Semantic colors (label, background, primary, onSurface) adapt; literals are how dark mode ends up half-broken. Not counted: token files, colors given a name (gray1: #F3F3F8 in a palette, static const brand = Color(...)), values picked per color scheme (isDark ? a : b), transparent and translucent black (scrims, shadows), fills inside SVG artwork, and SwiftUI system colors such as Color.red, which adapt.',
  fix: 'Move the value into your theme/tokens and reference it by role (e.g. colors.surface, Theme.of(context).colorScheme.primary, MaterialTheme.colorScheme.onSurface, Color(.label)).',
  sources: [SRC.hig_color, SRC.m3_color_roles, SRC.swiftui_system_colors],
  file(f, report) {
    if (f.isTokenFile) return;
    const literals = colorLiterals(f);
    const named = namedColorHits(f);
    if (!literals.length && !named.length) return;
    const inArt = inAnyRange(svgArtworkRanges(f));
    const definitions = namedColorDefinitions(f);
    const skip = (o: number) => definitions.has(o) || inSchemeConditional(f, o) || inArt(o);
    for (const h of literals) {
      if (isScrim(h.rgb) || skip(h.offset)) continue;
      report(h.offset, `${h.raw.length > 30 ? hex6(h.rgb) : h.raw} is a literal color; use a theme role instead.`);
    }
    for (const h of named) {
      if (skip(h.offset)) continue;
      report(h.offset, `${h.raw} is a fixed palette color; use a theme role instead.`);
    }
  },
};

export const defaultAiAccent: Rule = {
  id: 'default-ai-accent',
  title: 'Default "AI purple" accent',
  platforms: [...ALL],
  weight: 3,
  cap: 6,
  why: 'Tailwind indigo/violet 500-600, #667eea → #764ba2 and #6C63FF are stock values from templates and UI kits that generated code reuses when nobody picked a brand color. In the slop catalog sample, 3 of 7 generated apps used a color from this indigo-violet band without being asked to.',
  fix: 'Choose a brand color on purpose. If you keep a purple, change hue, lightness or saturation so it is yours, and define it once as a token.',
  sources: [SRC.catalog],
  file(f, report) {
    const seen = new Set<string>();
    for (const h of colorLiterals(f)) {
      const hx = hex6(h.rgb);
      if (DEFAULT_AI_ACCENTS.has(hx) && !seen.has(hx)) {
        seen.add(hx);
        report(h.offset, `${hx} is one of the stock accents generated apps default to.`);
      }
    }
  },
};

// ---------------------------------------------------------------- gradients

interface Gradient {
  offset: number;
  colors: RGB[];
}

function resolveRefs(span: string, p: Project): RGB[] {
  const out: RGB[] = [];
  for (const m of matches(/\b(?:[A-Za-z_$][\w$]*\.)*([A-Za-z_$][\w$]*)\b/, span)) {
    const c = p.colorSymbols.get(m[1]);
    if (c) out.push(c);
  }
  return out;
}

function literalColorsIn(span: string, lang: SourceFile['lang']): RGB[] {
  const out: RGB[] = [];
  if (lang === 'js' || lang === 'swift') {
    for (const m of matches(/['"](#[0-9a-fA-F]{3,8}|rgba?\([^'"]+\))['"]/, span)) {
      const c = parseCssColor(m[1]);
      if (c) out.push(c);
    }
  }
  if (lang === 'swift') {
    for (const m of matches(/hex:\s*0x([0-9a-fA-F]{6})/, span)) {
      const c = parseCssColor('#' + m[1]);
      if (c) out.push(c);
    }
  }
  if (lang === 'dart' || lang === 'kotlin') {
    for (const m of matches(/Color\(\s*(0x[0-9a-fA-F]{8})\s*\)/, span)) {
      const c = parseArgbInt(m[1]);
      if (c) out.push(c);
    }
  }
  return out;
}

/** purple-gradient and gradient-overuse both need the gradients of a file; find them once per scan. */
const gradientCache = new WeakMap<SourceFile, Gradient[]>();

export function gradients(f: SourceFile, p: Project): Gradient[] {
  let hit = gradientCache.get(f);
  if (!hit) {
    hit = findGradients(f, p);
    gradientCache.set(f, hit);
  }
  return hit;
}

function findGradients(f: SourceFile, p: Project): Gradient[] {
  const out: Gradient[] = [];
  if (f.lang === 'js') {
    if (!f.ast) return out;
    const svg = svgImports(f);
    walk(f.ast.program, (n: any) => {
      if (n.type === 'JSXOpeningElement') {
        const name = n.name.type === 'JSXIdentifier' ? n.name.name : n.name.type === 'JSXMemberExpression' ? n.name.property.name : '';
        if (!/Gradient$/.test(name)) return;
        // <LinearGradient> from react-native-svg is a gradient definition inside vector artwork
        if (n.name.type === 'JSXIdentifier' ? svg.has(name) : svg.has(n.name.object?.name)) return;
        const attr = n.attributes.find((a: any) => a.type === 'JSXAttribute' && a.name.name === 'colors');
        const span = attr ? f.code.slice(attr.start, attr.end) : '';
        out.push({ offset: n.start, colors: [...literalColorsIn(span, 'js'), ...resolveRefs(span.replace(/^colors=/, ''), p)] });
      }
      // gradient definitions in theme objects: `gradient: ['#..', '#..']`, `heroGradient = [...]`
      if ((n.type === 'ObjectProperty' || n.type === 'VariableDeclarator') && n[n.type === 'ObjectProperty' ? 'value' : 'init']?.type === 'ArrayExpression') {
        const keyNode = n.type === 'ObjectProperty' ? n.key : n.id;
        const key = keyNode?.name ?? keyNode?.value ?? '';
        if (!/gradient/i.test(String(key))) return;
        const arr = n.type === 'ObjectProperty' ? n.value : n.init;
        const cs = arr.elements.map((e: any) => (e?.type === 'StringLiteral' ? parseCssColor(e.value) : null)).filter(Boolean) as RGB[];
        if (cs.length >= 2) out.push({ offset: n.start, colors: cs });
      }
    });
    return out;
  }
  const re =
    f.lang === 'dart'
      ? /\b(?:Linear|Radial|Sweep)Gradient\s*\(/
      : f.lang === 'kotlin'
        ? /\bBrush\.(?:linear|horizontal|vertical|radial|sweep)Gradient\s*\(/
        : /(?:\b(?:Linear|Radial|Angular|Elliptical)Gradient|\.linearGradient|\.radialGradient)\s*\(/;
  for (const m of matches(re, f.masked)) {
    const paren = m.index + m[0].length - 1;
    const span = callSpan(f.masked, paren);
    if (!span) continue;
    const text = f.code.slice(span.args[0], span.args[1]);
    // Kotlin: listOf(...) or colorStops; Swift: colors: [...] or Gradient(colors:)
    out.push({ offset: m.index, colors: [...literalColorsIn(text, f.lang), ...resolveRefs(text, p)] });
  }
  return out;
}

/**
 * Lists of two or three colors stored under a gradient-like name, e.g. a workout's
 * `colors: [Color(0xFF7C5CFF), Color(0xFFB04CFF)]` that a card later passes to LinearGradient.
 * Lists inside a gradient call are already covered by gradients().
 */
function gradientColorLists(f: SourceFile, p: Project): Gradient[] {
  if (f.lang === 'js') return [];
  const out: Gradient[] = [];
  const callRe =
    f.lang === 'dart' ? /\b(?:Linear|Radial|Sweep)Gradient\s*\(/ : f.lang === 'kotlin' ? /\bBrush\.\w*Gradient\s*\(/ : /(?:Gradient|\.linearGradient|\.radialGradient)\s*\(/;
  const inside: [number, number][] = [];
  for (const m of matches(callRe, f.masked)) {
    const span = callSpan(f.masked, m.index + m[0].length - 1);
    if (span) inside.push(span.args);
  }
  const listRe = f.lang === 'kotlin' ? /\b(\w*(?:[Gg]radient|[Cc]olors))\s*(?:=|:)\s*listOf\s*\(/ : /\b(\w*(?:[Gg]radient|[Cc]olors))\s*:\s*(?:const\s+)?\[/;
  for (const m of matches(listRe, f.masked)) {
    if (inside.some(([a, b]) => m.index > a && m.index < b)) continue;
    const open = m.index + m[0].length - 1;
    const close = f.masked[open] === '(' || f.masked[open] === '[' ? callSpanEnd(f.masked, open) : -1;
    if (close < 0) continue;
    const text = f.code.slice(open + 1, close);
    const colors = [...literalColorsIn(text, f.lang), ...resolveRefs(text, p)];
    if (colors.length >= 2 && colors.length <= 3) out.push({ offset: m.index, colors });
  }
  return out;
}

function callSpanEnd(masked: string, open: number): number {
  const o = masked[open];
  const c = o === '(' ? ')' : ']';
  let depth = 0;
  for (let k = open; k < masked.length; k++) {
    if (masked[k] === o) depth++;
    else if (masked[k] === c && --depth === 0) return k;
  }
  return -1;
}

export const purpleGradient: Rule = {
  id: 'purple-gradient',
  title: 'Indigo-to-violet gradients',
  platforms: [...ALL],
  weight: 5,
  cap: 10,
  why: 'Generated apps put a blue-violet gradient on hero cards, buttons and avatars without being asked (2 of 7 apps in the slop catalog). It reads as a template. Platform guidance gives controls and surfaces semantic color roles; gradients belong to artwork.',
  fix: 'Use a flat fill from your color roles for cards and buttons. Keep gradients for content (artwork, charts) and never for text.',
  sources: [SRC.hig_color, SRC.m3_color_roles, SRC.catalog],
  file(f, report, p) {
    for (const g of gradients(f, p)) {
      const purple = g.colors.filter(isAiPurple);
      if (purple.length) report(g.offset, `Gradient uses ${purple.map(hex6).join(', ')}, the indigo/violet band generated UIs default to.`);
    }
    for (const g of gradientColorLists(f, p)) {
      const purple = g.colors.filter(isAiPurple);
      if (purple.length) report(g.offset, `Gradient colors ${g.colors.map(hex6).join(' → ')} include the indigo/violet band generated UIs default to.`);
    }
  },
};

export const gradientOveruse: Rule = {
  id: 'gradient-overuse',
  perOccurrence: true,
  title: 'Gradients everywhere',
  platforms: [...ALL],
  weight: 1.5,
  cap: 8,
  free: 2,
  why: 'When every card, button and avatar has a gradient, nothing stands out and the screen looks like a template. Platform guidelines reserve strong color for the few things the user should act on. Scrims (transparent to black over images and video) are not counted.',
  fix: 'Keep at most one or two gradients for brand moments. Flat surfaces with clear elevation or borders carry hierarchy better.',
  sources: [SRC.hig_color, SRC.m3_color_roles],
  file(f, report, p) {
    // a fade from transparent to black over media is a legibility scrim, not decoration
    for (const g of gradients(f, p)) if (!(g.colors.length >= 2 && g.colors.every(isScrim))) report(g.offset, 'Gradient fill.');
  },
};

// ---------------------------------------------------------------- glass

/** A ripple, pressed, hover or track color is feedback or a control part, not a surface. */
const FEEDBACK = /ripple|pressed|highlight|underlay|hover|splash|overlayColor|focusColor|trackColor|indicatorColor|thumbColor|dividerColor|cursorColor/i;
/** Apple's materials are meant for bars, sheets and overlays; blur there is not glass on content. */
const BAR_OR_OVERLAY = /app_?bar|tab_?bar|nav(?:igation)?_?bar|tool_?bar|header|bottom_?bar|status_?bar|sheet|overlay|lightbox|chrome|backdrop|modal|dialog|menu|popover/i;

function translucentWhite(rgb: RGB | null) {
  return !!rgb && rgb.r >= 240 && rgb.g >= 240 && rgb.b >= 240 && rgb.a >= 0.04 && rgb.a <= 0.35;
}

export const glassmorphism: Rule = {
  id: 'glassmorphism',
  perOccurrence: true,
  title: 'Glassmorphism on content',
  platforms: ['react-native', 'flutter', 'compose'],
  weight: 2,
  cap: 8,
  free: 1,
  why: 'Frosted cards with thin white borders cost contrast (text over a busy background fails WCAG quickly) and on Android cost GPU time. iOS materials are designed for bars and overlays, not for every card, so blur in files named for bars, headers, sheets, menus or overlays is not counted, and neither are translucent ripple, pressed, hover or track colors.',
  fix: 'Use opaque surfaces for content. On iOS, use system materials only for bars, sheets and overlays; on Android, prefer tonal surface colors.',
  sources: [SRC.hig_materials, SRC.m3_elevation],
  file(f, report) {
    const bar = BAR_OR_OVERLAY.test(f.rel);
    const feedback = (o: number) => FEEDBACK.test(f.code.slice(Math.max(0, o - 80), o));
    if (f.lang === 'js') {
      if (!f.ast) return;
      walk(f.ast.program, (n: any) => {
        if (n.type === 'JSXOpeningElement' && n.name.type === 'JSXIdentifier' && n.name.name === 'BlurView' && !bar) report(n.start, 'BlurView used as a surface.');
      });
      for (const s of f.strings) {
        if (s.kind !== 'StringLiteral' || !translucentWhite(parseCssColor(s.value))) continue;
        // a ripple or pressed-state color is feedback, not a surface
        const before = f.code.slice(Math.max(0, s.start - 80), s.start);
        if (FEEDBACK.test(before)) continue;
        report(s.start, `${s.value} is a frosted-glass fill.`);
      }
      return;
    }
    if (f.lang === 'dart') {
      if (!bar) for (const m of matches(/\bBackdropFilter\s*\(/, f.masked)) report(m.index, 'BackdropFilter blur used as a surface.');
      for (const m of matches(/\bColors\.white\.with(?:Opacity\(\s*|Values\(\s*alpha:\s*)(0?\.\d+)/, f.code)) {
        const a = parseFloat(m[1]);
        if (a >= 0.04 && a <= 0.35 && !feedback(m.index)) report(m.index, `${m[0]}) is a frosted-glass fill.`);
      }
    }
    if (f.lang === 'kotlin') {
      if (!bar) for (const m of matches(/\.blur\(\s*\d/, f.masked)) report(m.index, 'Modifier.blur used as a surface.');
      for (const m of matches(/\bColor\.White\.copy\(\s*alpha\s*=\s*(0?\.\d+)f?/, f.code)) {
        const a = parseFloat(m[1]);
        if (a >= 0.04 && a <= 0.35 && !feedback(m.index)) report(m.index, `${m[0]}) is a frosted-glass fill.`);
      }
    }
  },
};

// ---------------------------------------------------------------- spacing & type

interface NumHit {
  offset: number;
  value: number;
}

export function spacingValues(f: SourceFile): NumHit[] {
  const out: NumHit[] = [];
  if (f.lang === 'js') {
    if (!f.ast) return out;
    walk(f.ast.program, (n: any) => {
      if (n.type !== 'ObjectProperty') return;
      const key = n.key?.name ?? n.key?.value;
      if (!/^(padding|margin)(Horizontal|Vertical|Top|Bottom|Left|Right|Start|End)?$|^(gap|rowGap|columnGap)$/.test(String(key))) return;
      if (n.value.type === 'NumericLiteral') out.push({ offset: n.value.start, value: n.value.value });
    });
    return out;
  }
  const add = (base: number, s: string) => {
    for (const x of numbersIn(s)) out.push({ offset: base + x.index, value: x.value });
  };
  if (f.lang === 'dart') {
    for (const m of matches(/EdgeInsets(?:Directional)?\.(?:all|symmetric|only|fromLTRB|fromSTEB)\(([^()]*)\)/, f.code)) add(m.index + m[0].indexOf('(') + 1, m[1]);
    for (const m of matches(/SizedBox\(\s*(?:height|width):\s*(\d+(?:\.\d+)?)\s*,?\s*\)/, f.code)) add(m.index + m[0].indexOf(m[1]), m[1]);
    for (const m of matches(/\b(?:spacing|runSpacing|mainAxisSpacing|crossAxisSpacing):\s*(\d+(?:\.\d+)?)/, f.code)) add(m.index + m[0].indexOf(m[1]), m[1]);
  }
  if (f.lang === 'swift') {
    for (const m of matches(/\.padding\(\s*(?:\.[a-zA-Z]+\s*,\s*|\[[^\]]*\]\s*,\s*)?(\d+(?:\.\d+)?)\s*\)/, f.code)) add(m.index + m[0].lastIndexOf(m[1]), m[1]);
    for (const m of matches(/\bspacing:\s*(\d+(?:\.\d+)?)/, f.code)) add(m.index + m[0].indexOf(m[1]), m[1]);
  }
  if (f.lang === 'kotlin') {
    for (const m of matches(/\.padding\(([^()]*)\)/, f.code)) {
      for (const x of matches(/(\d+(?:\.\d+)?)\.dp/, m[1])) out.push({ offset: m.index + 9 + x.index, value: parseFloat(x[1]) });
    }
    for (const m of matches(/spacedBy\(\s*(\d+(?:\.\d+)?)\.dp/, f.code)) add(m.index + m[0].indexOf(m[1]), m[1]);
    for (const m of matches(/Spacer\([^)]*\.(?:height|width)\(\s*(\d+(?:\.\d+)?)\.dp/, f.code)) add(m.index + m[0].lastIndexOf(m[1]), m[1]);
  }
  return out;
}

export function fontSizes(f: SourceFile): NumHit[] {
  const out: NumHit[] = [];
  if (f.lang === 'js') {
    if (!f.ast) return out;
    walk(f.ast.program, (n: any) => {
      if (n.type === 'ObjectProperty' && (n.key?.name ?? n.key?.value) === 'fontSize' && n.value.type === 'NumericLiteral') out.push({ offset: n.value.start, value: n.value.value });
    });
    return out;
  }
  const re =
    f.lang === 'dart' ? /\bfontSize:\s*(\d+(?:\.\d+)?)/ : f.lang === 'kotlin' ? /\bfontSize\s*=\s*(\d+(?:\.\d+)?)\.sp/ : /(?:\.system\(\s*size:|Font\.custom\([^)]*size:|\.custom\([^)]*size:)\s*(\d+(?:\.\d+)?)/;
  for (const m of matches(re, f.code)) out.push({ offset: m.index + m[0].lastIndexOf(m[1]), value: parseFloat(m[1]) });
  return out;
}

export const offGridSpacing: Rule = {
  id: 'off-grid-spacing',
  title: 'Spacing off the 4-point grid',
  platforms: [...ALL],
  weight: 1,
  cap: 5,
  free: 3,
  why: 'Values like 10, 14, 15 and 18 next to 16 and 24 produce rows that almost line up. Both platforms lay out on a 4/8-point rhythm; staying on it is what makes spacing feel deliberate.',
  fix: 'Define a spacing scale (4, 8, 12, 16, 24, 32 ...) once and use only those steps.',
  sources: [SRC.m3_spacing, SRC.hig_layout],
  project(p, report) {
    const seen = new Map<number, { file: string; line: number }>();
    for (const f of p.files) {
      for (const h of spacingValues(f)) {
        if (onGrid(h.value) || seen.has(h.value)) continue;
        seen.set(h.value, { file: f.rel, line: f.lines.pos(h.offset).line });
      }
    }
    if (seen.size <= (this.free ?? 0)) return;
    for (const [v, at] of [...seen.entries()].sort((a, b) => a[0] - b[0])) report(at.file, at.line, `Spacing value ${v} is off the 4-point grid (first used here).`);
  },
};

export const typeScaleSprawl: Rule = {
  id: 'type-scale-sprawl',
  title: 'Too many font sizes',
  platforms: [...ALL],
  weight: 1,
  cap: 6,
  free: 8,
  why: 'Generated screens pick a new font size for every label (11, 12, 13, 14, 15, 17, 22, 28, 34, 42 ...). Platform type scales have a handful of named roles; using them gives a clear hierarchy and Dynamic Type/font scaling for free. Sizes defined in theme/token files, or in modules that draw no UI, are the scale and are not counted.',
  fix: 'Map every size to a named role (iOS text styles, Material 3 type scale) and use the role, not the number.',
  sources: [SRC.hig_typography, SRC.m3_type_scale],
  project(p, report) {
    const seen = new Map<number, { file: string; line: number }>();
    for (const f of p.files) {
      // a theme's Typography (all 15 Material 3 roles span 11 sizes) is the scale, not sprawl
      if (f.isTokenFile || !f.rendersUi) continue;
      for (const h of fontSizes(f)) {
        if (seen.has(h.value)) continue;
        seen.set(h.value, { file: f.rel, line: f.lines.pos(h.offset).line });
      }
    }
    const sorted = [...seen.entries()].sort((a, b) => a[0] - b[0]);
    if (sorted.length <= (this.free ?? 0)) return;
    for (const [v, at] of sorted) report(at.file, at.line, `Font size ${v} (${sorted.length} distinct sizes in the project).`);
  },
};

export const commonRules: Rule[] = [emojiAsIcon, hardcodedColor, defaultAiAccent, purpleGradient, gradientOveruse, glassmorphism, offGridSpacing, typeScaleSprawl];
