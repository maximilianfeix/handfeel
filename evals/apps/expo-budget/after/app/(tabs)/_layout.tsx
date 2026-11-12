import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const tab = (title: string, icon: IconName, iconActive: IconName) => ({
  title,
  tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
    <Ionicons name={focused ? iconActive : icon} size={24} color={color} />
  ),
});

export default function TabsLayout() {
  const { c } = useTheme();
  return (
    <Tabs
      screenListeners={{ tabPress: () => Haptics.selectionAsync() }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textMuted,
        tabBarLabelStyle: { fontWeight: '600' },
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: c.border,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : c.surface,
          elevation: 0,
        },
        // Bar material belongs on the tab bar (chrome), not on content. The system
        // chrome material follows light and dark mode on iOS.
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView tint="systemChromeMaterial" intensity={100} style={StyleSheet.absoluteFill} />
          ) : null,
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      <Tabs.Screen name="index" options={tab('Home', 'home-outline', 'home')} />
      <Tabs.Screen name="add" options={tab('Add', 'add-circle-outline', 'add-circle')} />
      <Tabs.Screen name="budgets" options={tab('Budgets', 'pie-chart-outline', 'pie-chart')} />
      <Tabs.Screen name="profile" options={tab('Profile', 'person-outline', 'person')} />
    </Tabs>
  );
}
