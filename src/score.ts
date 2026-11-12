import type { Finding, RuleScore } from './types.js';
import type { RuleInfo } from './rules/index.js';

/**
 * score = 100 - sum over rules of min(cap, weight * max(0, count - free))
 * Each rule's deduction is capped, so one noisy rule cannot sink the score,
 * and the breakdown shows exactly where every point went.
 */
export function computeScore(findings: Finding[], catalog: RuleInfo[]): { score: number; breakdown: RuleScore[] } {
  const counts = new Map<string, number>();
  for (const f of findings) counts.set(f.rule, (counts.get(f.rule) ?? 0) + 1);
  const breakdown: RuleScore[] = [];
  for (const r of catalog) {
    const count = counts.get(r.id) ?? 0;
    if (!count) continue;
    const penalty = Math.min(r.cap, r.weight * Math.max(0, count - r.free));
    breakdown.push({ rule: r.id, title: r.title, count, penalty: Math.round(penalty * 10) / 10, weight: r.weight, cap: r.cap, free: r.free });
  }
  breakdown.sort((a, b) => b.penalty - a.penalty || b.count - a.count);
  const total = breakdown.reduce((s, b) => s + b.penalty, 0);
  // floor, so that any deduction is visible: 0.5 points off is 99, not 100
  return { score: Math.max(0, Math.floor(100 - total + 1e-9)), breakdown };
}

export function grade(score: number): string {
  if (score >= 90) return 'feels native';
  if (score >= 75) return 'almost there';
  if (score >= 50) return 'looks generated';
  return 'AI look';
}
