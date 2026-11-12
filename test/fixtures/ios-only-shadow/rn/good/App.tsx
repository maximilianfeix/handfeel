import React from 'react';
import { StyleSheet, Platform } from 'react-native';
export const s = StyleSheet.create({ card: { ...Platform.select({ ios: { shadowColor: '#000', shadowRadius: 8 }, android: { elevation: 2 } }) }, b: { shadowColor: '#000', elevation: 2 } });
