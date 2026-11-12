#!/usr/bin/env node
import { scan, ScanError } from './scan.js';
import { badgeUrl, makeStyle, renderCard, renderJson, renderMarkdown, renderSarif, renderText } from './report.js';
import { ruleCatalog } from './rules/index.js';
import { REFERENCE_FILES } from './score.js';
import { PLATFORM_LABEL, type Platform, type ScanResult } from './types.js';
import { VERSION } from './version.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEMO_DIR = join(PKG_ROOT, 'demo', 'flutter-fitness');
const REPO = 'https://github.com/maximilianfeix/handfeel';

const EXIT_CODES = `Exit codes
  0  scanned (or help printed)
  1  score below --min-score
  2  usage error, folder not found, or no mobile app source found
  3  internal error (please report it)`;

const HELP = `handfeel ${VERSION}
Find the AI look in mobile apps. Static, offline, no AI calls.

Usage
  handfeel scan [dir]          Scan a project and print a 0-100 score
  handfeel scan --demo         Scan a small generated demo app (no app of your own needed)
  handfeel rules               List every rule with its weight and cap
  handfeel explain <rule>      Why a rule exists, how to fix it, sources
  handfeel badge [dir]         Print a README badge with your score
  handfeel init cursor         Write .cursor/rules/handfeel.mdc into this project

  handfeel <command> --help    Options of one command
  handfeel --version           Print the version

Options for scan
  --json                       Machine-readable result (only JSON on stdout)
  --sarif                      SARIF 2.1.0 (GitHub code scanning)
  --md                         Markdown summary (PR comments)
  --summary                    Score and breakdown only, no findings
  --card <file.svg>            Also write a 1200x630 score card to share
  --min-score <n>              Exit with code 1 if the score is below n
  --ignore <glob>              Skip paths (repeatable), e.g. --ignore "legacy/**"
  --only <ids>                 Comma-separated rule ids to run
  --disable <ids>              Comma-separated rule ids to skip
  --demo                       Scan the bundled demo app instead of [dir]
  --no-color                   Plain output (also NO_COLOR=1; FORCE_COLOR=1 forces color)

Ignore a single finding with a comment on the line above:
  // handfeel-ignore-next-line hardcoded-color

${EXIT_CODES}
`;

const SCAN_HELP = `handfeel scan [dir] [options]

Scans the Expo/React Native, Flutter, SwiftUI or Jetpack Compose app in dir
(default: the current folder) and prints a 0-100 score with every finding.

Options
  --json                       Machine-readable result (only JSON on stdout)
  --sarif                      SARIF 2.1.0 (GitHub code scanning)
  --md                         Markdown summary (PR comments)
  --summary                    Score and breakdown only, no findings
  --card <file.svg>            Also write a 1200x630 score card to share
  --min-score <n>              Exit with code 1 if the score is below n
  --ignore <glob>              Skip paths (repeatable), e.g. --ignore "legacy/**"
  --only <ids>                 Comma-separated rule ids to run (see: handfeel rules)
  --disable <ids>              Comma-separated rule ids to skip
  --demo                       Scan the bundled demo app (a generated Flutter app)
  --no-color                   Plain output (also NO_COLOR=1; FORCE_COLOR=1 forces color)

Examples
  npx handfeel scan .
  npx handfeel scan apps/mobile --summary --card score.svg
  npx handfeel scan . --sarif > handfeel.sarif

${EXIT_CODES}
`;

const COMMAND_HELP: Record<string, string> = {
  scan: SCAN_HELP,
  rules: `handfeel rules [--json]

Lists every rule with its weight (points per finding) and cap (most points it can cost).

${EXIT_CODES}
`,
  explain: `handfeel explain <rule>

Prints why a rule exists, how to fix it, how it is scored and its sources.
Rule ids: handfeel rules

${EXIT_CODES}
`,
  badge: `handfeel badge [dir] [--ignore <glob>] [--only <ids>] [--disable <ids>]

Scans dir and prints a Markdown badge with the score for your README.

${EXIT_CODES}
`,
  init: `handfeel init cursor [--force]

Writes .cursor/rules/handfeel.mdc into the current folder so Cursor's agent follows the
handfeel skill. Claude Code, Codex and others: npx skills add maximilianfeix/handfeel
--force overwrites an existing file.

${EXIT_CODES}
`,
};

const COMMANDS = ['scan', 'rules', 'explain', 'badge', 'init', 'help'];

