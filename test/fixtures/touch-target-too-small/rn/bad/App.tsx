import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
const s = StyleSheet.create({ btn: { width: 32, height: 32 } });
export default () => <><Pressable style={s.btn} onPress={() => {}} /><Ionicons name="close" size={20} onPress={() => {}} /></>;
