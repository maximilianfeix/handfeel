export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const todayKey = () => toKey(new Date());

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/** Last n day keys, oldest first, ending today. */
export function lastDays(n: number): { key: string; date: Date }[] {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const date = addDays(now, -(n - 1 - i));
    return { key: toKey(date), date };
  });
}

export const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
