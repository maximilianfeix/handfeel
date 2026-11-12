// End-to-end tests of the command line: exit codes, messages, and that --json stays pure JSON.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCard } from '../src/report.js';
import { scan } from '../src/scan.js';

// dist/test -> dist/src/cli.js
const CLI = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'cli.js');

function run(args: string[], env: Record<string, string> = {}) {
  const base = { ...process.env };
  delete base.NO_COLOR;
  delete base.FORCE_COLOR;
  const r = spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...base, ...env } });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

function project(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'handfeel-cli-'));
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(join(dir, rel, '..'), { recursive: true });
    writeFileSync(join(dir, rel), content);
  }
  return dir;
}

const app = () =>
  project({
    'package.json': JSON.stringify({ dependencies: { 'react-native': '0.81.0' } }),
    'src/App.tsx': "import { View } from 'react-native';\nexport default () => <View style={{ backgroundColor: '#123456' }} />;\n",
  });

test('--version and -v print the version', () => {
  const pkg = JSON.parse(readFileSync(join(dirname(CLI), '..', '..', 'package.json'), 'utf8'));
  assert.equal(run(['--version']).out.trim(), pkg.version);
  assert.equal(run(['-v']).out.trim(), pkg.version);
});

test('--help documents exit codes; every command has its own help', () => {
  const h = run(['--help']);
  assert.equal(h.code, 0);
  assert.match(h.out, /Exit codes/);
  assert.match(h.out, /--demo/);
  assert.match(h.out, /--card/);
  for (const cmd of ['scan', 'rules', 'explain', 'badge', 'init']) {
    const r = run([cmd, '--help']);
    assert.equal(r.code, 0, cmd);
    assert.match(r.out, new RegExp(`^handfeel ${cmd}`), cmd);
    assert.match(run([cmd, '-h']).out, new RegExp(`^handfeel ${cmd}`), cmd);
  }
});

test('a wrong path exits 2 with a one-line message', () => {
  const r = run(['scan', join(tmpdir(), 'handfeel-nope-' + Date.now())]);
  assert.equal(r.code, 2);
  assert.match(r.err, /no such folder/);
  assert.doesNotMatch(r.err, /\n\s+at /);
});

test('unknown commands and flags are errors with a suggestion', () => {
  let r = run(['scna', '.']);
  assert.equal(r.code, 2);
  assert.match(r.err, /did you mean "scan"/);
  r = run(['scan', app(), '--jsn']);
  assert.equal(r.code, 2);
  assert.match(r.err, /Unknown option --jsn.*did you mean --json/);
  r = run(['scan', app(), '-x']);
  assert.equal(r.code, 2);
  r = run(['scan', app(), '--only', 'hardcoded-colr']);
  assert.equal(r.code, 2);
  assert.match(r.err, /did you mean hardcoded-color/);
  r = run(['scan', app(), '--min-score', 'lots']);
  assert.equal(r.code, 2);
  r = run(['scan', app(), '--json', '--sarif']);
  assert.equal(r.code, 2);
});

test('a folder without mobile code prints no score, says what it looked for, exits 2', () => {
  const dir = project({ 'package.json': JSON.stringify({ dependencies: { react: '19.0.0' } }), 'index.ts': 'export const a = 1;\n' });
  const r = run(['scan', dir]);
  assert.equal(r.code, 2);
  assert.doesNotMatch(r.out, /\/ 100/);
  assert.doesNotMatch(r.out, /feels native/);
  assert.match(r.out, /package\.json with react-native or expo/);
  assert.match(r.out, /pubspec\.yaml/);
  assert.match(r.out, /SwiftUI/);
  assert.match(r.out, /androidx\.compose/);
  const j = run(['scan', dir, '--json']);
  assert.equal(j.code, 2);
  const parsed = JSON.parse(j.out);
  assert.equal(parsed.score, null);
  assert.match(parsed.reason, /Looked for/);
  assert.equal(run(['badge', dir]).code, 2);
});

test('--json is pure JSON on stdout; messages go to stderr', () => {
  const r = run(['scan', app(), '--json', '--min-score', '100']);
  assert.equal(r.code, 1);
  const parsed = JSON.parse(r.out);
  assert.equal(typeof parsed.score, 'number');
  assert.match(r.err, /below --min-score/);
});

