import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { lastDays, WEEKDAYS } from '../../src/dates';
import { useStore } from '../../src/store';
import { bestStreak, currentStreak } from '../../src/streaks';
import { radius, space, font, useTheme } from '../../src/theme';

function Tile({ icon, color, value, label }: { icon: keyof typeof Ionicons.glyphMap; color: string; value: string; label: string }) {
  const t = useTheme();
  return (
    <View
      style={[styles.tile, { backgroundColor: t.card, borderColor: t.border }]}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.tileValue, { color: t.text }]}>{value}</Text>
      <Text style={[styles.tileLabel, { color: t.textMuted }]}>{label}</Text>
    </View>
  );
}

export default function Stats() {
  const t = useTheme();
  const { habits } = useStore();
  const week = lastDays(7);

  const perDay = week.map(({ key, date }) => {
    const done = habits.filter((h) => h.completions.includes(key)).length;
    return { key, label: WEEKDAYS[date.getDay()], done, pct: habits.length ? done / habits.length : 0 };
  });

  const totalChecks = habits.reduce((n, h) => n + h.completions.length, 0);
  const weekChecks = perDay.reduce((n, d) => n + d.done, 0);
  const weekRate = habits.length ? Math.round((weekChecks / (habits.length * 7)) * 100) : 0;
  const best = habits.reduce((m, h) => Math.max(m, bestStreak(h)), 0);
  const active = habits.reduce((m, h) => Math.max(m, currentStreak(h)), 0);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: t.text }]} accessibilityRole="header">
          Stats
        </Text>

        <View style={styles.tiles}>
          <Tile icon="checkmark-done" color={t.success} value={`${weekRate}%`} label="This week" />
          <Tile icon="flame" color={t.streak} value={`${active}`} label="Current streak" />
          <Tile icon="trophy" color={t.trophy} value={`${best}`} label="Best streak" />
          <Tile icon="albums" color={t.primary} value={`${totalChecks}`} label="Total check-ins" />
        </View>

        <View style={[styles.panel, { backgroundColor: t.card, borderColor: t.border }]}>
          <Text style={[styles.panelTitle, { color: t.text }]} accessibilityRole="header">
            Last 7 days
          </Text>
          <View style={styles.chart}>
            {perDay.map((d, i) => (
              <View
                key={d.key}
                style={styles.barCol}
                accessible
                accessibilityLabel={`${d.label}: ${d.done} of ${habits.length} done`}
              >
                <View style={[styles.barTrack, { backgroundColor: t.cardAlt }]}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${Math.max(d.pct * 100, d.done ? 8 : 0)}%`, backgroundColor: t.primary },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: i === 6 ? t.text : t.textMuted }]}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: t.card, borderColor: t.border }]}>
          <Text style={[styles.panelTitle, { color: t.text }]} accessibilityRole="header">
            Habits
          </Text>
          {habits.length === 0 && (
            <Text style={[styles.emptyText, { color: t.textMuted }]}>
              Each habit's week appears here once you add one on Today.
            </Text>
          )}
          {habits.map((h) => {
            const count = week.filter(({ key }) => h.completions.includes(key)).length;
            return (
              <View key={h.id} style={styles.row} accessible accessibilityLabel={`${h.name}: ${count} of 7 days`}>
                <Text style={styles.rowEmoji}>{h.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowName, { color: t.text }]} numberOfLines={1}>
                    {h.name}
                  </Text>
                  <View style={[styles.rowTrack, { backgroundColor: t.cardAlt }]}>
                    <View style={[styles.rowFill, { width: `${(count / 7) * 100}%`, backgroundColor: h.color }]} />
                  </View>
                </View>
                <Text style={[styles.rowCount, { color: t.textMuted }]}>{count}/7</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: space.lg, paddingBottom: space.xxxl, gap: space.md },
  title: { ...font.largeTitle },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: { width: '48%', flexGrow: 1, padding: space.md, borderRadius: radius.lg, borderWidth: 1, gap: space.xxs },
  tileValue: { ...font.title1 },
  tileLabel: { ...font.footnote, fontWeight: '500' },
  panel: { padding: space.md, borderRadius: radius.lg, borderWidth: 1, gap: space.sm },
  panelTitle: { ...font.headline },
  emptyText: { ...font.subhead },
  chart: { flexDirection: 'row', justifyContent: 'space-between', minHeight: 140 },
  barCol: { alignItems: 'center', flex: 1, gap: space.xs },
  barTrack: { flex: 1, minHeight: 100, width: 22, borderRadius: 11, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 11 },
  barLabel: { ...font.caption, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  rowEmoji: { ...font.title2 },
  rowName: { ...font.subhead, fontWeight: '600', marginBottom: space.xs },
  rowTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  rowFill: { height: 6, borderRadius: 3 },
  rowCount: { ...font.footnote, fontWeight: '600', minWidth: 32, textAlign: 'right' },
});
