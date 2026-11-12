import { Platform, TextStyle } from 'react-native';

export const lightColors = {
  background: '#F8F9F6',
  surface: '#FFFFFF',
  soft: '#F0F2ED',
  selected: '#EAF1E9',
  text: '#202C27',
  secondary: '#707A73',
  muted: '#8B938C',
  line: '#E9ECE6',
  green: '#245C49',
  greenText: '#245C49',
  onGreen: '#FFFFFF',
  lime: '#D9EABD',
  onLime: '#245C49',
  online: '#488A5E',
  incoming: '#FFFFFF',
  danger: '#B34B40',
  dangerFill: '#B34B40',
  onDanger: '#FFFFFF',
  scrim: 'rgba(10, 24, 16, 0.48)',
  ripple: 'rgba(32, 44, 39, 0.12)',
  pressed: '#E6E9E3',
  onAvatar: '#344A3D',
  avatar: {
    sand: '#E7D5C9',
    sky: '#D7DFEC',
    moss: '#E4E8CE',
    rose: '#EBD6D4',
    sage: '#D2DED9',
    lilac: '#DED6EA',
    wheat: '#E9DFCC',
    mist: '#D6E1E5',
    peach: '#EDD6C8',
  },
};

export const darkColors: typeof lightColors = {
  background: '#151D19',
  surface: '#1D2821',
  soft: '#263229',
  selected: '#2D4032',
  text: '#F1F4EC',
  secondary: '#ADB8AC',
  muted: '#96A392',
  line: '#334036',
  green: '#356F55',
  greenText: '#BADBA8',
  onGreen: '#FFFFFF',
  lime: '#D9EABD',
  onLime: '#245C49',
  online: '#8EC993',
  incoming: '#253229',
  danger: '#F2A196',
  dangerFill: '#B34B40',
  onDanger: '#FFFFFF',
  scrim: 'rgba(0, 0, 0, 0.56)',
  ripple: 'rgba(241, 244, 236, 0.16)',
  pressed: '#2B382F',
  onAvatar: '#E8EEE4',
  avatar: {
    sand: '#5A4A40',
    sky: '#424C5E',
    moss: '#4C5238',
    rose: '#5C4442',
    sage: '#3D4F48',
    lilac: '#4C4459',
    wheat: '#594E3A',
    mist: '#3E4F55',
    peach: '#5E4638',
  },
};

export type Colors = typeof lightColors;
export type AvatarTint = keyof Colors['avatar'];
export const font = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

// Type roles, sized after the iOS text styles at the default text size.
// Text keeps allowFontScaling on, so these grow with the user's setting.
export const type = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700' },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '600' },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 22 },
  subhead: { fontSize: 15, lineHeight: 20 },
  footnote: { fontSize: 13, lineHeight: 18 },
  caption1: { fontSize: 12, lineHeight: 16 },
  caption2: { fontSize: 11, lineHeight: 13 },
} satisfies Record<string, TextStyle>;

// Spacing scale on the 4/8-point grid.
export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 40 } as const;
