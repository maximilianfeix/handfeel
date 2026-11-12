import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../state/AppContext';
import { IconButton } from './ui';

export function Dialog({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  const { colors } = useApp();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Close dialog" onPress={onClose} />
      <View accessibilityViewIsModal role="dialog" aria-label={title} style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.heading}><Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{title}</Text><IconButton icon="x" label="Close dialog" onPress={onClose} /></View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>{children}</ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(10, 24, 16, 0.48)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 420, maxHeight: '85%', borderRadius: 24, overflow: 'hidden' },
  heading: { padding: 22, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 22, fontWeight: '600', letterSpacing: -0.6, flexShrink: 1 },
  body: { padding: 24, paddingTop: 12, gap: 16 },
});
