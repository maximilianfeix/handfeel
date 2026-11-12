import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { todayKey } from '../../src/dates';
import { HabitCard } from '../../src/components/HabitCard';
import { ProgressCard } from '../../src/components/ProgressCard';
import { useStore } from '../../src/store';
import { iosPressed, radius, space, type, useTheme } from '../../src/theme';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function Home() {
  const t = useTheme();
  const router = useRouter();
  const { habits, ready } = useStore();
  const key = todayKey();
  const done = habits.filter((h) => h.completions.includes(key)).length;
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.date, { color: t.textMuted }]}>{dateLabel}</Text>
            <Text style={[styles.title, { color: t.text }]}>{greeting()}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/add')}
            accessibilityRole="button"
            accessibilityLabel="Add habit"
            android_ripple={{ color: t.ripple }}
            style={({ pressed }) => [styles.addBtn, { backgroundColor: t.primary }, iosPressed(pressed)]}
          >
            <Ionicons name="add" size={26} color={t.primaryText} />
          </Pressable>
        </View>

        <ProgressCard done={done} total={habits.length} />

        {!ready ? null : habits.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: t.card, borderColor: t.border }]}>
            <Ionicons name="leaf-outline" size={40} color={t.primary} />
            <Text style={[styles.emptyTitle, { color: t.text }]}>No habits yet</Text>
            <Text style={[styles.emptyText, { color: t.textMuted }]}>
              Your habits will show up here, ready to check off each day.
            </Text>
            <Pressable
              onPress={() => router.push('/add')}
              accessibilityRole="button"
              android_ripple={{ color: t.ripple }}
              style={({ pressed }) => [styles.cta, { backgroundColor: t.primary }, iosPressed(pressed)]}
            >
              <Text style={[styles.ctaText, { color: t.primaryText }]}>Create a habit</Text>
            </Pressable>
          </View>
        ) : (
          habits.map((h) => <HabitCard key={h.id} habit={h} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: space.lg, paddingBottom: space.xxxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm, marginBottom: space.lg },
  headerText: { flex: 1 },
  date: { ...type.subhead, fontWeight: '500' },
  title: { ...type.largeTitle, marginTop: space.xxs },
  addBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  empty: { alignItems: 'center', padding: space.xl, borderRadius: radius.lg, borderWidth: 1, gap: space.xs },
  emptyTitle: { ...type.title3 },
  emptyText: { ...type.subhead, textAlign: 'center' },
  cta: {
    marginTop: space.xs,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  ctaText: { ...type.headline },
});
