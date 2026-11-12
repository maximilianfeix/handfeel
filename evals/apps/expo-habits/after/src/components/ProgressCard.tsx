import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radius, space, font, useTheme } from '../theme';

export function ProgressCard({ done, total }: { done: number; total: number }) {
  const t = useTheme();
  const pct = total === 0 ? 0 : done / total;
  const message =
    total === 0 ? 'Add your first habit to get started' : done === total ? 'All done for today.' : `${total - done} left to go`;
  return (
    <View
      style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Today, ${done} of ${total} completed. ${message}`}
    >
      <Text style={[styles.label, { color: t.textMuted }]}>Today</Text>
      <Text style={[styles.big, { color: t.text }]}>
        {done}/{total} <Text style={[styles.small, { color: t.textMuted }]}>completed</Text>
      </Text>
      <View style={[styles.track, { backgroundColor: t.cardAlt }]}>
        <View style={[styles.fill, { width: `${Math.round(pct * 100)}%`, backgroundColor: t.primary }]} />
      </View>
      <Text style={[styles.msg, { color: t.textMuted }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, padding: space.lg, marginBottom: space.lg, gap: space.xs },
  label: { ...font.footnote, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  big: { ...font.largeTitle },
  small: { ...font.subhead, fontWeight: '500' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  msg: { ...font.subhead },
});