test('paths in output use forward slashes', () => {
  const parsed = JSON.parse(run(['scan', app(), '--json']).out);
  assert.ok(parsed.findings.length > 0);
  for (const f of parsed.findings) assert.doesNotMatch(f.file, /\\/);
  assert.ok(parsed.findings.some((f: { file: string }) => f.file === 'src/App.tsx'));
});

test('color: off when piped, off with NO_COLOR, on with FORCE_COLOR', () => {
  const dir = app();
  assert.doesNotMatch(run(['scan', dir]).out, /\x1b\[/);
  assert.doesNotMatch(run(['scan', dir], { NO_COLOR: '1', FORCE_COLOR: '1' }).out, /\x1b\[/);
  assert.match(run(['scan', dir], { FORCE_COLOR: '1' }).out, /\x1b\[/);
  assert.doesNotMatch(run(['scan', dir, '--no-color'], { FORCE_COLOR: '1' }).out, /\x1b\[/);
});

test('handfeel <dir> is shorthand for handfeel scan <dir>', () => {
  const r = run([app(), '--summary']);
  assert.equal(r.code, 0);
  assert.match(r.out, /\/ 100/);
});

test('--demo scans the bundled demo app and says so', () => {
  const r = run(['scan', '--demo', '--summary']);
  assert.equal(r.code, 0);
  assert.match(r.out, /Flutter/);
  assert.match(r.out, /This is a generated demo app\. Run `npx handfeel scan \.` in your own project\./);
  const j = run(['scan', '--demo', '--json']);
  assert.equal(j.code, 0);
  assert.equal(JSON.parse(j.out).root, 'demo/flutter-fitness');
  assert.match(j.err, /generated demo app/);
});

test('--card writes the SVG score card', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'handfeel-card-')), 'nested', 'card.svg');
  const r = run(['scan', app(), '--summary', '--card', out]);
  assert.equal(r.code, 0);
  const svg = readFileSync(out, 'utf8');
  assertWellFormed(svg);
  assert.match(svg, /no-dark-mode/);
});

/** A small XML well-formedness check: balanced tags, quoted attributes, known entities only. */
function assertWellFormed(xml: string) {
  assert.match(xml, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  const stack: string[] = [];
  const tag = /<(\/?)([A-Za-z][\w:-]*)((?:\s+[\w:-]+="[^"<]*")*)\s*(\/?)>/y;
  let i = 0;
  while (i < xml.length) {
    const lt = xml.indexOf('<', i);
    const text = xml.slice(i, lt === -1 ? xml.length : lt);
    assert.doesNotMatch(text, /&(?!(?:amp|lt|gt|quot|apos);)/, `bad entity in text: ${text}`);
    assert.doesNotMatch(text, />/, `stray > in text: ${text}`);
    if (lt === -1) break;
    tag.lastIndex = lt;
    const m = tag.exec(xml);
    assert.ok(m, `malformed tag at ${lt}: ${xml.slice(lt, lt + 60)}`);
    assert.doesNotMatch(m[3], /&(?!(?:amp|lt|gt|quot|apos);)/, `bad entity in attributes: ${m[3]}`);
    if (m[1]) assert.equal(stack.pop(), m[2], `unbalanced </${m[2]}>`);
    else if (!m[4]) stack.push(m[2]);
    i = tag.lastIndex;
  }
  assert.deepEqual(stack, [], 'unclosed tags');
}

test('score card SVG is well-formed, social-sized, on brand, and escapes text', () => {
  const r = scan(app());
  const svg = renderCard({ ...r, grade: 'a <b> & "c"', platforms: ['react-native'] });
  assertWellFormed(svg);
  assert.match(svg, /width="1200" height="630"/);
  assert.match(svg, /#151412/);
  assert.match(svg, /#F4F1EA/);
  assert.match(svg, /#E0592A/);
  assert.match(svg, /npx handfeel scan/);
  assert.match(svg, /github\.com\/maximilianfeix\/handfeel/);
  assert.doesNotMatch(svg, /Gradient|<path/);
  assert.match(svg, /a &lt;b&gt; &amp; &quot;c&quot;/);
  assert.throws(() => renderCard({ ...r, score: null }));
});
