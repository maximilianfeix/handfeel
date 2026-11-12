import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
export default () => <Pressable onPress={() => {}} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })} android_ripple={{ color: '#0002' }}><Text>Save</Text></Pressable>;