/** Flags each command accepts; `true` means the flag takes a value. */
const FLAGS: Record<string, Record<string, boolean>> = {
  scan: { json: false, sarif: false, md: false, summary: false, card: true, 'min-score': true, ignore: true, only: true, disable: true, demo: false, 'no-color': false, color: false },
  badge: { ignore: true, only: true, disable: true, demo: false, 'no-color': false, color: false },
  rules: { json: false, 'no-color': false, color: false },
  explain: { 'no-color': false, color: false },
  init: { force: false },
  help: {},
};

class UsageError extends Error {}

interface Parsed {
  cmd: string;
  args: string[];
  flags: Record<string, string | boolean>;
  ignore: string[];
  help: boolean;
  version: boolean;
}

/** Closest known flag, for "did you mean". */
function suggest(name: string, known: string[]): string | undefined {
  const dist = (a: string, b: string) => {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  };
  let best: string | undefined;
  let bestD = 3;
  for (const k of known) {
    const dd = dist(name, k);
    if (dd < bestD) {
      bestD = dd;
      best = k;
    }
  }
  return best;
}

function parseArgs(argv: string[]): Parsed {
  const out: Parsed = { cmd: '', args: [], flags: {}, ignore: [], help: false, version: false };
  const raw: { name: string; value?: string; index: number }[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') break;
    if (a === '-h' || a === '--help') out.help = true;
    else if (a === '-v' || a === '-V' || a === '--version') out.version = true;
    else if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      raw.push(eq > 0 ? { name: a.slice(2, eq), value: a.slice(eq + 1), index: i } : { name: a.slice(2), index: i });
    } else if (a.startsWith('-') && a.length > 1) throw new UsageError(`Unknown option ${a}. Run: handfeel --help`);
  }
  // the command is the first positional argument that is not a flag value
  const valueFlags = new Set(Object.values(FLAGS).flatMap((f) => Object.keys(f).filter((k) => f[k])));
  const positional: string[] = [];
  const consumed = new Set<number>();
  for (const r of raw) if (r.value === undefined && valueFlags.has(r.name) && r.index + 1 < argv.length && !argv[r.index + 1].startsWith('-')) consumed.add(r.index + 1);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') {
      positional.push(...argv.slice(i + 1));
      break;
    }
    if (consumed.has(i) || (a.startsWith('-') && a.length > 1)) continue;
    positional.push(a);
  }
  out.cmd = positional[0] ?? '';
  out.args = positional.slice(1);
  if (!out.cmd) {
    if (raw.length && !out.help && !out.version) out.cmd = 'scan';
    else return out;
  }
  if (!COMMANDS.includes(out.cmd)) {
    // `handfeel ./app` is shorthand for `handfeel scan ./app`, but only for a path that exists
    if (existsSync(out.cmd)) {
      out.args.unshift(out.cmd);
      out.cmd = 'scan';
    } else {
      const s = suggest(out.cmd, COMMANDS.filter((c) => c !== 'help'));
      throw new UsageError(`Unknown command "${out.cmd}"${s ? ` (did you mean "${s}"?)` : ''}. Run: handfeel --help`);
    }
  }
  const known = FLAGS[out.cmd] ?? {};
  for (const r of raw) {
    if (!(r.name in known)) {
      const s = suggest(r.name, Object.keys(known));
      throw new UsageError(`Unknown option --${r.name} for "handfeel ${out.cmd}"${s ? ` (did you mean --${s}?)` : ''}. Run: handfeel ${out.cmd} --help`);
    }
    let v: string | boolean = true;
    if (known[r.name]) {
      if (r.value !== undefined) v = r.value;
      else if (consumed.has(r.index + 1)) v = argv[r.index + 1];
      else throw new UsageError(`--${r.name} needs a value. Run: handfeel ${out.cmd} --help`);
      if (v === '') throw new UsageError(`--${r.name} needs a value. Run: handfeel ${out.cmd} --help`);
    } else if (r.value !== undefined) throw new UsageError(`--${r.name} does not take a value.`);
    if (r.name === 'ignore') out.ignore.push(String(v));
    else out.flags[r.name] = v;
  }
  return out;
}

