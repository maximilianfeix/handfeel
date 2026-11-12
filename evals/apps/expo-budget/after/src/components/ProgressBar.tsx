import React from 'react';
import { View } from 'react-native';
import { makeStyles, useTheme } from '../theme';

export function ProgressBar({ value, color }: { value: number; color: string }) {
  const { c } = useTheme();
  const styles = useStyles();
  const pct = Math.min(1, Math.max(0, value));
  const barColor = value > 1 ? c.negative : value > 0.85 ? c.warning : color;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
    </View>
  );
}

const useStyles = makeStyles(({ c }) => ({
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: c.surfaceAlt,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4 },
}));
