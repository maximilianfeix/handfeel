import { Platform, useColorScheme } from 'react-native';
import { useStore } from './store';

export type Palette = {
  bg: string;
  card: string;
  cardAlt: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryText: string;
  danger: string;
  success: string;
  streak: string;
  trophy: string;
  ripple: string;
  isDark: boolean;
};

// Neutrals follow the iOS system grays. The accent is a proposal (teal-green for
// "done"), replacing the stock #6C5CE7 violet; swap it for the brand color if one exists.
// textMuted is checked at 4.5:1 or more against bg and card in both modes.
export const light: Palette = {
  bg: '#F2F2F7',
  card: '#FFFFFF',
  cardAlt: '#E5E5EA',
  text: '#111114',
  textMuted: '#5C5C66',
  border: '#DCDCE2',
  primary: '#0A7C66',
  primaryText: '#FFFFFF',
  danger: '#D93036',
  success: '#1F8A4C',
  streak: '#C2570C',
  trophy: '#A77B00',
  ripple: 'rgba(0,0,0,0.12)',
  isDark: false,
};

export const dark: Palette = {
  bg: '#000000',
  card: '#1C1C1E',
  cardAlt: '#2C2C2E',
  text: '#F2F2F7',
  textMuted: '#A1A1AA',
  border: '#38383A',
  primary: '#3DD6B0',
  primaryText: '#00140F',
  danger: '#FF6369',
  success: '#4CD08A',
  streak: '#FF9F43',
  trophy: '#FDCB6E',
  ripple: 'rgba(255,255,255,0.16)',
  isDark: true,
};

// Colors a user can pick for a habit. Stored as hex on the habit, so they stay
// the same in light and dark mode; text on them goes through readableOn().
export const HABIT_COLORS = ['#0A7C66', '#00B894', '#FF7675', '#FDCB6E', '#0984E3', '#E84393', '#FD9644'];
export const HABIT_COLOR_NAMES: Record<string, string> = {
  '#0A7C66': 'Teal',
  '#00B894': 'Green',
  '#FF7675': 'Coral',
  '#FDCB6E': 'Yellow',
  '#0984E3': 'Blue',
  '#E84393': 'Pink',
  '#FD9644': 'Orange',
};
export const HABIT_EMOJIS = ['💧', '🏃', '📚', '🧘', '🥗', '😴', '✍️', '🎸', '🧹', '💊', '🚶', '🌱'];

/** Dark or white foreground for text and icons drawn on a habit color. */
export function readableOn(hex: string): string {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const lum = 0.2126 * ch((n >> 16) & 255) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255);
  return lum > 0.19 ? '#111114' : '#FFFFFF';
}

export const radius = { sm: 8, md: 16, lg: 24, pill: 999 };

// 4/8-point spacing scale.
export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 40 } as const;

// iOS text styles at the default size; Android uses the same steps (Material scale is close).
export const font = {
  largeTitle: { fontSize: 34, fontWeight: '700' },
  title1: { fontSize: 28, fontWeight: '700' },
  title2: { fontSize: 22, fontWeight: '700' },
  title3: { fontSize: 20, fontWeight: '600' },
  headline: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 17, fontWeight: '400' },
  subhead: { fontSize: 15, fontWeight: '400' },
  footnote: { fontSize: 13, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' },
} as const;

/** Pressed state on iOS; Android gets android_ripple instead. */
export const iosPressed = (pressed: boolean) => (pressed && Platform.OS === 'ios' ? { opacity: 0.6 } : null);

export function useTheme(): Palette {
  const system = useColorScheme();
  const mode = useStore().settings.themeMode;
  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark';
  return isDark ? dark : light;
}
