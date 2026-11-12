import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../state/AppContext';
import { IconName, Tab } from '../types';
import { Icon } from './ui';

const tabs: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'messages', label: 'Messages', icon: 'message-circle' },
  { id: 'contacts', label: 'Contacts', icon: 'users' },
  { id: 'settings', label: 'Settings', icon: 'sliders' },
];

export function TabBar({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  const { colors, unreadCount } = useApp();
  return <View style={[styles.wrapper, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
    <View style={[styles.bar, { backgroundColor: colors.soft }]} accessibilityRole="tablist">
      {tabs.map(tab => {
        const selected = active === tab.id;
        return <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={`${tab.label}${tab.id === 'messages' && unreadCount ? `, ${unreadCount} unread` : ''}`} onPress={() => onChange(tab.id)}
          style={({ pressed }) => [styles.tab, { backgroundColor: selected ? colors.green : 'transparent', opacity: pressed ? 0.7 : 1 }]}>
          <View><Icon name={tab.icon} size={20} color={selected ? colors.onGreen : colors.secondary} />
            {tab.id === 'messages' && unreadCount > 0 && !selected && <View style={[styles.dot, { backgroundColor: colors.green }]} />}
          </View>
          <Text style={[styles.label, { color: selected ? colors.onGreen : colors.secondary }]}>{tab.label}</Text>
        </Pressable>;
      })}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, borderTopWidth: StyleSheet.hairlineWidth },
  bar: { flexDirection: 'row', padding: 5, borderRadius: 22, gap: 4 },
  tab: { flex: 1, minHeight: 53, gap: 5, alignItems: 'center', justifyContent: 'center', borderRadius: 17 },
  label: { fontSize: 10, fontWeight: '600' },
  dot: { width: 6, height: 6, borderRadius: 3, position: 'absolute', right: -4, top: -2 },
});
