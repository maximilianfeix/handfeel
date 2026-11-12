import { useColorScheme } from 'react-native';
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
  isDark: boolean;
};

export const light: Palette = {
  bg: '#F5F4FB',
  card: '#FFFFFF',
  cardAlt: '#EEECF8',
  text: '#1A1830',
  textMuted: '#7B7994',
  border: '#E4E2F2',
  primary: '#6C5CE7',
  primaryText: '#FFFFFF',
  danger: '#E5484D',
  isDark: false,
};

export const dark: Palette = {
  bg: '#0E0D1A',
  card: '#1A1930',
  cardAlt: '#25233F',
  text: '#F3F2FF',
  textMuted: '#9A98B8',
  border: '#2C2A4A',
  primary: '#8B7DFF',
  primaryText: '#0E0D1A',
  danger: '#FF6369',
  isDark: true,
};

export const HABIT_COLORS = ['#6C5CE7', '#00B894', '#FF7675', '#FDCB6E', '#0984E3', '#E84393', '#FD9644'];
export const HABIT_EMOJIS = ['💧', '🏃', '📚', '🧘', '🥗', '😴', '✍️', '🎸', '🧹', '💊', '🚶', '🌱'];

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };

export function useTheme(): Palette {
  const system = useColorScheme();
  const mode = useStore().settings.themeMode;
  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark';
  return isDark ? dark : light;
}
