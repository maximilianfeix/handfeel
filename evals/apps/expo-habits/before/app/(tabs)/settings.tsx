import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../src/store';
import { radius, useTheme } from '../../src/theme';
import type { ThemeMode } from '../../src/types';

const MODES: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function Settings() {
  const t = useTheme();
  const { settings, updateSettings, habits, deleteHabit, resetAll } = useStore();

  const confirmReset = () =>
    Alert.alert('Delete all habits?', 'This removes every habit and its history. It cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: resetAll },
    ]);

  const confirmDelete = (id: string, name: string) =>
    Alert.alert(`Delete "${name}"?`, 'Its history will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteHabit(id) },
    ]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: t.text }]}>Settings</Text>

        <Text style={[styles.section, { color: t.textMuted }]}>Appearance</Text>
        <View style={[styles.segment, { backgroundColor: t.cardAlt }]}>
          {MODES.map((m) => {
            const active = settings.themeMode === m.value;
            return (
              <Pressable
                key={m.value}
                onPress={() => updateSettings({ themeMode: m.value })}
                style={[styles.segBtn, active && { backgroundColor: t.card }]}
              >
                <Text style={{ color: active ? t.text : t.textMuted, fontWeight: '700' }}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.section, { color: t.textMuted }]}>Feedback</Text>
        <View style={[styles.panel, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={styles.row}>
            <Ionicons name="phone-portrait-outline" size={20} color={t.text} />
            <Text style={[styles.rowText, { color: t.text }]}>Haptics</Text>
            <Switch
              value={settings.haptics}
              onValueChange={(v) => updateSettings({ haptics: v })}
              trackColor={{ true: t.primary }}
            />
          </View>
        </View>

        <Text style={[styles.section, { color: t.textMuted }]}>Manage habits</Text>
        <View style={[styles.panel, { backgroundColor: t.card, borderColor: t.border }]}>
          {habits.length === 0 && <Text style={{ color: t.textMuted }}>No habits.</Text>}
          {habits.map((h) => (
            <View key={h.id} style={styles.row}>
              <Text style={{ fontSize: 20 }}>{h.emoji}</Text>
              <Text style={[styles.rowText, { color: t.text }]} numberOfLines={1}>
                {h.name}
              </Text>
              <Pressable onPress={() => confirmDelete(h.id, h.name)} accessibilityLabel={`Delete ${h.name}`} hitSlop={8}>
                <Ionicons name="trash-outline" size={20} color={t.danger} />
              </Pressable>
            </View>
          ))}
        </View>

        <Pressable onPress={confirmReset} disabled={habits.length === 0} style={[styles.danger, { borderColor: t.danger, opacity: habits.length ? 1 : 0.4 }]}>
          <Text style={{ color: t.danger, fontWeight: '700' }}>Delete all data</Text>
        </Pressable>

        <Text style={[styles.version, { color: t.textMuted }]}>
          Habitly v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40, gap: 10 },
  title: { fontSize: 30, fontWeight: '800', marginBottom: 6 },
  section: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 12 },
  segment: { flexDirection: 'row', padding: 4, borderRadius: radius.md },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.sm },
  panel: { padding: 16, borderRadius: radius.lg, borderWidth: 1, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1, fontSize: 16, fontWeight: '600' },
  danger: { marginTop: 16, borderWidth: 1.5, borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center' },
  version: { textAlign: 'center', marginTop: 20, fontSize: 12 },
});
