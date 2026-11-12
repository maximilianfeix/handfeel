import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { ProgressBar } from '../../src/components/ProgressBar';
import { expenseCategories } from '../../src/data';
import { money } from '../../src/format';
import { useStore } from '../../src/store';
import { colors, font, space } from '../../src/theme';

const STEP = 25;

export default function Budgets() {
  const { budgets, spentByCategory, setBudget } = useStore();
  const insets = useSafeAreaInsets();
  const totalBudget = Object.values(budgets).reduce((a, b) => a + b, 0);
  const totalSpent = expenseCategories.reduce((s, c) => s + (spentByCategory[c.id] ?? 0), 0);

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + space.md,
        paddingHorizontal: space.md,
        paddingBottom: 120,
        gap: space.md,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={font.title}>Budgets</Text>

      <Card style={{ gap: space.sm }}>
        <Text style={font.caption}>THIS MONTH</Text>
        <Text style={styles.big}>
          {money(totalSpent)} <Text style={styles.bigMuted}>/ {money(totalBudget)}</Text>
        </Text>
        <ProgressBar value={totalBudget ? totalSpent / totalBudget : 0} color={colors.accent} />
        <Text style={font.caption}>
          {totalBudget - totalSpent >= 0
            ? `${money(totalBudget - totalSpent)} left to spend`
            : `${money(totalSpent - totalBudget)} over budget`}
        </Text>
      </Card>

      {expenseCategories.map((c) => {
        const limit = budgets[c.id as keyof typeof budgets];
        const spent = spentByCategory[c.id] ?? 0;
        const ratio = limit ? spent / limit : 0;
        return (
          <Card key={c.id} style={{ gap: space.sm }}>
            <View style={styles.head}>
              <View style={[styles.icon, { backgroundColor: c.color + '22' }]}>
                <Ionicons name={c.icon} size={18} color={c.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={font.body}>{c.label}</Text>
                <Text style={font.caption}>
                  {money(spent)} of {money(limit)}
                </Text>
              </View>
              <Stepper
                onMinus={() => setBudget(c.id as keyof typeof budgets, limit - STEP)}
                onPlus={() => setBudget(c.id as keyof typeof budgets, limit + STEP)}
              />
            </View>
            <ProgressBar value={ratio} color={c.color} />
            <Text style={[font.caption, ratio > 1 && { color: colors.negative }]}>
              {Math.round(ratio * 100)}% used
            </Text>
          </Card>
        );
      })}
    </ScrollView>
  );
}

function Stepper({ onMinus, onPlus }: { onMinus: () => void; onPlus: () => void }) {
  const press = (fn: () => void) => () => {
    Haptics.selectionAsync();
    fn();
  };
  return (
    <View style={styles.stepper}>
      <Pressable hitSlop={8} onPress={press(onMinus)} style={styles.stepBtn}>
        <Ionicons name="remove" size={16} color={colors.text} />
      </Pressable>
      <Pressable hitSlop={8} onPress={press(onPlus)} style={styles.stepBtn}>
        <Ionicons name="add" size={16} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  big: { color: colors.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.8 },
  bigMuted: { color: colors.textMuted, fontSize: 18, fontWeight: '600' },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepper: { flexDirection: 'row', gap: 6 },
  stepBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
});
