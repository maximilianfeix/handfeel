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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { categories, expenseCategories } from '../../src/data';
import { useStore } from '../../src/store';
import { colors, font, radius, space } from '../../src/theme';
import type { CategoryId } from '../../src/types';

export default function AddTransaction() {
  const { addTransaction } = useStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isIncome, setIsIncome] = useState(false);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryId>('food');

  const value = parseFloat(amount.replace(',', '.'));
  const valid = Number.isFinite(value) && value > 0 && title.trim().length > 0;

  const save = () => {
    if (!valid) return;
    addTransaction({
      title: title.trim(),
      amount: isIncome ? value : -value,
      category: isIncome ? 'income' : category,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAmount('');
    setTitle('');
    router.navigate('/');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + space.md,
          paddingHorizontal: space.md,
          paddingBottom: 120,
          gap: space.lg,
        }}
      >
        <Text style={font.title}>New transaction</Text>

        <View style={styles.segment}>
          {(['Expense', 'Income'] as const).map((label) => {
            const active = (label === 'Income') === isIncome;
            return (
              <Pressable
                key={label}
                onPress={() => setIsIncome(label === 'Income')}
                style={[styles.segItem, active && styles.segActive]}
              >
                <Text style={[font.body, { color: active ? colors.text : colors.textMuted }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.amountWrap}>
          <Text style={styles.currency}>$</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            style={styles.amount}
          />
        </View>

        <Card>
          <Text style={font.caption}>DESCRIPTION</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="What was it for?"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </Card>

        {!isIncome && (
          <View style={{ gap: space.sm }}>
            <Text style={font.h2}>Category</Text>
            <View style={styles.chips}>
              {expenseCategories.map((c) => {
                const active = c.id === category;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCategory(c.id);
                    }}
                    style={[
                      styles.chip,
                      active && { backgroundColor: c.color + '26', borderColor: c.color },
                    ]}
                  >
                    <Ionicons name={categories[c.id].icon} size={16} color={c.color} />
                    <Text style={[font.body, { fontSize: 14 }]}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <Pressable
          onPress={save}
          disabled={!valid}
          style={({ pressed }) => [
            styles.save,
            { opacity: !valid ? 0.4 : pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.saveText}>Save transaction</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.pill, padding: 4 },
  segItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.pill },
  segActive: { backgroundColor: colors.surfaceAlt },
  amountWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: space.md },
  currency: { color: colors.textMuted, fontSize: 36, fontWeight: '600' },
  amount: { color: colors.text, fontSize: 56, fontWeight: '700', letterSpacing: -1.5, minWidth: 120 },
  input: { color: colors.text, fontSize: 17, fontWeight: '500', paddingTop: space.sm, paddingBottom: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  save: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center' },
  saveText: { color: '#0B0D12', fontSize: 16, fontWeight: '700' },
});
