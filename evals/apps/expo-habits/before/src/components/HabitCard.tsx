import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { todayKey } from '../dates';
import { currentStreak } from '../streaks';
import { radius, useTheme } from '../theme';
import { useStore } from '../store';
import type { Habit } from '../types';

export function HabitCard({ habit }: { habit: Habit }) {
  const t = useTheme();
  const { toggleToday, settings } = useStore();
  const done = habit.completions.includes(todayKey());
  const streak = currentStreak(habit);

  const onPress = () => {
    if (settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    toggleToday(habit.id);
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={`${habit.name}, streak ${streak} days`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: t.card, borderColor: done ? habit.color : t.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.emojiWrap, { backgroundColor: habit.color + '26' }]}>
        <Text style={styles.emoji}>{habit.emoji}</Text>
      </View>
      <View style={styles.body}>
        <Text style={[styles.name, { color: t.text }, done && styles.strike]} numberOfLines={1}>
          {habit.name}
        </Text>
        <View style={styles.streakRow}>
          <Ionicons name="flame" size={14} color={streak > 0 ? '#FF9F43' : t.textMuted} />
          <Text style={[styles.streak, { color: t.textMuted }]}>
            {streak} day{streak === 1 ? '' : 's'} streak
          </Text>
        </View>
      </View>
      <View
        style={[
          styles.check,
          done ? { backgroundColor: habit.color, borderColor: habit.color } : { borderColor: t.border },
        ]}
      >
        {done && <Ionicons name="checkmark" size={20} color="#fff" />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    gap: 14,
    marginBottom: 12,
  },
  emojiWrap: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 26 },
  body: { flex: 1, gap: 4 },
  name: { fontSize: 17, fontWeight: '700' },
  strike: { opacity: 0.6, textDecorationLine: 'line-through' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streak: { fontSize: 13, fontWeight: '500' },
  check: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
