import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../src/store';
import { HABIT_COLORS, HABIT_EMOJIS, radius, useTheme } from '../src/theme';

export default function AddHabit() {
  const t = useTheme();
  const router = useRouter();
  const { addHabit } = useStore();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(HABIT_EMOJIS[0]);
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const valid = name.trim().length > 0;

  const save = () => {
    if (!valid) return;
    addHabit({ name, emoji, color });
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: t.text }]}>New habit</Text>
          <Pressable onPress={() => router.back()} accessibilityLabel="Close" hitSlop={10}>
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
            style={[styles.input, { backgroundColor: t.card, borderColor: t.border, color: t.text }]}
          />

          <Text style={[styles.label, { color: t.textMuted }]}>Icon</Text>
          <View style={styles.grid}>
            {HABIT_EMOJIS.map((e) => (
              <Pressable
                key={e}
                onPress={() => setEmoji(e)}
                style={[
                  styles.emojiCell,
                  { backgroundColor: t.card, borderColor: e === emoji ? color : t.border },
                ]}
              >
                <Text style={styles.emojiText}>{e}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: t.textMuted }]}>Color</Text>
          <View style={styles.grid}>
            {HABIT_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                accessibilityLabel={`Color ${c}`}
                style={[styles.swatch, { backgroundColor: c, borderColor: c === color ? t.text : 'transparent' }]}
              />
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={save}
            disabled={!valid}
            style={[styles.save, { backgroundColor: valid ? color : t.cardAlt }]}
          >
            <Text style={[styles.saveText, { color: valid ? '#fff' : t.textMuted }]}>Create habit</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 4 },
  title: { fontSize: 26, fontWeight: '800' },
  scroll: { padding: 20, gap: 10 },
  preview: { alignSelf: 'center', width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  previewEmoji: { fontSize: 44 },
  label: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 10 },
  input: { borderWidth: 1.5, borderRadius: radius.md, padding: 16, fontSize: 17 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emojiCell: { width: 52, height: 52, borderRadius: radius.md, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  emojiText: { fontSize: 24 },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 3 },
  footer: { padding: 20 },
  save: { paddingVertical: 16, borderRadius: radius.pill, alignItems: 'center' },
  saveText: { fontSize: 17, fontWeight: '700' },
});