/** NO_COLOR (https://no-color.org) and FORCE_COLOR; color only on a terminal otherwise. */
export function useColor(flags: Record<string, unknown>, env: NodeJS.ProcessEnv, isTTY: boolean): boolean {
  if (flags['no-color']) return false;
  if (flags.color) return true;
  if (env.NO_COLOR) return false;
  const force = env.FORCE_COLOR;
  if (force) return force !== '0' && force !== 'false';
  return isTTY && env.TERM !== 'dumb';
}

function checkRuleIds(list: string[] | undefined, flag: string) {
  if (!list) return;
  const ids = new Set(ruleCatalog().map((r) => r.id));
  const bad = list.filter((id) => !ids.has(id));
  if (bad.length) {
    const hints = bad.map((b) => {
      const s = suggest(b, [...ids]);
      return s ? `${b} (did you mean ${s}?)` : b;
    });
    throw new UsageError(`Unknown rule id${bad.length > 1 ? 's' : ''} in --${flag}: ${hints.join(', ')}. Run: handfeel rules`);
  }
}

function main(argv: string[]): number {
  const p = parseArgs(argv);
  if (p.version) {
    console.log(VERSION);
    return 0;
  }
  if (p.help || !p.cmd || p.cmd === 'help') {
    const topic = p.cmd === 'help' ? p.args[0] : p.cmd;
    console.log(topic && COMMAND_HELP[topic] ? COMMAND_HELP[topic] : HELP);
    return 0;
  }
  const { cmd, args, flags } = p;
  const st = makeStyle(useColor(flags, process.env, process.stdout.isTTY === true));

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
      console.log(`  ${' '.repeat(w)}  ${st.dim(pts + ' · ' + c.platforms.map((pl) => PLATFORM_LABEL[pl as Platform]).join(', '))}`);
    }
    console.log('');
    return 0;
  }

  if (cmd === 'explain') {
    const id = args[0];
    const cat = ruleCatalog();
    const r = cat.find((c) => c.id === id);
    if (!r) {
      const s = id ? suggest(id, cat.map((c) => c.id)) : undefined;
      console.error(id ? `Unknown rule "${id}"${s ? ` (did you mean "${s}"?)` : ''}. Run: handfeel rules` : 'Usage: handfeel explain <rule>   (rule ids: handfeel rules)');
      return 2;
    }
    const width = Math.max(40, Math.min(process.stdout.columns || 80, 88) - 4);
    const wrap = (t: string) => {
      const lines: string[] = [];
      let cur = '';
      for (const w of t.split(/\s+/)) {
        if (cur && cur.length + 1 + w.length > width) {
          lines.push(cur);
          cur = w;
        } else cur = cur ? cur + ' ' + w : w;
      }
      if (cur) lines.push(cur);
      return lines.map((l) => '  ' + l).join('\n');
    };
    console.log(`\n  ${st.bold(r.id)}  ${r.title}\n`);
    console.log(`  ${st.dim('why')}\n${wrap(r.why)}\n`);
    console.log(`  ${st.dim('fix')}\n${wrap(r.fix)}\n`);
    console.log(`  ${st.dim('score')}\n  -${r.weight} per finding, at most -${r.cap}${r.free ? `, first ${r.free} free` : ''}${r.perOccurrence ? `\n  counted per ${REFERENCE_FILES} files in larger projects` : ''}\n`);
    console.log(`  ${st.dim('sources')}`);
    for (const s of r.sources) console.log(`  ${s.title}\n  ${st.dim(s.url)}`);
    console.log('');
    return 0;
  }

  if (cmd === 'init') {
    if (args[0] !== 'cursor') {
      console.error('Usage: handfeel init cursor   (Claude Code, Codex and others: npx skills add maximilianfeix/handfeel)');
      return 2;
    }
    const skill = join(PKG_ROOT, 'skills', 'handfeel');
    let body: string;
    let signs: string;
    try {
      body = readFileSync(join(skill, 'SKILL.md'), 'utf8').replace(/^---[\s\S]*?---\r?\n/, '');
      signs = readFileSync(join(skill, 'references', 'signs.md'), 'utf8');
    } catch {
      console.error(`handfeel: the skill files are missing from this install (${skill}). Reinstall handfeel.`);
      return 3;
    }
    const out = join(process.cwd(), '.cursor', 'rules', 'handfeel.mdc');
    if (existsSync(out) && !flags.force) {
      console.error(`${out} exists. Use --force to overwrite.`);
      return 1;
    }
    const mdc = [
      '---',
      'description: Remove the AI look from mobile app screens (Expo/React Native, Flutter, SwiftUI, Jetpack Compose). Use when asked to audit, polish, unslop or make an app feel native.',
      'globs: ["**/*.tsx", "**/*.jsx", "**/*.dart", "**/*.swift", "**/*.kt"]',
      'alwaysApply: false',
      '---',
      '',
      body.replace(/\]\(references\//g, `](${REPO}/blob/main/skills/handfeel/references/`),
      '',
      signs.replace(/^# /m, '## '),
      '',
    ].join('\n');
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, mdc);
    console.log(`Wrote ${out}`);
    return 0;
  }

  // scan and badge
  if (args.length > 1) throw new UsageError(`handfeel ${cmd} takes one folder, got ${args.length}: ${args.join(' ')}. Quote globs passed to --ignore.`);
  const demo = !!flags.demo;
  if (demo && args.length) throw new UsageError('--demo scans the bundled demo app; leave out the folder.');
  if (demo && !existsSync(DEMO_DIR)) {
    console.error(`handfeel: the demo app is missing from this install (${DEMO_DIR}).`);
    return 3;
  }
  const dir = demo ? DEMO_DIR : (args[0] ?? '.');
  const formats = ['json', 'sarif', 'md'].filter((f) => flags[f]);
  if (formats.length > 1) throw new UsageError(`Pick one output format, not ${formats.map((f) => '--' + f).join(' and ')}.`);
  let min: number | undefined;
  if (flags['min-score'] !== undefined) {
    min = Number(flags['min-score']);
    if (!Number.isFinite(min) || min < 0 || min > 100) throw new UsageError(`--min-score must be a number from 0 to 100, got "${flags['min-score']}".`);
  }
  const list = (v: unknown) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined);
  const only = list(flags.only);
  const disable = list(flags.disable);
  checkRuleIds(only, 'only');
  checkRuleIds(disable, 'disable');

  let result: ScanResult;
  try {
    result = scan(dir, { ignore: p.ignore, only, disable });
  } catch (e) {
    if (e instanceof ScanError) {
      console.error(`handfeel: ${e.message}`);
      return 2;
    }
    throw e;
  }
  if (demo) result = { ...result, root: 'demo/flutter-fitness' };

  if (cmd === 'badge') {
    if (result.score === null) {
      console.error(`handfeel: ${result.reason}`);
      return 2;
    }
    console.log(`[![handfeel score](${badgeUrl(result.score)})](${REPO})`);
    return 0;
  }
  const root = demo ? 'the demo app' : dir;
  if (flags.json) console.log(renderJson(result));
  else if (flags.sarif) console.log(renderSarif(result));
  else if (flags.md) console.log(renderMarkdown(result));
  else console.log(renderText(result, st, { summary: !!flags.summary, root }));
  // anything that is not the requested format goes to stderr, so --json/--sarif stay parseable
  const note = flags.json || flags.sarif || flags.md ? console.error : console.log;

  if (result.score === null) {
    if (flags.json || flags.sarif || flags.md) console.error(`handfeel: ${result.reason}`);
    return 2;
  }
  if (typeof flags.card === 'string') {
    try {
      mkdirSync(dirname(flags.card), { recursive: true });
      writeFileSync(flags.card, renderCard(result));
      note(st.dim(`  Score card written to ${flags.card}`));
    } catch (e) {
      console.error(`handfeel: could not write ${flags.card}: ${(e as Error).message}`);
      return 2;
    }
  }
  if (demo) note('This is a generated demo app. Run `npx handfeel scan .` in your own project.');
  if (min !== undefined && result.score < min) {
    console.error(`handfeel: score ${result.score} is below --min-score ${min}`);
    return 1;
  }
  return 0;
}

// `handfeel scan . | head` closes the pipe early; that is not an error
process.stdout.on('error', (e: NodeJS.ErrnoException) => {
  if (e.code === 'EPIPE') process.exit(process.exitCode ?? 0);
  throw e;
});

function run(): number {
  try {
    return main(process.argv.slice(2));
  } catch (e) {
    if (e instanceof UsageError) {
      console.error(`handfeel: ${e.message}`);
      return 2;
    }
    const err = e as Error;
    console.error(`handfeel: internal error: ${err?.message ?? e}`);
    if (process.env.HANDFEEL_DEBUG) console.error(err?.stack);
    else console.error(`Please report it at ${REPO}/issues (run with HANDFEEL_DEBUG=1 for details).`);
    return 3;
  }
}

process.exitCode = run();
