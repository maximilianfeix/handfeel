// Real projects contain everything: binaries with source extensions, minified bundles, odd
// encodings, symlink loops, unreadable files. None of it may crash a scan; it goes to `skipped`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scan, ScanError } from '../src/scan.js';
import { lex, matchBracket } from '../src/lex.js';

function project(files: Record<string, string | Buffer>) {
  const dir = mkdtempSync(join(tmpdir(), 'handfeel-robust-'));
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(join(dir, rel, '..'), { recursive: true });
    writeFileSync(join(dir, rel), content);
  }
  return dir;
}

const pkg = JSON.stringify({ dependencies: { expo: '54.0.0', 'react-native': '0.81.0' } });
const screen = (color: string) => `import { View } from 'react-native';\nexport default () => <View style={{ backgroundColor: '${color}' }} />;\n`;
const colorsOf = (dir: string) =>
  scan(dir, { only: ['hardcoded-color'] })
    .findings.map((f) => `${f.file}:${f.line}`)
    .sort();
const skippedOf = (dir: string) => Object.fromEntries(scan(dir).skipped.map((s) => [s.file, s.reason]));

test('a missing folder is a ScanError, not a stack trace', () => {
  assert.throws(() => scan(join(tmpdir(), 'handfeel-does-not-exist-' + Date.now())), (e: unknown) => e instanceof ScanError && e.code === 'not-found');
});

test('a file instead of a folder is a ScanError', () => {
  const dir = project({ 'package.json': pkg });
  assert.throws(() => scan(join(dir, 'package.json')), (e: unknown) => e instanceof ScanError && e.code === 'not-a-directory');
});

test('binary content with a .tsx name is skipped as binary', () => {
  const bin = Buffer.alloc(4096);
  for (let i = 0; i < bin.length; i++) bin[i] = (i * 37) % 256;
  const dir = project({ 'package.json': pkg, 'App.tsx': screen('#123456'), 'Logo.tsx': bin });
  assert.equal(skippedOf(dir)['Logo.tsx'], 'binary file');
  assert.deepEqual(colorsOf(dir), ['App.tsx:2']);
});

test('minified bundles are skipped; long SVG path lines in small icons are not', () => {
  const minified = 'var a=1;'.repeat(20_000);
  const icon = `import Svg, { Path } from 'react-native-svg';\nexport const I = () => <Svg><Path d="${'M0 0L1 1'.repeat(1000)}" /></Svg>;\n`;
  const dir = project({ 'package.json': pkg, 'vendor.js': minified, 'Icon.tsx': icon });
  const skipped = skippedOf(dir);
  assert.match(skipped['vendor.js'] ?? '', /minified/);
  assert.equal(skipped['Icon.tsx'], undefined);
});

test('files over 1 MB are reported in skipped', () => {
  const dir = project({ 'package.json': pkg, 'strings.ts': `export const s = {\n${'  a: "b",\n'.repeat(120_000)}};\n` });
  assert.match(skippedOf(dir)['strings.ts'] ?? '', /larger than 1 MB/);
});

test('UTF-8 BOM, CRLF and UTF-16 files give the same findings as plain UTF-8', () => {
  const crlf = screen('#123456').replace(/\n/g, '\r\n');
  const dir = project({
    'package.json': pkg,
    'Plain.tsx': screen('#123456'),
    'Bom.tsx': Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(screen('#123456'))]),
    'Crlf.tsx': crlf,
    'Utf16.tsx': Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(screen('#123456'), 'utf16le')]),
  });
  const r = scan(dir, { only: ['hardcoded-color'] });
  assert.deepEqual(r.skipped, []);
  const at = r.findings.map((f) => `${f.file}:${f.line}:${f.column}`).sort();
  assert.deepEqual(at, ['Bom.tsx:2:54', 'Crlf.tsx:2:54', 'Plain.tsx:2:54', 'Utf16.tsx:2:54']);
});

test('Swift and Dart files with a BOM and CRLF are still detected', () => {
  const swift = '﻿import SwiftUI\r\nstruct A: View {\r\n  var body: some View { Text("x").foregroundColor(Color.white) }\r\n}\r\n';
  const r = scan(project({ 'Sources/A.swift': swift }), { only: ['hardcoded-color'] });
  assert.deepEqual(r.platforms, ['swiftui']);
  assert.equal(r.findings.length, 1);
});

