import React from 'react';
import { TextInput, KeyboardAvoidingView, Platform } from 'react-native';
export default () => <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}><TextInput placeholder="Name" /></KeyboardAvoidingView>;
