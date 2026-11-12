import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { TransactionRow } from '../../src/components/TransactionRow';
import { money } from '../../src/format';
import { useStore } from '../../src/store';
import { colors, font, radius, space } from '../../src/theme';

export default function Dashboard() {
  const { balance, income, expenses, transactions } = useStore();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingTop: insets.top + space.md,
        paddingHorizontal: space.md,
        paddingBottom: 120,
        gap: space.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text style={font.caption}>Good evening</Text>
        <Text style={font.title}>Overview</Text>
      </View>

      <LinearGradient
        colors={['#4F5BD5', '#8E5CF0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroLabel}>Total balance</Text>
        <Text style={styles.heroAmount}>{money(balance)}</Text>
        <View style={styles.heroRow}>
          <Stat icon="arrow-down" label="Income" value={money(income)} />
          <View style={styles.divider} />
          <Stat icon="arrow-up" label="Expenses" value={money(expenses)} />
        </View>
      </LinearGradient>

      <View style={{ gap: space.sm }}>
        <Text style={font.h2}>Recent transactions</Text>
        <Card style={{ paddingVertical: space.xs }}>
          {transactions.slice(0, 6).map((tx, i) => (
            <View key={tx.id} style={i > 0 ? styles.sep : undefined}>
              <TransactionRow tx={tx} />
            </View>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={14} color="#fff" />
      </View>
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.lg + 4, padding: space.lg, gap: space.sm },
  heroLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600', letterSpacing: 0.4 },
  heroAmount: { color: '#fff', fontSize: 42, fontWeight: '700', letterSpacing: -1.2 },
  heroRow: { flexDirection: 'row', marginTop: space.md, alignItems: 'center' },
  divider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: space.md },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  statIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  statValue: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
