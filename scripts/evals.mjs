// Scores every evals/apps/<name>/{before,after} and writes evals/results.json.
// "after (no ignores)" re-scans a copy with every handfeel-ignore comment removed,
// so suppressed findings still count.
import { readdirSync, existsSync, mkdtempSync, cpSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { scan } from '../dist/src/index.js';

const APPS = 'evals/apps';
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? (n === 'node_modules' ? [] : walk(p)) : [p]; });

function stripIgnores(dir) {
  const tmp = mkdtempSync(join(tmpdir(), 'handfeel-eval-'));
  cpSync(dir, tmp, { recursive: true, filter: (s) => !s.includes('node_modules') });
  let n = 0;
  for (const f of walk(tmp)) {
    if (!/\.(tsx?|jsx?|dart|swift|kt)$/.test(f)) continue;
    const src = readFileSync(f, 'utf8');
    const out = src.replace(/handfeel-ignore(-next-line|-file|-line)?/g, () => { n++; return 'handfeel-was-ignored'; });
    if (out !== src) writeFileSync(f, out);
  }
  return { tmp, n };
}

function diffStat(a, b) {
  try {
    execFileSync('git', ['diff', '--no-index', '--shortstat', a, b], { encoding: 'utf8' });
    return '0 files changed';
  } catch (e) {
    return (e.stdout || '').trim();
  }
}

const rows = [];
for (const name of readdirSync(APPS).sort()) {
  const base = join(APPS, name);
  if (!existsSync(join(base, 'before'))) continue;
  const before = scan(join(base, 'before'));
  const row = { app: name, platform: before.platforms.join(','), files: before.filesScanned, before: before.score, beforeBreakdown: before.breakdown.map((b) => `${b.rule} -${b.penalty}`) };
  if (existsSync(join(base, 'after'))) {
    const after = scan(join(base, 'after'));
    const { tmp, n } = stripIgnores(join(base, 'after'));
    const strict = scan(tmp);
    Object.assign(row, {
      after: after.score,
      afterNoIgnores: strict.score,
      ignoreComments: n,
      remaining: strict.findings.map((f) => `${f.rule} ${f.file}:${f.line}`),
      diff: diffStat(join(base, 'before'), join(base, 'after')),
    });
  }
  rows.push(row);
}
const out = { date: new Date().toISOString().slice(0, 10), scanner: JSON.parse(readFileSync('package.json', 'utf8')).version, apps: rows };
writeFileSync('evals/results.json', JSON.stringify(out, null, 2) + '\n');
for (const r of rows) console.log(`${r.app.padEnd(20)} ${String(r.before).padStart(3)} -> ${r.after ?? '-'}  (no ignores: ${r.afterNoIgnores ?? '-'}, ignores: ${r.ignoreComments ?? '-'})  ${r.diff ?? ''}`);
