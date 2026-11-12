#!/usr/bin/env node
import { scan } from './scan.js';
import { badgeUrl, makeStyle, renderJson, renderMarkdown, renderSarif, renderText } from './report.js';
import { ruleCatalog } from './rules/index.js';
import { PLATFORM_LABEL, type Platform } from './types.js';
import { VERSION } from './version.js';

const HELP = `handfeel ${VERSION}
Find the AI look in mobile apps. Static, offline, no AI calls.

Usage
  handfeel scan [dir]          Scan a project and print a 0-100 score
  handfeel rules               List every rule with its weight and cap
  handfeel explain <rule>      Why a rule exists, how to fix it, sources
  handfeel badge [dir]         Print a README badge with your score

Options for scan
  --json                       Machine-readable result
  --sarif                      SARIF 2.1.0 (GitHub code scanning)
  --md                         Markdown summary (PR comments)
  --summary                    Score and breakdown only, no findings
  --min-score <n>              Exit with code 1 if the score is below n
  --ignore <glob>              Skip paths (repeatable), e.g. --ignore "legacy/**"
  --only <ids>                 Comma-separated rule ids to run
  --disable <ids>              Comma-separated rule ids to skip
  --no-color                   Plain output

Ignore a single finding with a comment on the line above:
  // handfeel-ignore-next-line hardcoded-color
`;

function parse(argv: string[]) {
  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};
  const multi: Record<string, string[]> = { ignore: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=', 2);
      const needsValue = ['min-score', 'ignore', 'only', 'disable'].includes(k);
      const val = needsValue ? (v ?? argv[++i]) : (v ?? true);
      if (k === 'ignore') multi.ignore.push(String(val));
      else flags[k] = val;
    } else if (a === '-h') flags.help = true;
    else if (a === '-v') flags.version = true;
    else args.push(a);
  }
  return { args, flags, multi };
}

function main(): number {
  const { args, flags, multi } = parse(process.argv.slice(2));
  if (flags.version) {
    console.log(VERSION);
    return 0;
  }
  let cmd = args[0];
  if (flags.help || cmd === 'help') {
    console.log(HELP);
    return 0;
  }
  if (!cmd || !['scan', 'rules', 'explain', 'badge'].includes(cmd)) {
    if (!cmd) {
      console.log(HELP);
      return 0;
    }
    // `handfeel ./app` is shorthand for `handfeel scan ./app`
    cmd = 'scan';
    args.unshift('scan');
  }
  const color = !flags['no-color'] && !process.env.NO_COLOR && process.stdout.isTTY === true;
  const st = makeStyle(color);

  if (cmd === 'rules') {
    const cat = ruleCatalog();
    if (flags.json) {
      console.log(JSON.stringify(cat, null, 2));
      return 0;
    }
    const w = Math.max(...cat.map((c) => c.id.length));
    console.log('');
    for (const c of cat) {
      const pts = `${c.weight}/finding, max ${c.cap}${c.free ? `, ${c.free} free` : ''}`;
      console.log(`  ${st.accent(c.id.padEnd(w))}  ${c.title}`);
      console.log(`  ${' '.repeat(w)}  ${st.dim(pts + ' · ' + c.platforms.map((p) => PLATFORM_LABEL[p as Platform]).join(', '))}`);
    }
    console.log('');
    return 0;
  }

  if (cmd === 'explain') {
    const id = args[1];
    const r = ruleCatalog().find((c) => c.id === id);
    if (!r) {
      console.error(`Unknown rule "${id ?? ''}". Run: handfeel rules`);
      return 2;
    }
    console.log(`\n  ${st.bold(r.id)}  ${r.title}\n`);
    console.log(`  ${st.dim('why')}\n  ${r.why}\n`);
    console.log(`  ${st.dim('fix')}\n  ${r.fix}\n`);
    console.log(`  ${st.dim('score')}\n  -${r.weight} per finding, at most -${r.cap}${r.free ? `, first ${r.free} free` : ''}\n`);
    console.log(`  ${st.dim('sources')}`);
    for (const s of r.sources) console.log(`  ${s.title}\n  ${st.dim(s.url)}`);
    console.log('');
    return 0;
  }

  const dir = args[1] ?? '.';
  const list = (v: unknown) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined);
  let result;
  try {
    result = scan(dir, { ignore: multi.ignore, only: list(flags.only), disable: list(flags.disable) });
  } catch (e) {
    console.error(`handfeel: ${(e as Error).message}`);
    return 2;
  }

  if (cmd === 'badge') {
    console.log(`[![handfeel score](${badgeUrl(result.score)})](https://github.com/maximilianfeix/handfeel)`);
    return 0;
  }
  if (flags.json) console.log(renderJson(result));
  else if (flags.sarif) console.log(renderSarif(result));
  else if (flags.md) console.log(renderMarkdown(result));
  else console.log(renderText(result, st, { summary: !!flags.summary, root: dir }));

  if (flags['min-score'] !== undefined) {
    const min = Number(flags['min-score']);
    if (Number.isFinite(min) && result.score < min) {
      if (!flags.json && !flags.sarif) console.error(`handfeel: score ${result.score} is below --min-score ${min}`);
      return 1;
    }
  }
  return 0;
}

process.exitCode = main();
