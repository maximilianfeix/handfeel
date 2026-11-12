// Lint for the rule catalog: ids are kebab-case, every rule has sources, docs mention every id.
import { readFileSync } from 'node:fs';
import { RULES, ruleCatalog } from '../dist/src/index.js';

let bad = 0;
const fail = (m) => { console.error('rules: ' + m); bad++; };
for (const r of RULES) {
  if (!/^[a-z][a-z0-9-]+$/.test(r.id)) fail(`bad id ${r.id}`);
  if (!r.sources.length) fail(`${r.id} has no source`);
}
const refs = ['expo', 'flutter', 'swiftui', 'compose', 'signs'].map((p) => readFileSync(`skills/handfeel/references/${p}.md`, 'utf8')).join('\n');
for (const c of ruleCatalog()) if (!refs.includes(c.id)) fail(`${c.id} is not mentioned in any reference`);
if (bad) process.exit(1);
console.log(`rules: ${ruleCatalog().length} ids ok`);
