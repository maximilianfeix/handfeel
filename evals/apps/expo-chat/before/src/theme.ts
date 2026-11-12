import { Platform } from 'react-native';

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
  online: '#488A5E',
  incoming: '#FFFFFF',
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
  online: '#8EC993',
  incoming: '#253229',
};

export type Colors = typeof lightColors;
export const font = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });
