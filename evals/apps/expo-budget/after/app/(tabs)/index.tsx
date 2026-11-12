import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { TransactionRow } from '../../src/components/TransactionRow';
import { money } from '../../src/format';
import { useStore } from '../../src/store';
import { makeStyles, space, useTheme } from '../../src/theme';

export default function Dashboard() {
  const { balance, income, expenses, transactions } = useStore();
  const insets = useSafeAreaInsets();
  const { c, text } = useTheme();
  const styles = useStyles();

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
        <Text style={text.footnote}>Good evening</Text>
        <Text style={text.title} accessibilityRole="header">
          Overview
        </Text>
      </View>

      <Card style={styles.hero}>
        <Text style={text.footnote}>Total balance</Text>
        <Text style={text.largeTitle} numberOfLines={1} adjustsFontSizeToFit>
          {money(balance)}
        </Text>
        <View style={styles.heroRow}>
          <Stat icon="arrow-down" tint={c.positive} label="Income" value={money(income)} />
          <View style={styles.divider} />
          <Stat icon="arrow-up" tint={c.text} label="Expenses" value={money(expenses)} />
        </View>
      </Card>

      <View style={{ gap: space.sm }}>
        <Text style={text.headline} accessibilityRole="header">
          Recent transactions
        </Text>
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
  tint,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tint: string;
  label: string;
  value: string;
}) {
  const { text } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={16} color={tint} />
      </View>
      <View style={{ flexShrink: 1 }}>
        <Text style={text.caption}>{label}</Text>
        <Text style={text.subhead}>{value}</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ c }) => ({
  hero: { padding: space.lg, gap: space.sm },
  heroRow: { flexDirection: 'row', marginTop: space.md, alignItems: 'center' },
  divider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: c.border, marginHorizontal: space.md },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  statIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
}));