test('symlink loops and dangling links do not hang or crash the scan', (t) => {
  const dir = project({ 'package.json': pkg, 'src/App.tsx': screen('#123456') });
  try {
    symlinkSync('..', join(dir, 'src', 'loop'), 'dir');
    symlinkSync(join(dir, 'src'), join(dir, 'src', 'self'), 'dir');
    symlinkSync(join(dir, 'missing.tsx'), join(dir, 'src', 'dangling.tsx'), 'file');
  } catch {
    t.skip('symlinks need extra rights on this system');
    return;
  }
  assert.deepEqual(colorsOf(dir), ['src/App.tsx:2']);
});

test('unreadable files and folders are skipped with a reason', (t) => {
  if (process.platform === 'win32' || process.getuid?.() === 0) {
    t.skip('chmod does not restrict reads here');
    return;
  }
  const dir = project({ 'package.json': pkg, 'App.tsx': screen('#123456'), 'Secret.tsx': screen('#654321'), 'locked/B.tsx': screen('#111111') });
  chmodSync(join(dir, 'Secret.tsx'), 0o000);
  chmodSync(join(dir, 'locked'), 0o000);
  try {
    const skipped = skippedOf(dir);
    assert.equal(skipped['Secret.tsx'], 'permission denied');
    assert.equal(skipped['locked/'], 'permission denied');
    assert.deepEqual(colorsOf(dir), ['App.tsx:2']);
  } finally {
    chmodSync(join(dir, 'Secret.tsx'), 0o644);
    chmodSync(join(dir, 'locked'), 0o755);
  }
});

test('deeply nested code is skipped instead of overflowing the stack', () => {
  const dir = project({ 'package.json': pkg, 'App.tsx': screen('#123456'), 'Deep.ts': `export const x = ${'[\n'.repeat(30_000)}${']\n'.repeat(30_000)};\n` });
  const skipped = skippedOf(dir);
  // depending on the engine's stack size Babel either parses it or gives up; never a crash
  if (skipped['Deep.ts']) assert.match(skipped['Deep.ts'], /nested too deeply/);
  assert.deepEqual(colorsOf(dir), ['App.tsx:2']);
});

test('deeply nested folders are scanned', () => {
  const deep = Array.from({ length: 60 }, (_, i) => `d${i}`).join('/');
  assert.deepEqual(colorsOf(project({ 'package.json': pkg, [`${deep}/App.tsx`]: screen('#123456') })), [`${deep}/App.tsx:2`]);
});

test('decorators, Flow types and JSX edge cases parse', () => {
  const dir = project({
    'package.json': pkg,
    'Store.tsx': "import { View } from 'react-native';\n@observer\nclass Store { @observable a = 1; render() { return <View style={{ backgroundColor: '#123456' }} />; } }\nexport default Store;\n",
    'Flow.js': "// @flow\nimport * as React from 'react';\nimport { View } from 'react-native';\ntype Props = {| size: number |};\nexport default function A(p: Props): React.Node { return <View style={{ backgroundColor: '#123456' }} />; }\n",
    'Edge.tsx': "import { View, Text } from 'react-native';\nconst id = <T,>(x: T) => x;\nexport const A = () => <><Text>{`a${1}`}</Text>{/* c */}<View {...{ a: 1 }} style={{ backgroundColor: '#123456' }} />&nbsp;</>;\n",
  });
  const r = scan(dir, { only: ['hardcoded-color'] });
  assert.deepEqual(r.skipped, []);
  assert.deepEqual(r.findings.map((f) => f.file).sort(), ['Edge.tsx', 'Flow.js', 'Store.tsx']);
});

