import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { categories } from '../data';
import { money, relativeDay } from '../format';
import { colors, font, space } from '../theme';
import type { Transaction } from '../types';

export function TransactionRow({ tx }: { tx: Transaction }) {
  const cat = categories[tx.category];
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: cat.color + '22' }]}>
        <Ionicons name={cat.icon} size={20} color={cat.color} />
      </View>
      <View style={styles.mid}>
        <Text style={font.body} numberOfLines={1}>
          {tx.title}
        </Text>
        <Text style={font.caption}>
          {cat.label} · {relativeDay(tx.date)}
        </Text>
      </View>
      <Text style={[font.body, { color: tx.amount > 0 ? colors.positive : colors.text }]}>
        {money(tx.amount, { sign: true })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: space.md },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  mid: { flex: 1, gap: 2 },
});
