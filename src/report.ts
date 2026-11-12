import { PLATFORM_LABEL, type ScanResult } from './types.js';
import { ruleCatalog } from './rules/index.js';

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
  const c = scoreColor(r.score, st);
  out.push(`  ${c(st.bold(padL(String(r.score), 3)))}${st.dim(' / 100')}   ${c(r.grade)}`);
  out.push('');
  if (r.breakdown.length) {
    out.push(`  ${st.dim('where the points went')}`);
    const idW = Math.max(...r.breakdown.map((b) => b.rule.length));
    for (const b of r.breakdown) {
      const math = b.free ? `${b.count} found, ${b.free} free` : `${b.count} found`;
      const capped = b.weight * Math.max(0, b.count - b.free) > b.cap ? st.dim(` (capped at ${b.cap})`) : '';
      out.push(`  ${padL(b.penalty ? '-' + fmtNum(b.penalty) : '0', 5)}  ${pad(b.rule, idW)}  ${st.dim(math)}${capped}`);
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
  if (!r.findings.length && r.filesScanned) out.push(`  ${st.green('Nothing to report.')}`);
  if (!r.filesScanned) out.push(`  No Expo/React Native, Flutter, SwiftUI or Compose source found under ${opts.root ?? r.root}.`);
  if (r.skipped.length) out.push(st.dim(`  ${r.skipped.length} file(s) skipped (parse errors). Use --json to see them.`));
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
  out.push(`### handfeel: ${r.score}/100 (${r.grade})`);
  out.push('');
  out.push(`${r.platforms.map((p) => PLATFORM_LABEL[p]).join(', ')} · ${r.filesScanned} files · ${r.findings.length} findings`);
  out.push('');
  if (r.breakdown.length) {
    out.push('| Rule | Found | Points |');
    out.push('|---|---:|---:|');
    for (const b of r.breakdown) out.push(`| \`${b.rule}\` | ${b.count} | -${fmtNum(b.penalty)} |`);
    out.push('');
  }
  return out.join('\n');
}
