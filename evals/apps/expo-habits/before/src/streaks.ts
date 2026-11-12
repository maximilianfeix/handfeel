import { addDays, toKey, todayKey } from './dates';
import type { Habit } from './types';

/** Current streak: consecutive days ending today (or yesterday if today is still open). */
export function currentStreak(habit: Habit): number {
  const set = new Set(habit.completions);
  let cursor = new Date();
  if (!set.has(todayKey())) cursor = addDays(cursor, -1);
  let count = 0;
  while (set.has(toKey(cursor))) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function bestStreak(habit: Habit): number {
  const days = [...new Set(habit.completions)].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of days) {
    const [y, m, d] = k.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    run = prev && toKey(addDays(prev, 1)) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = date;
  }
  return best;
}
