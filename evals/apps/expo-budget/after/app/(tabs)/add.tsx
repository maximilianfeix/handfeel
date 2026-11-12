import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { categories, expenseCategories } from '../../src/data';
import { useStore } from '../../src/store';
import { makeStyles, radius, space, touch, useTheme } from '../../src/theme';
import type { CategoryId } from '../../src/types';

export default function AddTransaction() {
  const { addTransaction } = useStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { c, text } = useTheme();
  const styles = useStyles();
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + space.md,
          paddingHorizontal: space.md,
          paddingBottom: 120,
          gap: space.lg,
        }}
      >
        <Text style={text.title} accessibilityRole="header">
          New transaction
        </Text>

        <View style={styles.segment} accessibilityRole="tablist">
          {(['Expense', 'Income'] as const).map((label) => {
            const active = (label === 'Income') === isIncome;
            return (
              <Pressable
                key={label}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  if (active) return;
                  Haptics.selectionAsync();
                  setIsIncome(label === 'Income');
                }}
                android_ripple={{ color: c.ripple, borderless: false }}
                style={({ pressed }) => [
                  styles.segItem,
                  active && styles.segActive,
                  pressed && !active && Platform.OS === 'ios' && styles.segPressed,
                ]}
              >
                <Text style={[text.subhead, { color: active ? c.text : c.textMuted }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.amountWrap}>
          <Text style={[text.largeTitle, { color: c.textMuted }]}>$</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={c.textMuted}
            keyboardType="decimal-pad"
            accessibilityLabel="Amount"
            style={[text.display, styles.amount]}
          />
        </View>

        <Card>
          <Text style={text.caption}>DESCRIPTION</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="What was it for?"
            placeholderTextColor={c.textMuted}
            accessibilityLabel="Description"
            style={[text.body, styles.input]}
          />
        </Card>

        {!isIncome && (
          <View style={{ gap: space.sm }}>
            <Text style={text.headline} accessibilityRole="header">
              Category
            </Text>
            <View style={styles.chips}>
              {expenseCategories.map((cat) => {
                const active = cat.id === category;
                const tint = c.category[cat.id];
                return (
                  <Pressable
                    key={cat.id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    onPress={() => {
                      if (active) return;
                      Haptics.selectionAsync();
                      setCategory(cat.id);
                    }}
                    android_ripple={{ color: c.ripple }}
                    style={({ pressed }) => [
                      styles.chip,
                      pressed && Platform.OS === 'ios' && styles.chipPressed,
                      active && { backgroundColor: tint + '26', borderColor: tint },
                    ]}
                  >
                    <Ionicons name={categories[cat.id].icon} size={16} color={tint} />
                    <Text style={text.subhead}>{cat.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <Pressable
          onPress={save}
          disabled={!valid}
          accessibilityRole="button"
          accessibilityState={{ disabled: !valid }}
          android_ripple={{ color: c.ripple }}
          style={({ pressed }) => [
            styles.save,
            { opacity: !valid ? 0.4 : pressed && Platform.OS === 'ios' ? 0.8 : 1 },
          ]}
        >
          <Text style={[text.headline, { color: c.onAccent }]}>Save transaction</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles(({ c }) => ({
  segment: { flexDirection: 'row', backgroundColor: c.surface, borderRadius: radius.pill, padding: space.xs },
  segItem: {
    flex: 1,
    minHeight: touch.min,
    paddingVertical: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  segActive: { backgroundColor: c.surfaceAlt },
  segPressed: { backgroundColor: c.pressed },
  amountWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs, paddingVertical: space.md },
  amount: { minWidth: 120 },
  input: { paddingTop: space.sm, paddingBottom: 2, minHeight: touch.min },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: touch.min,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    overflow: 'hidden',
  },
  chipPressed: { backgroundColor: c.pressed },
  save: {
    backgroundColor: c.accent,
    borderRadius: radius.md,
    minHeight: touch.min + 8,
    paddingVertical: space.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
}));
