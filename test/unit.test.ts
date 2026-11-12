import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lex, LineIndex, matchBracket } from '../src/lex.js';
import { parseCssColor, parseArgbInt, isAiPurple, hex6 } from '../src/color.js';
import { computeScore, grade } from '../src/score.js';
import { ruleCatalog, RULES } from '../src/rules/index.js';
import { globToRegExp } from '../src/files.js';

test('lexer blanks comments and keeps offsets', () => {
  const src = "a(1) // Color(0xFF000000)\n/* x /* nested */ y */ b('s(')";
  const l = lex(src, 'dart');
  assert.equal(l.code.length, src.length);
  assert.ok(!l.code.includes('Color'));
  assert.ok(!l.code.includes('nested'));
  assert.equal(l.strings.length, 1);
  assert.equal(l.strings[0].value, 's(');
  const open = l.masked.indexOf("b(") + 1;
  assert.equal(l.masked[matchBracket(l.masked, open)], ')');
  assert.equal(matchBracket(l.masked, open), src.length - 1);
});

test('lexer handles Dart interpolation, raw and triple strings', () => {
  const l = lex(`final a = 'x \${b('y')} z'; final r = r'\\d'; final t = '''multi\nline''';`, 'dart');
  assert.deepEqual(
    l.strings.map((s) => s.value),
    ["x ${b('y')} z", '\\d', 'multi\nline'],
  );
});

test('lexer handles Swift raw strings and interpolation', () => {
  const l = lex('let a = "x \\(f("y")) z"; let b = #"raw "q""#', 'swift');
  assert.deepEqual(
    l.strings.map((s) => s.value),
    ['x \\(f("y")) z', 'raw "q"'],
  );
});

test('line index', () => {
  const li = new LineIndex('ab\ncd\n\nef');
  assert.deepEqual(li.pos(0), { line: 1, column: 1 });
  assert.deepEqual(li.pos(4), { line: 2, column: 2 });
  assert.deepEqual(li.pos(7), { line: 4, column: 1 });
});

test('color parsing and the purple band', () => {
  assert.equal(hex6(parseCssColor('#6366f1')!), '#6366F1');
  assert.equal(parseCssColor('rgba(255,255,255,0.15)')!.a, 0.15);
  assert.equal(hex6(parseArgbInt('0xFF7C5CFF')!), '#7C5CFF');
  assert.ok(isAiPurple(parseCssColor('#8B5CF6')!));
  assert.ok(isAiPurple(parseCssColor('#6366F1')!));
  assert.ok(!isAiPurple(parseCssColor('#1F6F5C')!));
  assert.ok(!isAiPurple(parseCssColor('#FF5C93')!));
  assert.ok(!isAiPurple(parseCssColor('#111122')!));
});

test('score formula: weight x (count - free), capped, floored at 0', () => {
  const cat = ruleCatalog();
  const f = (rule: string, n: number) => Array.from({ length: n }, (_, i) => ({ rule, file: 'a', line: i + 1, column: 1, message: '' }));
  assert.equal(computeScore([], cat).score, 100);
  // hardcoded-color: 0.5 each, cap 10
  assert.equal(computeScore(f('hardcoded-color', 4), cat).score, 98);
  assert.equal(computeScore(f('hardcoded-color', 400), cat).score, 90);
  // gradient-overuse: 2 free
  assert.equal(computeScore(f('gradient-overuse', 2), cat).score, 100);
  assert.equal(computeScore(f('gradient-overuse', 4), cat).score, 97);
  assert.equal(computeScore(f('hardcoded-color', 1), cat).score, 99);
  // per-occurrence rules are counted per 20 files in larger projects; per-project rules are not
  assert.equal(computeScore(f('hardcoded-color', 40), cat, 200).score, 98);
  assert.equal(computeScore(f('hardcoded-color', 40), cat, 20).score, 90);
  assert.equal(computeScore(f('font-scaling-disabled', 1), cat, 2000).score, 96);
  assert.equal(computeScore(f('hardcoded-color', 40), cat, 200).breakdown[0].counted, 4);
  assert.equal(grade(95), 'feels native');
  assert.equal(grade(40), 'AI look');
});

test('implementations that share an id share weight, cap, free and perOccurrence', () => {
  const by = new Map<string, string>();
  for (const r of RULES) {
    const k = `${r.weight}/${r.cap}/${r.free ?? 0}/${!!r.perOccurrence}`;
    const prev = by.get(r.id);
    if (prev) assert.equal(k, prev, `${r.id} has inconsistent scoring`);
    by.set(r.id, k);
  }
});

test('every rule cites at least one source and explains itself', () => {
  for (const r of RULES) {
    assert.ok(r.sources.length > 0, r.id);
    assert.ok(r.why.length > 40, r.id);
    assert.ok(r.fix.length > 20, r.id);
    for (const s of r.sources) assert.match(s.url, /^https:\/\//);
  }
});

test('glob matching', () => {
  assert.ok(globToRegExp('legacy/**').test('legacy/a/b.tsx'));
  assert.ok(globToRegExp('*.stories.tsx').test('src/x.stories.tsx'));
  assert.ok(!globToRegExp('legacy/**').test('src/legacy.tsx'));
});
