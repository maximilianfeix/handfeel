export const colors = {
  bg: '#0B0D12',
  surface: '#14171F',
  surfaceAlt: '#1B1F29',
  border: 'rgba(255,255,255,0.07)',
  text: '#F4F5F7',
  textMuted: '#8B91A1',
  accent: '#7C8CFF',
  accentAlt: '#B58CFF',
  positive: '#4ADE9A',
  negative: '#FF6B7A',
  warning: '#FFB454',
};

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const font = {
  title: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.6, color: colors.text },
  h2: { fontSize: 18, fontWeight: '600' as const, letterSpacing: -0.2, color: colors.text },
  body: { fontSize: 15, fontWeight: '500' as const, color: colors.text },
  caption: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.3, color: colors.textMuted },
};
