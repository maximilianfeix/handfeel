import React from 'react';
import { Pressable, StyleSheet, TouchableWithoutFeedback, Keyboard, View } from 'react-native';
export default ({ close }: { close: () => void }) => <><Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Close" onPress={close} /><TouchableWithoutFeedback onPress={Keyboard.dismiss}><View /></TouchableWithoutFeedback></>;
