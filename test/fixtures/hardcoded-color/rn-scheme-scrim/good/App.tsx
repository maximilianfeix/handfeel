import React from 'react';
import { View, useColorScheme } from 'react-native';
export default () => {
  const isDark = useColorScheme() === 'dark';
  const bg = isDark
    ? '#10161F'
    : '#FFFFFF';
  return <View style={{ backgroundColor: bg, borderColor: 'rgba(0, 0, 0, 0.5)', shadowColor: 'rgba(0,0,0,0)' }} />;
};
