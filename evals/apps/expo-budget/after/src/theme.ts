import { StyleSheet, useColorScheme } from 'react-native';
import type { CategoryId } from './types';

// Color roles. Screens reference roles, never hex. Both schemes are checked for
// 4.5:1 text contrast against bg and surface.
const dark = {
  bg: '#0B0D12',
  surface: '#14171F',
  surfaceAlt: '#1F2330',
  border: '#2A2F3B',
  text: '#F4F5F7',
  textMuted: '#959BAB',
  accent: '#7C8CFF',
  onAccent: '#0B0D12',
  ripple: '#2A2F3B',
  pressed: '#1F2330',
  positive: '#4ADE9A',
  negative: '#FF6B7A',
  warning: '#FFB454',
  category: {
    food: '#FFB454',
    transport: '#5CC8FF',
    shopping: '#FF7AC6',
    bills: '#C6A4FF',
    fun: '#4ADE9A',
    income: '#7C8CFF',
  } as Record<CategoryId, string>,
};

export type Colors = typeof dark;

const light: Colors = {
  bg: '#F2F3F7',
  surface: '#FFFFFF',
  surfaceAlt: '#E8EAF0',
  border: '#D9DCE3',
  text: '#111318',
  textMuted: '#5F6472',
  accent: '#3D4FC4',
  onAccent: '#FFFFFF',
  ripple: 'rgba(0,0,0,0.08)',
  pressed: '#E8EAF0',
  positive: '#1A7F4B',
  negative: '#C62D3E',
  warning: '#A85F00',
  category: {
    food: '#B86A00',
    transport: '#0A72B0',
    shopping: '#B8307E',
    bills: '#6A45C2',
    fun: '#1A7F4B',
    income: '#3D4FC4',
  },
};

export const palettes = { light, dark };

export const radius = { sm: 8, md: 16, lg: 24, pill: 999 };
// 4/8-point grid.
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
// Minimum touch target: 44 pt (iOS) / 48 dp (Android).
export const touch = { min: 44 };

// iOS text styles at the default size. Text scales with the user's setting.
const typeScale = {
  display: { fontSize: 48, fontWeight: '700' as const, letterSpacing: -1 },
  largeTitle: { fontSize: 34, fontWeight: '700' as const, letterSpacing: -0.6 },
  title: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.4 },
  headline: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 17, fontWeight: '400' as const },
  subhead: { fontSize: 15, fontWeight: '500' as const },
  footnote: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.3 },
};

function buildText(c: Colors) {
  return StyleSheet.create({
    display: { ...typeScale.display, color: c.text },
    largeTitle: { ...typeScale.largeTitle, color: c.text },
    title: { ...typeScale.title, color: c.text },
    headline: { ...typeScale.headline, color: c.text },
    body: { ...typeScale.body, color: c.text },
    subhead: { ...typeScale.subhead, color: c.text },
    footnote: { ...typeScale.footnote, color: c.textMuted },
    caption: { ...typeScale.caption, color: c.textMuted },
  });
}

export type Theme = { c: Colors; text: ReturnType<typeof buildText> };

const themes: Record<'light' | 'dark', Theme> = {
  light: { c: light, text: buildText(light) },
  dark: { c: dark, text: buildText(dark) },
};

export function useScheme(): 'light' | 'dark' {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}

/** Follows the system appearance. */
export function useTheme(): Theme {
  return themes[useScheme()];
}

/** Builds a StyleSheet once per scheme and returns a hook that picks the active one. */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(fn: (t: Theme) => T): () => T {
  const sheets = {
    light: StyleSheet.create(fn(themes.light)),
    dark: StyleSheet.create(fn(themes.dark)),
  };
  return () => sheets[useScheme()];
}
