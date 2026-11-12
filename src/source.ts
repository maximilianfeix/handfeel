import { parse } from '@babel/parser';
import type { File as BabelFile, Node } from '@babel/types';
import { lex, LineIndex, type Lang } from './lex.js';
import type { Platform } from './types.js';

export type FileLang = 'js' | Lang;

export interface StrValue {
  value: string;
  /** offset of the literal (opening quote) */
  start: number;
  end: number;
  /** For JS: the AST node kind ('StringLiteral' | 'JSXText' | 'TemplateElement'). */
  kind?: string;
}

export interface SourceFile {
  rel: string;
  abs: string;
  lang: FileLang;
  platform: Platform;
  text: string;
  /** comments blanked */
  code: string;
  /** comments and string contents blanked */
  masked: string;
  strings: StrValue[];
  lines: LineIndex;
  /** Defines design tokens (theme/colors/palette). Hard-coded values are expected here. */
  isTokenFile: boolean;
  ast?: BabelFile;
  ignore: IgnoreMap;
}

export interface IgnoreMap {
  file: Set<string> | 'all' | null;
  lines: Map<number, Set<string> | 'all'>;
}

const TOKEN_FILE = /(^|\/)(theme|themes|colors?|colours?|palette|tokens?|design[-_]?system|app[-_]?theme|style[-_]?guide|constants\/(colors?|theme))(\.|\/|$)|(theme|colors?|palette|tokens)\.(ts|tsx|js|jsx|dart|swift|kt)$|Theme\.kt$|Color\.kt$|Type\.kt$/i;

export function isTokenPath(rel: string): boolean {
  return TOKEN_FILE.test(rel);
}

function parseIgnores(text: string): IgnoreMap {
  const map: IgnoreMap = { file: null, lines: new Map() };
  const re = /handfeel-ignore(-next-line|-file|-line)?(?:[ \t]+([a-z0-9\-, \t]+))?/g;
  let m: RegExpExecArray | null;
  const lineOf = (off: number) => text.slice(0, off).split('\n').length;
  while ((m = re.exec(text))) {
    const kind = m[1] ?? '-next-line';
    const ids = (m[2] ?? '')
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => /^[a-z][a-z0-9-]+$/.test(s));
    const val: Set<string> | 'all' = ids.length ? new Set(ids) : 'all';
    if (kind === '-file') {
      if (val === 'all' || map.file === 'all') map.file = 'all';
      else map.file = new Set([...(map.file ?? []), ...val]);
      continue;
    }
    const line = lineOf(m.index) + (kind === '-next-line' ? 1 : 0);
    const prev = map.lines.get(line);
    if (val === 'all' || prev === 'all') map.lines.set(line, 'all');
    else map.lines.set(line, new Set([...(prev ?? []), ...val]));
  }
  return map;
}

export function isIgnored(f: SourceFile, rule: string, line: number): boolean {
  const fi = f.ignore.file;
  if (fi === 'all' || fi?.has(rule)) return true;
  const li = f.ignore.lines.get(line);
  return li === 'all' || !!li?.has(rule);
}

function blankRange(arr: string[], a: number, b: number) {
  for (let k = a; k < b; k++) if (arr[k] !== '\n') arr[k] = ' ';
}

/** Generic depth-first walk over a Babel AST. */
export function walk(node: unknown, visit: (n: Node, parent: Node | null) => void, parent: Node | null = null): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const c of node) walk(c, visit, parent);
    return;
  }
  const n = node as Node & Record<string, unknown>;
  if (typeof n.type !== 'string') return;
  visit(n, parent);
  for (const key of Object.keys(n)) {
    if (key === 'loc' || key === 'start' || key === 'end' || key === 'leadingComments' || key === 'trailingComments' || key === 'innerComments' || key === 'extra') continue;
    const v = n[key];
    if (v && typeof v === 'object') walk(v, visit, n);
  }
}

function loadJs(rel: string, text: string): Pick<SourceFile, 'code' | 'masked' | 'strings' | 'ast'> {
  const isTs = /\.(ts|tsx|mts|cts)$/.test(rel);
  const isTsx = /\.tsx$/.test(rel);
  const plugins: any[] = [];
  if (isTs) plugins.push('typescript');
  if (isTsx || !isTs) plugins.push('jsx');
  const ast = parse(text, {
    sourceType: 'unambiguous',
    plugins,
    errorRecovery: true,
    allowReturnOutsideFunction: true,
    allowImportExportEverywhere: true,
  });
  const code = text.split('');
  const masked = text.split('');
  for (const c of ast.comments ?? []) {
    blankRange(code, c.start!, c.end!);
    blankRange(masked, c.start!, c.end!);
  }
  const strings: StrValue[] = [];
  walk(ast.program, (n) => {
    if (n.type === 'StringLiteral') {
      strings.push({ value: n.value, start: n.start!, end: n.end!, kind: n.type });
      blankRange(masked, n.start! + 1, n.end! - 1);
    } else if (n.type === 'TemplateElement') {
      strings.push({ value: n.value.cooked ?? n.value.raw, start: n.start!, end: n.end!, kind: n.type });
      blankRange(masked, n.start!, n.end!);
    } else if (n.type === 'JSXText') {
      if (n.value.trim()) strings.push({ value: n.value, start: n.start!, end: n.end!, kind: n.type });
      blankRange(masked, n.start!, n.end!);
    }
  });
  return { code: code.join(''), masked: masked.join(''), strings, ast };
}

export function loadSource(rel: string, abs: string, text: string, platform: Platform): SourceFile {
  const lang: FileLang = /\.dart$/.test(rel) ? 'dart' : /\.swift$/.test(rel) ? 'swift' : /\.kts?$/.test(rel) ? 'kotlin' : 'js';
  const base = {
    rel,
    abs,
    lang,
    platform,
    text,
    lines: new LineIndex(text),
    isTokenFile: isTokenPath(rel),
    ignore: parseIgnores(text),
  };
  if (lang === 'js') return { ...base, ...loadJs(rel, text) };
  const lx = lex(text, lang);
  return {
    ...base,
    code: lx.code,
    masked: lx.masked,
    strings: lx.strings.map((s) => ({ value: s.value, start: s.start, end: s.end })),
  };
}
