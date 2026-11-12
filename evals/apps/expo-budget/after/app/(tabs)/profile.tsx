import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { useStore } from '../../src/store';
import { makeStyles, space, useTheme } from '../../src/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { transactions } = useStore();
  const { c, text } = useTheme();
  const styles = useStyles();
  const [notifications, setNotifications] = useState(true);
  const [faceId, setFaceId] = useState(false);

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + space.md,
        paddingHorizontal: space.md,
        paddingBottom: 120,
        gap: space.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={text.title} accessibilityRole="header">
        Profile
      </Text>

      <View style={styles.header}>
        <View style={styles.avatar} accessible accessibilityLabel="Alex Morgan's avatar">
          <Text style={[text.title, { color: c.accent }]}>AM</Text>
        </View>
        <Text style={text.headline}>Alex Morgan</Text>
        <Text style={text.footnote}>alex@example.com</Text>
        <Text style={[text.footnote, { marginTop: space.xs }]}>{transactions.length} transactions tracked</Text>
      </View>

      <Card style={{ paddingVertical: space.xs }}>
        <Row icon="notifications-outline" label="Budget alerts">
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ true: c.accent, false: c.surfaceAlt }}
            accessibilityLabel="Budget alerts"
          />
        </Row>
        <Row icon="finger-print-outline" label="Face ID lock" divider>
          <Switch
            value={faceId}
            onValueChange={setFaceId}
            trackColor={{ true: c.accent, false: c.surfaceAlt }}
            accessibilityLabel="Face ID lock"
          />
        </Row>
        <Row icon="cash-outline" label="Currency" divider>
          <Text style={text.footnote}>USD</Text>
        </Row>
        <Row icon="download-outline" label="Export data" divider>
          <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
        </Row>
      </Card>

      <Text style={[text.footnote, { textAlign: 'center' }]}>Ledger 1.0.0</Text>
    </ScrollView>
  );
}

function Row({
  icon,
  label,
  divider,
  children,
}: {
  icon: IconName;
  label: string;
  divider?: boolean;
  children: React.ReactNode;
}) {
  const { c, text } = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.row, divider && styles.divider]}>
      <Ionicons name={icon} size={20} color={c.textMuted} />
      <Text style={[text.body, { flex: 1 }]}>{label}</Text>
      {children}
    </View>
  );
}

const useStyles = makeStyles(({ c }) => ({
  header: { alignItems: 'center', gap: space.xs },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48, paddingVertical: space.sm },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
}));
