import React from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { ProgressBar } from '../../src/components/ProgressBar';
import { expenseCategories } from '../../src/data';
import { money } from '../../src/format';
import { useStore } from '../../src/store';
import { makeStyles, space, touch, useTheme } from '../../src/theme';

const STEP = 25;

export default function Budgets() {
  const { budgets, spentByCategory, setBudget } = useStore();
  const insets = useSafeAreaInsets();
  const { c, text } = useTheme();
  const styles = useStyles();
  const totalBudget = Object.values(budgets).reduce((a, b) => a + b, 0);
  const totalSpent = expenseCategories.reduce((s, cat) => s + (spentByCategory[cat.id] ?? 0), 0);

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
      <Text style={text.title} accessibilityRole="header">
        Budgets
      </Text>

      <Card style={{ gap: space.sm }}>
        <Text style={text.caption}>THIS MONTH</Text>
        <Text style={text.title}>
          {money(totalSpent)} <Text style={[text.headline, { color: c.textMuted }]}>/ {money(totalBudget)}</Text>
        </Text>
        <ProgressBar value={totalBudget ? totalSpent / totalBudget : 0} color={c.accent} />
        <Text style={text.footnote}>
          {totalBudget - totalSpent >= 0
            ? `${money(totalBudget - totalSpent)} left to spend`
            : `${money(totalSpent - totalBudget)} over budget`}
        </Text>
      </Card>

      {expenseCategories.map((cat) => {
        const limit = budgets[cat.id as keyof typeof budgets];
        const spent = spentByCategory[cat.id] ?? 0;
        const ratio = limit ? spent / limit : 0;
        const tint = c.category[cat.id];
        return (
          <Card key={cat.id} style={{ gap: space.sm }}>
            <View style={styles.head}>
              <View style={[styles.icon, { backgroundColor: tint + '22' }]}>
                <Ionicons name={cat.icon} size={20} color={tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={text.body}>{cat.label}</Text>
                <Text style={text.footnote}>
                  {money(spent)} of {money(limit)}
                </Text>
              </View>
              <Stepper
                label={cat.label}
                onMinus={() => setBudget(cat.id as keyof typeof budgets, limit - STEP)}
                onPlus={() => setBudget(cat.id as keyof typeof budgets, limit + STEP)}
              />
            </View>
            <ProgressBar value={ratio} color={tint} />
            <Text style={[text.footnote, ratio > 1 && { color: c.negative }]}>
              {Math.round(ratio * 100)}% used
            </Text>
          </Card>
        );
      })}
    </ScrollView>
  );
}

function Stepper({ label, onMinus, onPlus }: { label: string; onMinus: () => void; onPlus: () => void }) {
  const { c } = useTheme();
  const styles = useStyles();
  const press = (fn: () => void) => () => {
    Haptics.selectionAsync();
    fn();
  };
  const buttonStyle = ({ pressed }: { pressed: boolean }) => [
    styles.stepBtn,
    pressed && Platform.OS === 'ios' && styles.stepBtnPressed,
  ];
  return (
    <View style={styles.stepper}>
      <Pressable
        hitSlop={4}
        onPress={press(onMinus)}
        accessibilityRole="button"
        accessibilityLabel={`Lower ${label} budget by ${STEP} dollars`}
        android_ripple={{ color: c.ripple, borderless: true }}
        style={buttonStyle}
      >
        <Ionicons name="remove" size={20} color={c.text} />
      </Pressable>
      <Pressable
        hitSlop={4}
        onPress={press(onPlus)}
        accessibilityRole="button"
        accessibilityLabel={`Raise ${label} budget by ${STEP} dollars`}
        android_ripple={{ color: c.ripple, borderless: true }}
        style={buttonStyle}
      >
        <Ionicons name="add" size={20} color={c.text} />
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles(({ c }) => ({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepper: { flexDirection: 'row', gap: space.sm },
  stepBtn: {
    width: touch.min,
    height: touch.min,
    borderRadius: touch.min / 2,
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnPressed: { backgroundColor: c.border },
}));
