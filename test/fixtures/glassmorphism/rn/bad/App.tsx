import React from 'react';
import { BlurView } from 'expo-blur';
import { View } from 'react-native';
export default () => <><BlurView intensity={40} /><View style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} /></>;