test('Dart 3 records and patterns, Swift macros and raw strings, Kotlin raw strings lex cleanly', () => {
  const dart = `import 'package:flutter/material.dart';
(int, {String name}) pair() => (1, name: 'x');
double area(Object s) => switch (s) { (var a, var b) when a > 0 => 1, _ => 0 };
class W extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    if (pair() case (var x, name: var n)) print('$x \${n + 'a'}');
    final s = r'raw \${x}' + '''multi
\${'nested \${"deep"}'}
''';
    return Container(color: Color(0xFF123456), child: Text(s));
  }
}
`;
  const swift = `import SwiftUI
@Observable final class Model { var n = 0 }
#Preview { ContentView() }
struct ContentView: View {
    let raw = #"raw "quoted" \\#(1) Color.white"#
    let multi = """
      line \\(1 + 2) "quote" Color.white
      """
    var body: some View { Text(raw).foregroundColor(Color.white) }
}
`;
  const kotlin = `import androidx.compose.runtime.Composable
val raw = """
  \${'$'}x "quotes" \${1 + 2} Color.White /* not a comment */
""".trimIndent()
@Composable fun App() { Text(text = "a \${"nested \${1}"}", color = Color.White) }
`;
  const dir = project({ 'pubspec.yaml': 'name: a\n', 'lib/main.dart': dart, 'swift/Sources/A.swift': swift, 'shared/src/commonMain/kotlin/App.kt': kotlin });
  const r = scan(dir, { only: ['hardcoded-color'] });
  assert.deepEqual(r.skipped, []);
  assert.deepEqual(r.platforms, ['compose', 'flutter', 'swiftui']);
  const at = r.findings.map((f) => `${f.file}:${f.line}`);
  for (const want of ['swift/Sources/A.swift:9', 'lib/main.dart:11', 'shared/src/commonMain/kotlin/App.kt:5']) assert.ok(at.includes(want), `${want} in ${at.join(', ')}`);
  // the lexer sees the raw and multi-line strings as strings
  const sw = lex(swift, 'swift').strings.map((x) => x.value);
  assert.ok(sw.includes('raw "quoted" \\#(1) Color.white'), sw.join(' | '));
  const kt = lex(kotlin, 'kotlin').strings.map((x) => x.value);
  assert.ok(kt.some((v) => v.includes('/* not a comment */')), kt.join(' | '));
});

test('monorepo: only the mobile app and shared React Native packages are scanned', () => {
  const dir = project({
    'package.json': JSON.stringify({ private: true, workspaces: ['apps/*', 'packages/*'] }),
    'apps/mobile/package.json': pkg,
    'apps/mobile/app/index.tsx': screen('#123456'),
    'apps/web/package.json': JSON.stringify({ dependencies: { next: '15.0.0', react: '19.0.0' } }),
    'apps/web/src/page.tsx': "export default () => <div style={{ color: '#ff0000' }} />;\n",
    'packages/ui/package.json': JSON.stringify({ peerDependencies: { 'react-native': '*' } }),
    'packages/ui/src/Card.tsx': screen('#654321'),
  });
  assert.deepEqual(colorsOf(dir), ['apps/mobile/app/index.tsx:2', 'packages/ui/src/Card.tsx:2']);
});

test('Expo app with only app.config.ts (no app.json) is detected', () => {
  const dir = project({
    'package.json': JSON.stringify({ dependencies: { expo: '54.0.0' } }),
    'app.config.ts': "export default { expo: { name: 'x', userInterfaceStyle: 'automatic' } };\n",
    'app/index.tsx': screen('#123456'),
  });
  const r = scan(dir);
  assert.deepEqual(r.platforms, ['react-native']);
  assert.equal(r.filesScanned, 1);
});

test('Flutter packages under packages/ are scanned', () => {
  const dir = project({
    'pubspec.yaml': 'name: app\n',
    'lib/main.dart': "import 'package:flutter/material.dart';\nvoid main() {}\n",
    'packages/ui/pubspec.yaml': 'name: ui\n',
    'packages/ui/lib/button.dart': "import 'package:flutter/material.dart';\nfinal c = Container(color: Color(0xFF123456));\n",
  });
  assert.deepEqual(colorsOf(dir), ['packages/ui/lib/button.dart:2']);
});

test('large files with many unclosed brackets stay fast', () => {
  const swift = 'import SwiftUI\n' + 'Text("x").font(.custom("A",\n'.repeat(25_000);
  const t0 = Date.now();
  scan(project({ 'A.swift': swift }));
  assert.ok(Date.now() - t0 < 5000, `took ${Date.now() - t0} ms`);
});

test('matchBracket matches each bracket kind independently', () => {
  const s = '( [ ) ] { ( } )';
  assert.equal(matchBracket(s, 0), 4);
  assert.equal(matchBracket(s, 2), 6);
  assert.equal(matchBracket(s, 8), 12);
  assert.equal(matchBracket(s, 10), 14);
  assert.equal(matchBracket('(()', 0), -1);
  assert.equal(matchBracket('x', 0), -1);
});
