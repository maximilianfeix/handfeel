import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radius, useTheme } from '../theme';

export function ProgressCard({ done, total }: { done: number; total: number }) {
  const t = useTheme();
  const pct = total === 0 ? 0 : done / total;
  const message =
    total === 0 ? 'Add your first habit to get started' : done === total ? 'All done. Great work today!' : `${total - done} left to go`;
  return (
    <View style={[styles.card, { backgroundColor: t.primary }]}>
      <Text style={[styles.label, { color: t.primaryText }]}>Today</Text>
      <Text style={[styles.big, { color: t.primaryText }]}>
        {done}/{total} <Text style={styles.small}>completed</Text>
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(pct * 100)}%` }]} />
      </View>
      <Text style={[styles.msg, { color: t.primaryText }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: 20, marginBottom: 20, gap: 8 },
  label: { fontSize: 13, fontWeight: '600', opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 },
  big: { fontSize: 34, fontWeight: '800' },
  small: { fontSize: 16, fontWeight: '500', opacity: 0.8 },
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: '#fff' },
  msg: { fontSize: 14, opacity: 0.9 },
});
