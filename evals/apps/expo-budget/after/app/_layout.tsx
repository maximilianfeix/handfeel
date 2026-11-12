import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from '../src/store';
import { useTheme } from '../src/theme';

export default function RootLayout() {
  const { c } = useTheme();
  return (
    <StoreProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />
    </StoreProvider>
  );
}
