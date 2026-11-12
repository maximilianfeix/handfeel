/**
 * A small lexer for Dart, Swift and Kotlin source. It does not build a tree.
 * It produces three views of the same text, all with identical offsets:
 *  - code:   comments blanked out, strings intact
 *  - masked: comments blanked out and string contents blanked (quotes kept)
 *  - strings: every string literal with its value and offsets
 * Blanking keeps newlines, so line numbers stay correct.
 */
export type Lang = 'dart' | 'swift' | 'kotlin';

export interface StringLit {
  value: string;
  start: number; // offset of the opening quote
  end: number; // offset after the closing quote
}

export interface Lexed {
  text: string;
  code: string;
  masked: string;
  strings: StringLit[];
}

const blank = (s: string) => s.replace(/[^\n]/g, ' ');

export function lex(text: string, lang: Lang): Lexed {
  const code = text.split('');
  const masked = text.split('');
  const strings: StringLit[] = [];
  const n = text.length;
  let i = 0;

  const blankRange = (arr: string[], a: number, b: number) => {
    for (let k = a; k < b; k++) if (arr[k] !== '\n') arr[k] = ' ';
  };

  // Skips an interpolation body starting at `i` (just after `${` or `\(`), returns index after the closer.
  const skipInterpolation = (start: number, open: string, close: string): number => {
    let depth = 1;
    let k = start;
    while (k < n && depth > 0) {
      const c = text[k];
      if (c === '"' || c === "'") {
        // nested string inside interpolation: skip it naively
        const q = c;
        k++;
        while (k < n && text[k] !== q && text[k] !== '\n') {
          if (text[k] === '\\') k++;
          k++;
        }
        k++;
        continue;
      }
      if (c === open) depth++;
      else if (c === close) depth--;
      k++;
    }
    return k;
  };

  while (i < n) {
    const c = text[i];
    const next = text[i + 1];

    // line comment
    if (c === '/' && next === '/') {
      const end = text.indexOf('\n', i);
      const stop = end === -1 ? n : end;
      blankRange(code, i, stop);
      blankRange(masked, i, stop);
      i = stop;
      continue;
    }
    // block comment (nested in all three languages)
    if (c === '/' && next === '*') {
      let depth = 1;
      let k = i + 2;
      while (k < n && depth > 0) {
        if (text[k] === '/' && text[k + 1] === '*') {
          depth++;
          k += 2;
        } else if (text[k] === '*' && text[k + 1] === '/') {
          depth--;
          k += 2;
        } else k++;
      }
      blankRange(code, i, k);
      blankRange(masked, i, k);
      i = k;
      continue;
    }

    // strings
    let raw = false;
    let hashes = 0;
    let s = i;
    if (lang === 'dart' && c === 'r' && (next === '"' || next === "'") && !/[\w$]/.test(text[i - 1] ?? '')) {
      raw = true;
      s = i + 1;
    }
    if (lang === 'swift' && c === '#') {
      let k = i;
      while (text[k] === '#') k++;
      if (text[k] === '"') {
        raw = true;
        hashes = k - i;
        s = k;
      }
    }
    const q = text[s];
    const isQuote = q === '"' || (q === "'" && lang === 'dart');
    if (isQuote && (s === i || raw)) {
      const triple = text.slice(s, s + 3) === q.repeat(3);
      const delim = triple ? q.repeat(3) : q;
      let k = s + delim.length;
      let value = '';
      const closer = delim + '#'.repeat(hashes);
      while (k < n) {
        if (text.startsWith(closer, k)) break;
        if (!triple && text[k] === '\n') break; // unterminated single-line string
        const ch = text[k];
        if (!raw && ch === '\\') {
          if (lang === 'swift' && text[k + 1] === '(') {
            const after = skipInterpolation(k + 2, '(', ')');
            value += text.slice(k, after);
            k = after;
            continue;
          }
          value += text.slice(k, k + 2);
          k += 2;
          continue;
        }
        if (!raw && (lang === 'dart' || lang === 'kotlin') && ch === '$' && text[k + 1] === '{') {
          const after = skipInterpolation(k + 2, '{', '}');
          value += text.slice(k, after);
          k = after;
          continue;
        }
        value += ch;
        k++;
      }
      const end = Math.min(n, k + (text.startsWith(closer, k) ? closer.length : 0));
      strings.push({ value, start: i, end });
      // mask contents but keep the quote characters
      blankRange(masked, s + delim.length, Math.max(s + delim.length, end - closer.length));
      i = end;
      continue;
    }
    // Kotlin char literal: 'a' (keep as is)
    i++;
  }

  return { text, code: code.join(''), masked: masked.join(''), strings };
}

/** Offsets -> 1-based line/column. */
export class LineIndex {
  private starts: number[] = [0];
  constructor(text: string) {
    for (let i = 0; i < text.length; i++) if (text[i] === '\n') this.starts.push(i + 1);
  }
  pos(offset: number): { line: number; column: number } {
    let lo = 0;
    let hi = this.starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.starts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return { line: lo + 1, column: offset - this.starts[lo] + 1 };
  }
}

/**
 * Given the offset of an opening bracket in `masked`, return the offset of its
 * matching closer (or -1). Works on masked text, so brackets inside strings
 * and comments are already gone.
 */
export function matchBracket(masked: string, open: number): number {
  const o = masked[open];
  const c = o === '(' ? ')' : o === '{' ? '}' : o === '[' ? ']' : '';
  if (!c) return -1;
  let depth = 0;
  for (let k = open; k < masked.length; k++) {
    if (masked[k] === o) depth++;
    else if (masked[k] === c) {
      depth--;
      if (depth === 0) return k;
    }
  }
  return -1;
}

/**
 * For a call like `Name(` found at `nameStart`, return [argsStart, argsEnd)
 * of the parenthesised argument list plus, if present, a trailing lambda block.
 */
export function callSpan(masked: string, parenOffset: number): { args: [number, number]; trailing?: [number, number] } | null {
  const close = matchBracket(masked, parenOffset);
  if (close < 0) return null;
  let k = close + 1;
  while (k < masked.length && /[ \t]/.test(masked[k])) k++;
  if (masked[k] === '{') {
    const end = matchBracket(masked, k);
    if (end > 0) return { args: [parenOffset + 1, close], trailing: [k + 1, end] };
  }
  return { args: [parenOffset + 1, close] };
}

export { blank };
