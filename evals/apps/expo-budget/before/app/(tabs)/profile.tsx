import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { useStore } from '../../src/store';
import { colors, font, space } from '../../src/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { transactions } = useStore();
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
      <Text style={font.title}>Profile</Text>

      <View style={styles.header}>
        <LinearGradient colors={['#4F5BD5', '#B58CFF']} style={styles.avatar}>
          <Text style={styles.initials}>AM</Text>
        </LinearGradient>
        <Text style={font.h2}>Alex Morgan</Text>
        <Text style={font.caption}>alex@example.com</Text>
        <Text style={[font.caption, { marginTop: 4 }]}>
          {transactions.length} transactions tracked
        </Text>
      </View>

      <Card style={{ paddingVertical: 4 }}>
        <Row icon="notifications-outline" label="Budget alerts">
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ true: colors.accent, false: colors.surfaceAlt }}
          />
        </Row>
        <Row icon="finger-print-outline" label="Face ID lock" divider>
          <Switch
            value={faceId}
            onValueChange={setFaceId}
            trackColor={{ true: colors.accent, false: colors.surfaceAlt }}
          />
        </Row>
        <Row icon="cash-outline" label="Currency" divider>
          <Text style={font.caption}>USD</Text>
        </Row>
        <Row icon="download-outline" label="Export data" divider>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Row>
      </Card>

      <Text style={[font.caption, { textAlign: 'center' }]}>Ledger 1.0.0</Text>
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
  return (
    <View style={[styles.row, divider && styles.divider]}>
      <Ionicons name={icon} size={20} color={colors.accent} />
      <Text style={[font.body, { flex: 1 }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: 4 },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
  initials: { color: '#fff', fontSize: 30, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 14 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
