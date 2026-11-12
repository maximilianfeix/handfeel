import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHaptics } from '../../src/haptics';
import { useStore } from '../../src/store';
import { iosPressed, radius, space, font, useTheme } from '../../src/theme';
import type { ThemeMode } from '../../src/types';

const MODES: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function Settings() {
  const t = useTheme();
  const haptics = useHaptics();
  const { settings, updateSettings, habits, deleteHabit, resetAll } = useStore();

  const confirmReset = () =>
    Alert.alert('Delete all habits?', 'This removes every habit and its history. It cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          haptics.warning();
          resetAll();
        },
      },
    ]);

  const confirmDelete = (id: string, name: string) =>
    Alert.alert(`Delete "${name}"?`, 'Its history will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          haptics.warning();
          deleteHabit(id);
        },
      },
    ]);

  const pickMode = (mode: ThemeMode) => {
    if (mode === settings.themeMode) return;
    haptics.selection();
    updateSettings({ themeMode: mode });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: t.text }]} accessibilityRole="header">
          Settings
        </Text>

        <Text style={[styles.section, { color: t.textMuted }]} accessibilityRole="header">
          Appearance
        </Text>
        <View style={[styles.segment, { backgroundColor: t.cardAlt }]} accessibilityRole="radiogroup">
          {MODES.map((m) => {
            const active = settings.themeMode === m.value;
            return (
              <Pressable
                key={m.value}
                onPress={() => pickMode(m.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                android_ripple={{ color: t.ripple }}
                style={({ pressed }) => [styles.segBtn, active && { backgroundColor: t.card }, iosPressed(pressed)]}
              >
                <Text style={[styles.segText, { color: active ? t.text : t.textMuted }]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.section, { color: t.textMuted }]} accessibilityRole="header">
          Feedback
        </Text>
        <View style={[styles.panel, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={styles.row}>
            <Ionicons name="phone-portrait-outline" size={20} color={t.text} />
            <Text style={[styles.rowText, { color: t.text }]}>Haptics</Text>
            <Switch
              value={settings.haptics}
              onValueChange={(v) => updateSettings({ haptics: v })}
              trackColor={Platform.OS === 'ios' ? { true: t.primary } : undefined}
              accessibilityLabel="Haptics"
            />
          </View>
        </View>

        <Text style={[styles.section, { color: t.textMuted }]} accessibilityRole="header">
          Manage habits
        </Text>
        <View style={[styles.panel, { backgroundColor: t.card, borderColor: t.border }]}>
          {habits.length === 0 && (
            <Text style={[styles.emptyText, { color: t.textMuted }]}>Habits you add on Today can be deleted here.</Text>
          )}
          {habits.map((h) => (
            <View key={h.id} style={styles.row}>
              <Text style={styles.rowEmoji}>{h.emoji}</Text>
              <Text style={[styles.rowText, { color: t.text }]} numberOfLines={1}>
                {h.name}
              </Text>
              <Pressable
                onPress={() => confirmDelete(h.id, h.name)}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${h.name}`}
                android_ripple={{ color: t.ripple, borderless: true, radius: 24 }}
                style={({ pressed }) => [styles.iconBtn, iosPressed(pressed)]}
              >
                <Ionicons name="trash-outline" size={20} color={t.danger} />
              </Pressable>
            </View>
          ))}
        </View>

        <Pressable
          onPress={confirmReset}
          disabled={habits.length === 0}
          accessibilityRole="button"
          accessibilityState={{ disabled: habits.length === 0 }}
          android_ripple={{ color: t.ripple }}
          style={({ pressed }) => [
            styles.danger,
            { borderColor: t.danger, opacity: habits.length ? 1 : 0.4 },
            iosPressed(pressed),
          ]}
        >
          <Text style={[styles.dangerText, { color: t.danger }]}>Delete all data</Text>
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
  scroll: { padding: space.lg, paddingBottom: space.xxxl, gap: space.xs },
  title: { ...font.largeTitle, marginBottom: space.xs },
  section: { ...font.footnote, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: space.sm },
  segment: { flexDirection: 'row', padding: space.xxs, borderRadius: radius.md },
  segBtn: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.xs,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  segText: { ...font.subhead, fontWeight: '600' },
  panel: { padding: space.md, borderRadius: radius.lg, borderWidth: 1, gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  rowEmoji: { ...font.title3 },
  rowText: { flex: 1, ...font.body },
  emptyText: { ...font.subhead },
  iconBtn: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginVertical: -space.xs },
  danger: {
    marginTop: space.md,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: space.sm,
    alignItems: 'center',
    overflow: 'hidden',
  },
  dangerText: { ...font.headline },
  version: { ...font.caption, textAlign: 'center', marginTop: space.lg },
});
