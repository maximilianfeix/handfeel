import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

export function ProgressBar({ value, color }: { value: number; color: string }) {
  const pct = Math.min(1, Math.max(0, value));
  const barColor = value > 1 ? colors.negative : value > 0.85 ? colors.warning : color;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4 },
});
