import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../src/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const tab = (title: string, icon: IconName, iconActive: IconName) => ({
  title,
  tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
    <Ionicons name={focused ? iconActive : icon} size={24} color={color} />
  ),
});

export default function TabsLayout() {
  return (
    <Tabs
      screenListeners={{ tabPress: () => Haptics.selectionAsync() }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.surface,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView tint="dark" intensity={60} style={StyleSheet.absoluteFill} />
          ) : null,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={tab('Home', 'home-outline', 'home')} />
      <Tabs.Screen name="add" options={tab('Add', 'add-circle-outline', 'add-circle')} />
      <Tabs.Screen name="budgets" options={tab('Budgets', 'pie-chart-outline', 'pie-chart')} />
      <Tabs.Screen name="profile" options={tab('Profile', 'person-outline', 'person')} />
    </Tabs>
  );
}
