import { parse } from '@babel/parser';
import type { File as BabelFile, Node } from '@babel/types';
import { blankRanges, lex, LineIndex, type Lang } from './lex.js';
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
  /** Draws UI: JSX or StyleSheet.create, a Flutter widget, a @Composable, a SwiftUI View. */
  rendersUi: boolean;
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

function parseIgnores(text: string, lines: LineIndex): IgnoreMap {
  const map: IgnoreMap = { file: null, lines: new Map() };
  if (!text.includes('handfeel-ignore')) return map;
  const re = /handfeel-ignore(-next-line|-file|-line)?(?:[ \t]+([a-z0-9\-, \t]+))?/g;
  let m: RegExpExecArray | null;
  const lineOf = (off: number) => lines.pos(off).line;
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

const SKIP_KEYS = new Set(['loc', 'start', 'end', 'leadingComments', 'trailingComments', 'innerComments', 'extra']);

/**
 * Depth-first, pre-order walk with an explicit stack: deeply nested code (minified bundles,
 * generated tables) cannot overflow the call stack.
 */
function walkTree(node: unknown, visit: (n: Node, parent: Node | null) => void, parent: Node | null): void {
  const stack: unknown[] = [node, parent];
  while (stack.length) {
    const p = stack.pop() as Node | null;
    const v = stack.pop();
    if (!v || typeof v !== 'object') continue;
    if (Array.isArray(v)) {
      for (let i = v.length - 1; i >= 0; i--) stack.push(v[i], p);
      continue;
    }
    const n = v as Node & Record<string, unknown>;
    if (typeof n.type !== 'string') continue;
    visit(n, p);
    const keys = Object.keys(n);
    for (let i = keys.length - 1; i >= 0; i--) {
      if (SKIP_KEYS.has(keys[i])) continue;
      const c = n[keys[i]];
      if (c && typeof c === 'object') stack.push(c, n);
    }
  }
}

/** Every rule walks the whole program; the node order is computed once per file. */
const programOrder = new WeakMap<object, { nodes: Node[]; parents: (Node | null)[] }>();

/** Generic depth-first walk over a Babel AST. */
export function walk(node: unknown, visit: (n: Node, parent: Node | null) => void, parent: Node | null = null): void {
  if (parent === null && node && typeof node === 'object' && (node as Node).type === 'Program') {
    let order = programOrder.get(node);
    if (!order) {
      const nodes: Node[] = [];
      const parents: (Node | null)[] = [];
      walkTree(node, (n, p) => {
        nodes.push(n);
        parents.push(p);
      }, null);
      order = { nodes, parents };
      programOrder.set(node, order);
    }
    for (let i = 0; i < order.nodes.length; i++) visit(order.nodes[i], order.parents[i]);
    return;
  }
  walkTree(node, visit, parent);
}

function loadJs(rel: string, text: string): Pick<SourceFile, 'code' | 'masked' | 'strings' | 'ast'> {
  const isTs = /\.(ts|tsx|mts|cts)$/.test(rel);
  const isTsx = /\.tsx$/.test(rel);
  const plugins: any[] = [];
  if (isTs) plugins.push('typescript');
  if (isTsx || !isTs) plugins.push('jsx');
  // Flow types in .js files (React Native's own convention). Ambiguous syntax is only read as
  // Flow in files with an @flow pragma, so plain JavaScript parses as before.
  if (!isTs) plugins.push('flow');
  // MobX/TypeORM-style decorators
  plugins.push('decorators-legacy');
  let ast: BabelFile;
  try {
    ast = parse(text, {
      sourceType: 'unambiguous',
      plugins,
      errorRecovery: true,
      allowReturnOutsideFunction: true,
      allowImportExportEverywhere: true,
    });
  } catch (e) {
    if (e instanceof RangeError) throw new Error('nested too deeply to parse');
    throw e;
  }
  const comments: [number, number][] = [];
  for (const c of ast.comments ?? []) comments.push([c.start!, c.end!]);
  const stringRanges: [number, number][] = [];
  const strings: StrValue[] = [];
  walk(ast.program, (n) => {
    if (n.type === 'StringLiteral') {
      strings.push({ value: n.value, start: n.start!, end: n.end!, kind: n.type });
      stringRanges.push([n.start! + 1, n.end! - 1]);
    } else if (n.type === 'TemplateElement') {
      strings.push({ value: n.value.cooked ?? n.value.raw, start: n.start!, end: n.end!, kind: n.type });
      stringRanges.push([n.start!, n.end!]);
    } else if (n.type === 'JSXText') {
      if (n.value.trim()) strings.push({ value: n.value, start: n.start!, end: n.end!, kind: n.type });
      stringRanges.push([n.start!, n.end!]);
    }
  });
  return { code: blankRanges(text, comments), masked: blankRanges(text, [...comments, ...stringRanges]), strings, ast };
}

/**
 * Does this file draw UI? Typography constants in a module that draws nothing (an atoms or
 * variables file) define the type scale, like a token file does.
 */
export function rendersUi(lang: FileLang, code: string, ast?: BabelFile): boolean {
  if (lang === 'js') {
    if (/\bStyleSheet\.create\s*\(/.test(code)) return true;
    let jsx = false;
    if (ast)
      walk(ast.program, (n) => {
        if (n.type === 'JSXElement' || n.type === 'JSXFragment') jsx = true;
      });
    return jsx;
  }
  if (lang === 'dart') return /\bWidget\s+build\s*\(|\bextends\s+(?:StatelessWidget|StatefulWidget|State\s*<|ConsumerWidget|HookWidget|HookConsumerWidget|ConsumerStatefulWidget)\b|\bWidget\s+\w+\s*\(/.test(code);
  if (lang === 'kotlin') return /@Composable\b/.test(code);
  return /:\s*(?:some\s+)?View\b|\bsome\s+View\b|\bViewModifier\b|\bButtonStyle\b/.test(code);
}

export function loadSource(rel: string, abs: string, text: string, platform: Platform): SourceFile {
  const lang: FileLang = /\.dart$/.test(rel) ? 'dart' : /\.swift$/.test(rel) ? 'swift' : /\.kts?$/.test(rel) ? 'kotlin' : 'js';
  const lines = new LineIndex(text);
  const base = {
    rel,
    abs,
    lang,
    platform,
    text,
    lines,
    isTokenFile: isTokenPath(rel),
    ignore: parseIgnores(text, lines),
  };
  if (lang === 'js') {
    const js = loadJs(rel, text);
    const ui = rendersUi(lang, js.code, js.ast);
    return { ...base, ...js, rendersUi: ui };
  }
  const lx = lex(text, lang);
  const ui = rendersUi(lang, lx.code);
  return {
    ...base,
    rendersUi: ui,
    code: lx.code,
    masked: lx.masked,
    strings: lx.strings.map((s) => ({ value: s.value, start: s.start, end: s.end })),
  };
}
