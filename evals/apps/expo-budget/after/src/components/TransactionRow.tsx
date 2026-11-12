import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { categories } from '../data';
import { money, relativeDay } from '../format';
import { space, useTheme } from '../theme';
import type { Transaction } from '../types';

export function TransactionRow({ tx }: { tx: Transaction }) {
  const { c, text } = useTheme();
  const cat = categories[tx.category];
  const tint = c.category[tx.category];
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: tint + '22' }]}>
        <Ionicons name={cat.icon} size={20} color={tint} />
      </View>
      <View style={styles.mid}>
        <Text style={text.body} numberOfLines={1}>
          {tx.title}
        </Text>
        <Text style={text.footnote}>
          {cat.label} · {relativeDay(tx.date)}
        </Text>
      </View>
      <Text style={[text.body, { color: tx.amount > 0 ? c.positive : c.text }]}>
        {money(tx.amount, { sign: true })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: space.md },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  mid: { flex: 1, gap: 2 },
});
