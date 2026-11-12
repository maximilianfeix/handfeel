import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { todayKey } from '../../src/dates';
import { HabitCard } from '../../src/components/HabitCard';
import { ProgressCard } from '../../src/components/ProgressCard';
import { useStore } from '../../src/store';
import { useTheme } from '../../src/theme';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function Home() {
  const t = useTheme();
  const router = useRouter();
  const { habits } = useStore();
  const key = todayKey();
  const done = habits.filter((h) => h.completions.includes(key)).length;
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.date, { color: t.textMuted }]}>{dateLabel}</Text>
            <Text style={[styles.title, { color: t.text }]}>{greeting()}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/add')}
            accessibilityLabel="Add habit"
            style={[styles.addBtn, { backgroundColor: t.primary }]}
          >
            <Ionicons name="add" size={26} color={t.primaryText} />
          </Pressable>
        </View>

        <ProgressCard done={done} total={habits.length} />

        {habits.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: t.card, borderColor: t.border }]}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={[styles.emptyTitle, { color: t.text }]}>No habits yet</Text>
            <Text style={[styles.emptyText, { color: t.textMuted }]}>
              Small daily actions build big change. Start with one.
            </Text>
            <Pressable onPress={() => router.push('/add')} style={[styles.cta, { backgroundColor: t.primary }]}>
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
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  date: { fontSize: 14, fontWeight: '500' },
  title: { fontSize: 30, fontWeight: '800', marginTop: 2 },
  addBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', padding: 28, borderRadius: 24, borderWidth: 1, gap: 8 },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center' },
  cta: { marginTop: 10, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 999 },
  ctaText: { fontWeight: '700', fontSize: 15 },
});
