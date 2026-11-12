import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHaptics } from '../src/haptics';
import { useStore } from '../src/store';
import {
  HABIT_COLOR_NAMES,
  HABIT_COLORS,
  HABIT_EMOJIS,
  iosPressed,
  radius,
  readableOn,
  space,
  font,
  useTheme,
} from '../src/theme';

export default function AddHabit() {
  const t = useTheme();
  const router = useRouter();
  const haptics = useHaptics();
  const { addHabit } = useStore();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(HABIT_EMOJIS[0]);
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const valid = name.trim().length > 0;

  const pickEmoji = (e: string) => {
    if (e !== emoji) haptics.selection();
    setEmoji(e);
  };

  const pickColor = (c: string) => {
    if (c !== color) haptics.selection();
    setColor(c);
  };

  const save = () => {
    if (!valid) return;
    addHabit({ name, emoji, color });
    haptics.success();
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: t.text }]} accessibilityRole="header">
            New habit
          </Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close"
            android_ripple={{ color: t.ripple, borderless: true, radius: 24 }}
            style={({ pressed }) => [styles.iconBtn, iosPressed(pressed)]}
          >
            <Ionicons name="close-circle" size={30} color={t.textMuted} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.preview, { backgroundColor: color + '26' }]}>
            <Text style={styles.previewEmoji}>{emoji}</Text>
          </View>

          <Text style={[styles.label, { color: t.textMuted }]}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Drink water"
            placeholderTextColor={t.textMuted}
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={save}
            accessibilityLabel="Habit name"
            style={[styles.input, { backgroundColor: t.card, borderColor: t.border, color: t.text }]}
          />

          <Text style={[styles.label, { color: t.textMuted }]}>Icon</Text>
          <View style={styles.grid} accessibilityRole="radiogroup">
            {HABIT_EMOJIS.map((e) => (
              <Pressable
                key={e}
                onPress={() => pickEmoji(e)}
                accessibilityRole="radio"
                accessibilityState={{ selected: e === emoji }}
                android_ripple={{ color: t.ripple }}
                style={({ pressed }) => [
                  styles.emojiCell,
                  { backgroundColor: t.card, borderColor: e === emoji ? color : t.border },
                  iosPressed(pressed),
                ]}
              >
                <Text style={styles.emojiText}>{e}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: t.textMuted }]}>Color</Text>
          <View style={styles.grid} accessibilityRole="radiogroup">
            {HABIT_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => pickColor(c)}
                accessibilityRole="radio"
                accessibilityState={{ selected: c === color }}
                accessibilityLabel={HABIT_COLOR_NAMES[c] ?? 'Color'}
                android_ripple={{ color: t.ripple, borderless: true, radius: 24 }}
                style={({ pressed }) => [
                  styles.swatch,
                  { backgroundColor: c, borderColor: c === color ? t.text : 'transparent' },
                  iosPressed(pressed),
                ]}
              >
                {c === color && <Ionicons name="checkmark" size={20} color={readableOn(c)} />}
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={save}
            disabled={!valid}
            accessibilityRole="button"
            accessibilityState={{ disabled: !valid }}
            android_ripple={{ color: t.ripple }}
            style={({ pressed }) => [styles.save, { backgroundColor: valid ? color : t.cardAlt }, iosPressed(pressed)]}
          >
            <Text style={[styles.saveText, { color: valid ? readableOn(color) : t.textMuted }]}>Create habit</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.xxs,
  },
  title: { ...font.title1, flex: 1 },
  iconBtn: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: space.lg, gap: space.xs },
  preview: {
    alignSelf: 'center',
    minWidth: 88,
    minHeight: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  previewEmoji: { ...font.largeTitle },
  label: { ...font.footnote, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: space.sm },
  input: { borderWidth: 1.5, borderRadius: radius.md, padding: space.md, ...font.body },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  emojiCell: {
    minWidth: 52,
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emojiText: { ...font.title2 },
  swatch: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  footer: { padding: space.lg },
  save: { minHeight: 52, justifyContent: 'center', paddingVertical: space.md, borderRadius: radius.pill, alignItems: 'center', overflow: 'hidden' },
  saveText: { ...font.headline },
});
