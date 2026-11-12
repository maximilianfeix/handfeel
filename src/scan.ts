import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { collect, errorReason, globToRegExp, readSource } from './files.js';
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

/** Thrown for problems with the input (missing folder, a file instead of a folder), not for bugs. */
export class ScanError extends Error {
  constructor(
    message: string,
    readonly code: 'not-found' | 'not-a-directory' | 'unreadable',
  ) {
    super(message);
    this.name = 'ScanError';
  }
}

/** What the scanner looks for to recognise a mobile app; printed when it finds none. */
export const LOOKED_FOR = [
  'package.json with react-native or expo (or .js/.ts files importing them)',
  'pubspec.yaml or .dart files (Flutter)',
  '.swift files importing SwiftUI',
  '.kt files importing androidx.compose',
];

const firstLine = (e: unknown) => errorReason(e);

export function scan(dir: string, opts: ScanOptions = {}): ScanResult {
  const root = resolve(dir);
  let st;
  try {
    st = statSync(root);
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === 'ENOENT' || code === 'ENOTDIR') throw new ScanError(`${dir}: no such folder`, 'not-found');
    throw new ScanError(`${dir}: cannot read (${code ?? firstLine(e)})`, 'unreadable');
  }
  if (!st.isDirectory()) throw new ScanError(`${dir} is a file. Pass the folder of the app, e.g. handfeel scan .`, 'not-a-directory');
  const collected = collect(root, (opts.ignore ?? []).map(globToRegExp));
  const { candidates, manifests } = collected;
  const files: SourceFile[] = [];
  const skipped: ScanResult['skipped'] = collected.skipped;
  for (const c of candidates) {
    try {
      files.push(loadSource(c.rel, c.abs, c.text ?? readSource(c.abs), c.platform));
    } catch (e) {
      skipped.push({ file: c.rel, reason: firstLine(e) });
    }
  }
  const platforms = [...new Set(files.map((f) => f.platform))].sort() as Platform[];
  let colorSymbols: Project['colorSymbols'] = new Map();
  try {
    colorSymbols = collectColorSymbols(files);
  } catch (e) {
    skipped.push({ file: '.', reason: `color symbols: ${firstLine(e)}` });
  }
  const project: Project = { root, files, platforms, manifests, colorSymbols };
  const byRel = new Map(files.map((f) => [f.rel, f]));

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
          skipped.push({ file: f.rel, reason: `${rule.id}: ${firstLine(e)}` });
        }
      }
    }
    if (rule.project) {
      try {
        rule.project(project, (file, line, message) => {
          const f = byRel.get(file);
          if (f && isIgnored(f, rule.id, line)) return;
          findings.push({ rule: rule.id, file, line, column: 1, message });
        });
      } catch (e) {
        skipped.push({ file: '.', reason: `${rule.id}: ${firstLine(e)}` });
      }
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

  if (!files.length) {
    const reason = `No mobile app source found. Looked for: ${LOOKED_FOR.join('; ')}.${skipped.length ? ` ${skipped.length} file(s) could not be read (see skipped).` : ''}`;
    return { version: VERSION, root, platforms, filesScanned: 0, score: null, grade: null, reason, breakdown: [], findings: [], skipped };
  }
  const { score, breakdown } = computeScore(unique, ruleCatalog(), files.length);
  return { version: VERSION, root, platforms, filesScanned: files.length, score, grade: grade(score), breakdown, findings: unique, skipped };
}
