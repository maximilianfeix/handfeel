import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../state/AppContext';
import { space, type } from '../theme';
import { IconName, Tab } from '../types';
import { Icon, isAndroid, pressedOpacity } from './ui';

const tabs: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'messages', label: 'Messages', icon: 'message-circle' },
  { id: 'contacts', label: 'Contacts', icon: 'users' },
  { id: 'settings', label: 'Settings', icon: 'sliders' },
];

// A platform-style tab bar: the selected tab is tinted (with the Material indicator
// pill behind the icon on Android), instead of a filled accent block.
export function TabBar({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  const { colors, unreadCount } = useApp();
  return <View style={[styles.bar, { backgroundColor: colors.surface, borderTopColor: colors.line }]} accessibilityRole="tablist">
    {tabs.map(tab => {
      const selected = active === tab.id;
      const tint = selected ? colors.greenText : colors.secondary;
      return <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={`${tab.label}${tab.id === 'messages' && unreadCount ? `, ${unreadCount} unread` : ''}`} onPress={() => onChange(tab.id)}
        android_ripple={{ color: colors.ripple, borderless: true }}
        style={({ pressed }) => [styles.tab, { opacity: pressedOpacity(pressed, 0.7) }]}>
        <View style={[styles.indicator, isAndroid && selected && { backgroundColor: colors.selected }]}>
          <Icon name={tab.icon} size={24} color={tint} />
          {tab.id === 'messages' && unreadCount > 0 && !selected && <View style={[styles.dot, { backgroundColor: colors.green, borderColor: colors.surface }]} />}
        </View>
        <Text style={[styles.label, { color: tint }]} maxFontSizeMultiplier={1.6}>{tab.label}</Text>
      </Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', paddingHorizontal: space.xs, paddingTop: space.xxs, paddingBottom: space.xxs, borderTopWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, minHeight: 56, gap: space.xxs, alignItems: 'center', justifyContent: 'center' },
  indicator: { width: 64, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  label: { ...type.caption2, fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, position: 'absolute', right: 16, top: 2 },
});
