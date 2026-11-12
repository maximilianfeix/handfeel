import type { Rule } from './api.js';
import { commonRules } from './common.js';
import { rnRules } from './rn.js';
import { flutterRules } from './flutter.js';
import { swiftRules } from './swiftui.js';
import { composeRules } from './compose.js';
import { projectRules } from './project.js';

/** All rule implementations. Several implementations may share one id (one per platform). */
export const RULES: Rule[] = [...commonRules, ...rnRules, ...flutterRules, ...swiftRules, ...composeRules, ...projectRules];

export interface RuleInfo {
  id: string;
  title: string;
  weight: number;
  cap: number;
  free: number;
  perOccurrence: boolean;
  platforms: string[];
  why: string;
  fix: string;
  sources: { title: string; url: string }[];
}

/** One entry per rule id, merging platforms and sources across implementations. Weight/cap come from the first. */
export function ruleCatalog(): RuleInfo[] {
  const map = new Map<string, RuleInfo>();
  for (const r of RULES) {
    const cur = map.get(r.id);
    if (!cur) {
      map.set(r.id, { id: r.id, title: r.title, weight: r.weight, cap: r.cap, free: r.free ?? 0, perOccurrence: !!r.perOccurrence, platforms: [...r.platforms], why: r.why, fix: r.fix, sources: [...r.sources] });
      continue;
    }
    for (const p of r.platforms) if (!cur.platforms.includes(p)) cur.platforms.push(p);
    for (const s of r.sources) if (!cur.sources.some((x) => x.url === s.url)) cur.sources.push(s);
  }
  return [...map.values()];
}
