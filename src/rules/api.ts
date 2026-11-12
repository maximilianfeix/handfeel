import type { RuleMeta, Platform } from '../types.js';
import type { SourceFile } from '../source.js';
import type { Manifests } from '../files.js';
import { parseArgbInt, parseCssColor, type RGB } from '../color.js';

export type Report = (offset: number, message: string) => void;
export type ProjectReport = (file: string, line: number, message: string) => void;

export interface Project {
  root: string;
  files: SourceFile[];
  platforms: Platform[];
  manifests: Manifests;
  /** identifier -> color, collected from every file (theme constants etc.) */
  colorSymbols: Map<string, RGB>;
}

export interface Rule extends RuleMeta {
  file?(f: SourceFile, report: Report, project: Project): void;
  project?(p: Project, report: ProjectReport): void;
}

export function* matches(re: RegExp, text: string): Generator<RegExpExecArray> {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  let m: RegExpExecArray | null;
  while ((m = g.exec(text))) {
    yield m;
    if (m[0].length === 0) g.lastIndex++;
  }
}

/** Evaluates simple numeric expressions used in Swift colors: `0.4`, `99/255`, `99.0 / 255.0`. */
function evalNum(expr: string): number | null {
  const e = expr.trim();
  let m = /^([\d.]+)\s*\/\s*([\d.]+)$/.exec(e);
  if (m) return parseFloat(m[1]) / parseFloat(m[2]);
  m = /^([\d.]+)$/.exec(e);
  if (m) return parseFloat(m[1]);
  return null;
}

export interface ColorHit {
  offset: number;
  rgb: RGB;
  raw: string;
}

/** Literal colors in a file, independent of language. */
export function colorLiterals(f: SourceFile): ColorHit[] {
  const out: ColorHit[] = [];
  if (f.lang === 'js') {
    for (const s of f.strings) {
      if (s.kind !== 'StringLiteral' && s.kind !== 'TemplateElement') continue;
      const rgb = parseCssColor(s.value);
      if (rgb) out.push({ offset: s.start, rgb, raw: s.value });
    }
    return out;
  }
  if (f.lang === 'dart' || f.lang === 'kotlin') {
    for (const m of matches(/\bColor\(\s*(0x[0-9a-fA-F]{8})\s*\)/, f.code)) {
      const rgb = parseArgbInt(m[1]);
      if (rgb) out.push({ offset: m.index, rgb, raw: m[0] });
    }
    for (const m of matches(/\bColor\(\s*0x([0-9a-fA-F]{6})\s*\)/, f.code)) {
      const rgb = parseArgbInt('0xFF' + m[1]);
      if (rgb) out.push({ offset: m.index, rgb, raw: m[0] });
    }
    for (const m of matches(/\bColor\.fromARGB\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/, f.code)) {
      out.push({ offset: m.index, rgb: { a: +m[1] / 255, r: +m[2], g: +m[3], b: +m[4] }, raw: m[0] });
    }
    for (const m of matches(/\bColor\.fromRGBO\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/, f.code)) {
      out.push({ offset: m.index, rgb: { r: +m[1], g: +m[2], b: +m[3], a: +m[4] }, raw: m[0] });
    }
    return out;
  }
  // swift
  for (const m of matches(/\b(?:Color|UIColor)\(\s*hex:\s*"#?([0-9a-fA-F]{6})"/, f.code)) {
    const rgb = parseCssColor('#' + m[1]);
    if (rgb) out.push({ offset: m.index, rgb, raw: m[0] });
  }
  for (const m of matches(/\b(?:Color|UIColor)\(\s*hex:\s*0x([0-9a-fA-F]{6})\b/, f.code)) {
    const rgb = parseCssColor('#' + m[1]);
    if (rgb) out.push({ offset: m.index, rgb, raw: m[0] });
  }
  for (const m of matches(/\b(?:Color|UIColor|#colorLiteral)\(\s*(?:\.sRGB\s*,\s*)?red:\s*([^,]+),\s*green:\s*([^,]+),\s*blue:\s*([^,)]+)/, f.code)) {
    const r = evalNum(m[1]);
    const g = evalNum(m[2]);
    const b = evalNum(m[3]);
    if (r === null || g === null || b === null) continue;
    const scale = r > 1 || g > 1 || b > 1 ? 1 : 255;
    out.push({ offset: m.index, rgb: { r: r * scale, g: g * scale, b: b * scale, a: 1 }, raw: m[0] });
  }
  return out;
}

/** Collects `name = <color>` definitions so gradients that reference theme constants can be resolved. */
export function collectColorSymbols(files: SourceFile[]): Map<string, RGB> {
  const map = new Map<string, RGB>();
  for (const f of files) {
    const hits = colorLiterals(f);
    for (const h of hits) {
      // look back on the same line for `name:` / `name =` / `static const name =`
      const lineStart = f.code.lastIndexOf('\n', h.offset) + 1;
      const before = f.code.slice(lineStart, h.offset);
      const m = /([A-Za-z_$][\w$]*)['"]?\s*(?::|=)\s*(?:const\s+|Color\(\s*)?$/.exec(before);
      if (m) map.set(m[1], h.rgb);
    }
  }
  return map;
}

/** Numbers in a short argument string like `horizontal: 16, vertical: 10` or `16.dp`. */
export function numbersIn(s: string): { value: number; index: number }[] {
  const out: { value: number; index: number }[] = [];
  for (const m of matches(/(?<![\w.])(\d+(?:\.\d+)?)(?![\w])/, s)) out.push({ value: parseFloat(m[1]), index: m.index });
  for (const m of matches(/(?<![\w.])(\d+(?:\.\d+)?)(?=\.(?:dp|sp)\b)/, s)) {
    if (!out.some((o) => o.index === m.index)) out.push({ value: parseFloat(m[1]), index: m.index });
  }
  return out;
}

/**
 * The project also has a bottom navigation bar / tab bar. A drawer next to one is the
 * adaptive pattern (bar on phones, rail or drawer on larger windows), not drawer-only navigation.
 */
export function hasBottomNav(p: Project, platform: Platform): boolean {
  const re =
    platform === 'react-native'
      ? /bottom-tabs|createBottomTabNavigator|NativeTabs|native-tabs|<Tabs[\s>]/
      : platform === 'flutter'
        ? /\b(?:NavigationBar|BottomNavigationBar|CupertinoTabBar|CupertinoTabScaffold)\s*\(/
        : /\b(?:NavigationBar|BottomNavigation|NavigationSuiteScaffold|NavigationSuiteScaffoldLayout)\s*[({]/;
  return p.files.some((f) => f.platform === platform && re.test(f.code));
}

export const onGrid = (v: number) => v <= 2 || v % 4 === 0;
