import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { todayKey } from '../dates';
import { useHaptics } from '../haptics';
import { currentStreak } from '../streaks';
import { radius, readableOn, space, font, useTheme } from '../theme';
import { useStore } from '../store';
import type { Habit } from '../types';

export function HabitCard({ habit }: { habit: Habit }) {
  const t = useTheme();
  const haptics = useHaptics();
  const { toggleToday } = useStore();
  const done = habit.completions.includes(todayKey());
  const streak = currentStreak(habit);

  const onPress = () => {
    // Completing is an outcome (success); unchecking is just a value change (selection).
    if (done) haptics.selection();
    else haptics.success();
    toggleToday(habit.id);
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={`${habit.name}, streak ${streak} days`}
      android_ripple={{ color: t.ripple }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed && Platform.OS === 'ios' ? t.cardAlt : t.card,
          borderColor: done ? habit.color : t.border,
        },
      ]}
    >
      <View style={[styles.emojiWrap, { backgroundColor: habit.color + '26' }]}>
        <Text style={styles.emoji}>{habit.emoji}</Text>
      </View>
      <View style={styles.body}>
        <Text style={[styles.name, { color: t.text }, done && styles.strike]} numberOfLines={2}>
          {habit.name}
        </Text>
        <View style={styles.streakRow}>
          <Ionicons name="flame" size={14} color={streak > 0 ? t.streak : t.textMuted} />
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
        {done && <Ionicons name="checkmark" size={20} color={readableOn(habit.color)} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    gap: space.sm,
    marginBottom: space.sm,
    overflow: 'hidden',
  },
  emojiWrap: { minWidth: 52, minHeight: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  emoji: { ...font.title1 },
  body: { flex: 1, gap: space.xxs },
  name: { ...font.headline },
  strike: { opacity: 0.6, textDecorationLine: 'line-through' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: space.xxs },
  streak: { ...font.footnote, fontWeight: '500' },
  check: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
