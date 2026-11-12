// Checks what `npm pack` would publish: the CLI, the skill (needed by `init cursor`) and the demo
// app are in; tests, fixtures, evals and docs assets are out.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const out = execFileSync(npm, ['pack', '--dry-run', '--json', '--ignore-scripts'], { encoding: 'utf8', shell: process.platform === 'win32' });
const [pkg] = JSON.parse(out.slice(out.indexOf('[')));
const files = pkg.files.map((f) => f.path.replace(/\\/g, '/'));
const problems = [];
for (const need of ['dist/src/cli.js', 'dist/src/index.js', 'dist/src/index.d.ts', 'skills/handfeel/SKILL.md', 'skills/handfeel/references/signs.md', 'demo/flutter-fitness/pubspec.yaml', 'demo/flutter-fitness/PROMPT.md', 'CHANGELOG.md', 'README.md', 'LICENSE']) {
  if (!files.includes(need)) problems.push(`missing ${need}`);
}
for (const f of files) if (/^(test|evals|scripts|brand|docs|\.github)\/|^dist\/test\/|fixtures\//.test(f)) problems.push(`should not ship ${f}`);
if (!readFileSync('dist/src/cli.js', 'utf8').startsWith('#!/usr/bin/env node\n')) problems.push('dist/src/cli.js has no shebang');
const MAX = 250_000;
if (pkg.size > MAX) problems.push(`tarball is ${pkg.size} bytes, budget ${MAX}`);
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`pack ok: ${files.length} files, ${(pkg.size / 1000).toFixed(1)} kB packed, ${(pkg.unpackedSize / 1000).toFixed(1)} kB unpacked`);
