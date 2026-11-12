import { PLATFORM_LABEL, type ScanResult } from './types.js';
import { LOOKED_FOR } from './scan.js';
import { ruleCatalog } from './rules/index.js';
import { REFERENCE_FILES } from './score.js';

export interface Style {
  bold(s: string): string;
  dim(s: string): string;
  red(s: string): string;
  yellow(s: string): string;
  green(s: string): string;
  accent(s: string): string;
}

export function makeStyle(color: boolean): Style {
  const w = (open: string, close: string) => (s: string) => (color ? `\x1b[${open}m${s}\x1b[${close}m` : s);
  return { bold: w('1', '22'), dim: w('2', '22'), red: w('31', '39'), yellow: w('33', '39'), green: w('32', '39'), accent: w('38;5;209', '39') };
}

const pad = (s: string, n: number) => (s.length >= n ? s : s + ' '.repeat(n - s.length));
const padL = (s: string, n: number) => (s.length >= n ? s : ' '.repeat(n - s.length) + s);
const fmtNum = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function scoreColor(score: number, st: Style) {
  return score >= 90 ? st.green : score >= 75 ? st.yellow : st.red;
}

export function renderText(r: ScanResult, st: Style, opts: { summary?: boolean; root?: string } = {}): string {
  const out: string[] = [];
  const pl = r.platforms.map((p) => PLATFORM_LABEL[p]).join(', ') || 'no mobile code found';
  out.push('');
  out.push(`  ${st.bold('handfeel')} ${st.dim(r.version)}  ${st.dim('·')}  ${pl}  ${st.dim('·')}  ${r.filesScanned} files`);
  out.push('');
  if (r.score === null) {
    out.push(`  No mobile app source found in ${opts.root ?? r.root}, so there is no score.`);
    out.push('');
    out.push(`  ${st.dim('Looked for:')}`);
    for (const l of LOOKED_FOR) out.push(`    ${l}`);
    out.push(`  ${st.dim('Skipped: node_modules, build output, tests, native ios/ and android/ folders, and hidden folders.')}`);
    if (r.skipped.length) out.push(`  ${r.skipped.length} file(s) could not be read. Use --json to see which and why.`);
    out.push('');
    out.push(`  Run it on the folder that holds the app (where package.json or pubspec.yaml is), or try: npx handfeel scan --demo`);
    out.push('');
    return out.join('\n');
  }
  const c = scoreColor(r.score, st);
  out.push(`  ${c(st.bold(padL(String(r.score), 3)))}${st.dim(' / 100')}   ${c(r.grade ?? '')}`);
  out.push('');
  if (r.breakdown.length) {
    out.push(`  ${st.dim('where the points went')}`);
    const idW = Math.max(...r.breakdown.map((b) => b.rule.length));
    for (const b of r.breakdown) {
      const scaled = b.counted !== b.count ? `, counts as ${b.counted < 0.1 ? '<0.1' : fmtNum(b.counted)}` : '';
      const math = `${b.count} found${scaled}${b.free ? `, ${b.free} free` : ''}`;
      const capped = b.weight * Math.max(0, b.counted - b.free) > b.cap ? st.dim(` (capped at ${b.cap})`) : '';
      out.push(`  ${padL(b.penalty ? '-' + fmtNum(b.penalty) : '0', 5)}  ${pad(b.rule, idW)}  ${st.dim(math)}${capped}`);
    }
    if (r.breakdown.some((b) => b.counted !== b.count)) {
      out.push(st.dim(`  ${r.filesScanned} files: per-occurrence findings are counted per ${REFERENCE_FILES} files (x ${REFERENCE_FILES}/${r.filesScanned}).`));
      out.push(st.dim(`  The weights were set on generated apps of 4-15 files; a larger app has more of everything.`));
    }
    out.push('');
  }
  if (!opts.summary && r.findings.length) {
    let cur = '';
    const idW = Math.max(...r.findings.map((f) => f.rule.length));
    for (const f of r.findings) {
      if (f.file !== cur) {
        cur = f.file;
        out.push(`  ${st.bold(f.file)}`);
      }
      out.push(`    ${st.dim(pad(`${f.line}:${f.column}`, 8))}${st.accent(pad(f.rule, idW))}  ${f.message}`);
    }
    out.push('');
  }
  if (!r.findings.length) out.push(`  ${st.green('Nothing to report.')}`);
  if (r.skipped.length) out.push(st.dim(`  ${r.skipped.length} file(s) skipped (unreadable, too large, minified or not parseable). Use --json to see which and why.`));
  if (r.findings.length) out.push(st.dim('  handfeel explain <rule>  shows why a rule exists and how to fix it.'));
  out.push('');
  return out.join('\n');
}

export function renderJson(r: ScanResult): string {
  return JSON.stringify(r, null, 2);
}

