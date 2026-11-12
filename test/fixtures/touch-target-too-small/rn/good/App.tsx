import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
const s = StyleSheet.create({ btn: { width: 44, height: 44 }, dot: { width: 24, height: 24 } });
export default () => <><Pressable style={s.btn} onPress={() => {}} /><Pressable style={s.dot} hitSlop={10} onPress={() => {}} /></>;
