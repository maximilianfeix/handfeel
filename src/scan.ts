import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { collect, globToRegExp } from './files.js';
import { isIgnored, loadSource, type SourceFile } from './source.js';
import { RULES, ruleCatalog } from './rules/index.js';
import { collectColorSymbols, type Project } from './rules/api.js';
import { computeScore, grade } from './score.js';
import type { Finding, Platform, ScanResult } from './types.js';
import { VERSION } from './version.js';

export interface ScanOptions {
  ignore?: string[];
  /** Only run these rule ids. */
  only?: string[];
  /** Skip these rule ids. */
  disable?: string[];
}

export function scan(dir: string, opts: ScanOptions = {}): ScanResult {
  const root = resolve(dir);
  if (!statSync(root).isDirectory()) throw new Error(`${dir} is not a directory`);
  const { candidates, manifests } = collect(root, (opts.ignore ?? []).map(globToRegExp));
  const files: SourceFile[] = [];
  const skipped: ScanResult['skipped'] = [];
  for (const c of candidates) {
    try {
      files.push(loadSource(c.rel, c.abs, readFileSync(c.abs, 'utf8'), c.platform));
    } catch (e) {
      skipped.push({ file: c.rel, reason: (e as Error).message.split('\n')[0] });
    }
  }
  const platforms = [...new Set(files.map((f) => f.platform))].sort() as Platform[];
  const project: Project = { root, files, platforms, manifests, colorSymbols: collectColorSymbols(files) };

  const enabled = (id: string) => (!opts.only?.length || opts.only.includes(id)) && !opts.disable?.includes(id);
  const findings: Finding[] = [];
  for (const rule of RULES) {
    if (!enabled(rule.id)) continue;
    if (!rule.platforms.some((p) => platforms.includes(p))) continue;
    if (rule.file) {
      for (const f of files) {
        if (!rule.platforms.includes(f.platform)) continue;
        try {
          rule.file(
            f,
            (offset, message) => {
              const { line, column } = f.lines.pos(offset);
              if (!isIgnored(f, rule.id, line)) findings.push({ rule: rule.id, file: f.rel, line, column, message });
            },
            project,
          );
        } catch (e) {
          skipped.push({ file: f.rel, reason: `${rule.id}: ${(e as Error).message}` });
        }
      }
    }
    if (rule.project) {
      rule.project(project, (file, line, message) => {
        const f = files.find((x) => x.rel === file);
        if (f && isIgnored(f, rule.id, line)) return;
        findings.push({ rule: rule.id, file, line, column: 1, message });
      });
    }
  }
  // de-duplicate (two implementations can flag the same spot)
  const seen = new Set<string>();
  const unique = findings.filter((f) => {
    const k = `${f.rule}|${f.file}|${f.line}|${f.column}|${f.message}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  unique.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column || a.rule.localeCompare(b.rule));

  const { score, breakdown } = computeScore(unique, ruleCatalog());
  return { version: VERSION, root, platforms, filesScanned: files.length, score, grade: grade(score), breakdown, findings: unique, skipped };
}