export function renderSarif(r: ScanResult): string {
  const catalog = ruleCatalog();
  const used = new Set(r.findings.map((f) => f.rule));
  const rules = catalog
    .filter((c) => used.has(c.id))
    .map((c) => ({
      id: c.id,
      name: c.id,
      shortDescription: { text: c.title },
      fullDescription: { text: c.why },
      help: { text: `${c.fix}\n\nSources:\n${c.sources.map((s) => `- ${s.title}: ${s.url}`).join('\n')}`, markdown: `${c.fix}\n\n${c.sources.map((s) => `- [${s.title}](${s.url})`).join('\n')}` },
      helpUri: c.sources[0]?.url,
      properties: { tags: ['mobile', 'design', 'accessibility'], weight: c.weight, cap: c.cap },
    }));
  const sarif = {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: { driver: { name: 'handfeel', version: r.version, informationUri: 'https://github.com/maximilianfeix/handfeel', rules } },
        results: r.findings.map((f) => ({
          ruleId: f.rule,
          level: 'warning',
          message: { text: f.message },
          locations: [{ physicalLocation: { artifactLocation: { uri: f.file }, region: { startLine: f.line, startColumn: f.column } } }],
        })),
        properties: { score: r.score, grade: r.grade },
      },
    ],
  };
  return JSON.stringify(sarif, null, 2);
}

export function badgeUrl(score: number): string {
  const color = score >= 90 ? '2f7d4f' : score >= 75 ? 'b7791f' : 'c2412c';
  return `https://img.shields.io/badge/handfeel-${score}%2F100-${color}`;
}

export function renderMarkdown(r: ScanResult): string {
  const out: string[] = [];
  if (r.score === null) {
    out.push('### handfeel: no score');
    out.push('');
    out.push(r.reason ?? 'No mobile app source found.');
    out.push('');
    return out.join('\n');
  }
  out.push(`### handfeel: ${r.score}/100 (${r.grade})`);
  out.push('');
  out.push(`${r.platforms.map((p) => PLATFORM_LABEL[p]).join(', ')} · ${r.filesScanned} files · ${r.findings.length} findings`);
  out.push('');
  if (r.breakdown.length) {
    out.push('| Rule | Found | Points |');
    out.push('|---|---:|---:|');
    for (const b of r.breakdown) out.push(`| \`${b.rule}\` | ${b.count}${b.counted !== b.count ? ` (counts as ${b.counted < 0.1 ? "<0.1" : fmtNum(b.counted)})` : ''} | -${fmtNum(b.penalty)} |`);
    out.push('');
  }
  return out.join('\n');
}

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/**
 * A 1200×630 score card (the size social networks use for link previews), as plain SVG text.
 * Brand colors: ink background, paper text, clay accent. System fonts, real <text> elements.
 */
export function renderCard(r: ScanResult): string {
  if (r.score === null) throw new Error('no score to put on a card');
  const INK = '#151412';
  const PAPER = '#F4F1EA';
  const CLAY = '#E0592A';
  const MUTED = '#A8A397';
  const font = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;
  const mono = `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  const platforms = r.platforms.map((p) => PLATFORM_LABEL[p]).join(' · ');
  const top = r.breakdown.filter((b) => b.penalty > 0).slice(0, 3);
  const lines: string[] = [];
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${xml(`handfeel score ${r.score} of 100: ${r.grade}`)}">`);
  lines.push(`  <rect width="1200" height="630" fill="${INK}"/>`);
  lines.push(`  <rect x="0" y="0" width="16" height="630" fill="${CLAY}"/>`);
  lines.push(`  <text x="80" y="110" fill="${PAPER}" font-family="${xml(font)}" font-size="40" font-weight="700">handfeel</text>`);
  lines.push(`  <text x="80" y="160" fill="${MUTED}" font-family="${xml(font)}" font-size="28">${xml(platforms)} · ${r.filesScanned} files</text>`);
  lines.push(`  <text x="72" y="360" fill="${CLAY}" font-family="${xml(font)}" font-size="200" font-weight="700">${r.score}</text>`);
  const scoreWidth = String(r.score).length * 112 + 72;
  lines.push(`  <text x="${scoreWidth + 20}" y="360" fill="${MUTED}" font-family="${xml(font)}" font-size="56">/ 100</text>`);
  lines.push(`  <text x="80" y="430" fill="${PAPER}" font-family="${xml(font)}" font-size="44" font-weight="600">${xml(r.grade ?? '')}</text>`);
  lines.push(`  <text x="660" y="230" fill="${MUTED}" font-family="${xml(font)}" font-size="24">${top.length ? 'where the points went' : 'no deductions'}</text>`);
  top.forEach((b, i) => {
    const y = 290 + i * 64;
    lines.push(`  <text x="660" y="${y}" fill="${CLAY}" font-family="${xml(mono)}" font-size="30" font-weight="700">-${xml(fmtNum(b.penalty))}</text>`);
    lines.push(`  <text x="760" y="${y}" fill="${PAPER}" font-family="${xml(mono)}" font-size="26">${xml(b.rule)}</text>`);
  });
  lines.push(`  <rect x="80" y="500" width="1040" height="2" fill="${MUTED}" opacity="0.4"/>`);
  lines.push(`  <text x="80" y="562" fill="${PAPER}" font-family="${xml(mono)}" font-size="30">npx handfeel scan</text>`);
  lines.push(`  <text x="1120" y="562" fill="${MUTED}" font-family="${xml(font)}" font-size="26" text-anchor="end">github.com/maximilianfeix/handfeel</text>`);
  lines.push('</svg>');
  return lines.join('\n') + '\n';
}
