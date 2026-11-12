export interface RGB {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Parses #rgb, #rgba, #rrggbb, #rrggbbaa, rgb(), rgba(). */
export function parseCssColor(input: string): RGB | null {
  const s = input.trim().toLowerCase();
  let m = /^#([0-9a-f]{3,4})$/.exec(s);
  if (m) {
    const h = m[1];
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
      a: h.length === 4 ? parseInt(h[3] + h[3], 16) / 255 : 1,
    };
  }
  m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/.exec(s);
  if (m) {
    const h = m[1];
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: m[2] ? parseInt(m[2], 16) / 255 : 1,
    };
  }
  m = /^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/.exec(s);
  if (m) {
    let a = 1;
    if (m[4] !== undefined) a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: +m[1], g: +m[2], b: +m[3], a };
  }
  return null;
}

/** Parses 0xAARRGGBB as used by Flutter and Compose `Color(0xFF6366F1)`. */
export function parseArgbInt(hex: string): RGB | null {
  const m = /^0x([0-9a-fA-F]{8})$/.exec(hex.trim());
  if (!m) return null;
  const v = m[1];
  return {
    a: parseInt(v.slice(0, 2), 16) / 255,
    r: parseInt(v.slice(2, 4), 16),
    g: parseInt(v.slice(4, 6), 16),
    b: parseInt(v.slice(6, 8), 16),
  };
}

export function toHsl({ r, g, b }: RGB): { h: number; s: number; l: number } {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === R) h = ((G - B) / d + (G < B ? 6 : 0)) * 60;
  else if (max === G) h = ((B - R) / d + 2) * 60;
  else h = ((R - G) / d + 4) * 60;
  return { h, s, l };
}

/**
 * The indigo-violet-purple band that generated UIs reach for by default.
 * Hue 235-295, clearly saturated, neither near-black nor near-white.
 */
export function isAiPurple(c: RGB): boolean {
  const { h, s, l } = toHsl(c);
  return h >= 235 && h <= 295 && s >= 0.4 && l >= 0.3 && l <= 0.8;
}

export function hex6(c: RGB): string {
  const p = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return `#${p(c.r)}${p(c.g)}${p(c.b)}`.toUpperCase();
}

/**
 * Accent colors that show up again and again in generated apps: the Tailwind
 * indigo/violet/purple 500-600 steps, the "#667eea -> #764ba2" gradient that
 * fills countless templates, and #6C63FF from the unDraw illustration set.
 * See docs/slop-catalog.md for the counts.
 */
export const DEFAULT_AI_ACCENTS = new Set([
  '#6366F1', // tailwind indigo-500
  '#4F46E5', // tailwind indigo-600
  '#818CF8', // tailwind indigo-400
  '#8B5CF6', // tailwind violet-500
  '#7C3AED', // tailwind violet-600
  '#A78BFA', // tailwind violet-400
  '#A855F7', // tailwind purple-500
  '#9333EA', // tailwind purple-600
  '#C084FC', // tailwind purple-400
  '#667EEA',
  '#764BA2',
  '#6C63FF',
  '#6C5CE7',
  '#7F5AF0',
]);
