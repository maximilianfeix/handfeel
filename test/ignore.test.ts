import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scan } from '../src/scan.js';

function project(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'handfeel-'));
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(join(dir, rel, '..'), { recursive: true });
    writeFileSync(join(dir, rel), content);
  }
  return dir;
}

const pkg = JSON.stringify({ dependencies: { 'react-native': '0.81.0' } });

test('handfeel-ignore-next-line silences one rule on one line', () => {
  const dir = project({
    'package.json': pkg,
    'App.tsx': "import { View } from 'react-native';\n// handfeel-ignore-next-line hardcoded-color\nconst a = <View style={{ backgroundColor: '#123456' }} />;\nconst b = <View style={{ backgroundColor: '#654321' }} />;\n",
  });
  const r = scan(dir, { only: ['hardcoded-color'] });
  assert.deepEqual(
    r.findings.map((f) => f.line),
    [4],
  );
});

test('handfeel-ignore-file silences a rule for the file', () => {
  const dir = project({
    'package.json': pkg,
    'App.tsx': "// handfeel-ignore-file hardcoded-color\nimport { View } from 'react-native';\nconst a = <View style={{ backgroundColor: '#123456' }} />;\n",
  });
  assert.equal(scan(dir, { only: ['hardcoded-color'] }).findings.length, 0);
});

test('--ignore glob skips paths; node_modules and tests are never scanned', () => {
  const dir = project({
    'package.json': pkg,
    'legacy/Old.tsx': "import { View } from 'react-native';\nconst a = <View style={{ backgroundColor: '#123456' }} />;\n",
    'node_modules/x/index.tsx': "import { View } from 'react-native';\nconst a = <View style={{ backgroundColor: '#123456' }} />;\n",
    '__tests__/a.tsx': "import { View } from 'react-native';\nconst a = <View style={{ backgroundColor: '#123456' }} />;\n",
  });
  assert.equal(scan(dir, { only: ['hardcoded-color'], ignore: ['legacy/**'] }).findings.length, 0);
  assert.equal(scan(dir, { only: ['hardcoded-color'] }).findings.length, 1);
});

test('a file that does not parse is skipped, not fatal', () => {
  const dir = project({ 'package.json': pkg, 'Bad.tsx': 'export default () => <View><<<' });
  const r = scan(dir);
  assert.equal(r.filesScanned, 0);
  assert.deepEqual(r.skipped.map((s) => s.file), ['Bad.tsx']);
});

test('non-mobile folders get no score and say what was looked for', () => {
  const dir = project({ 'index.js': 'console.log(1)', 'package.json': JSON.stringify({ dependencies: { react: '19.0.0' } }) });
  const r = scan(dir);
  assert.equal(r.filesScanned, 0);
  assert.equal(r.score, null);
  assert.equal(r.grade, null);
  assert.match(r.reason ?? '', /package\.json with react-native or expo/);
  assert.match(r.reason ?? '', /pubspec\.yaml/);
  assert.match(r.reason ?? '', /SwiftUI/);
  assert.match(r.reason ?? '', /androidx\.compose/);
});
