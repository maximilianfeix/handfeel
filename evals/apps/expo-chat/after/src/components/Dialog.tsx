import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../state/AppContext';
import { space, type } from '../theme';
import { IconButton } from './ui';

// Secondary tasks open in a sheet: the native page sheet on iOS, a bottom sheet on
// Android and phone-width web. Only a wide web window keeps a centered dialog.
export function Dialog({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  const { colors } = useApp();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const nativeSheet = Platform.OS === 'ios';
  const centered = Platform.OS === 'web' && width >= 900;

  const heading = <View style={styles.heading}>
    <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{title}</Text>
    <IconButton icon="x" label="Close" onPress={onClose} />
  </View>;
  const body = <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.body, { paddingBottom: space.xl + insets.bottom }]}>{children}</ScrollView>;

  if (nativeSheet) {
    return <Modal visible={visible} presentationStyle="pageSheet" animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={[styles.pageSheet, { backgroundColor: colors.surface }]} behavior="padding">
        {heading}
        {body}
      </KeyboardAvoidingView>
    </Modal>;
  }

  // handfeel-ignore-next-line modal-instead-of-sheet
  return <Modal visible={visible} transparent animationType={centered ? 'fade' : 'slide'} statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
    <KeyboardAvoidingView style={[styles.overlay, centered ? styles.overlayCentered : styles.overlaySheet, { backgroundColor: colors.scrim }]} behavior="padding">
      {/* The scrim only dismisses; a pressed state on it would read as a second control. */}
      {/* handfeel-ignore-next-line no-press-feedback */}
      <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} />
      <View accessibilityViewIsModal role="dialog" aria-label={title} style={[centered ? styles.card : styles.sheet, { backgroundColor: colors.surface }]}>
        {!centered && <View style={[styles.handle, { backgroundColor: colors.line }]} />}
        {heading}
        {body}
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  pageSheet: { flex: 1, paddingTop: space.xs },
  overlay: { flex: 1, alignItems: 'center' },
  overlaySheet: { justifyContent: 'flex-end' },
  overlayCentered: { justifyContent: 'center', padding: space.xl },
  sheet: { width: '100%', maxHeight: '90%', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  card: { width: '100%', maxWidth: 420, maxHeight: '85%', borderRadius: 24, overflow: 'hidden' },
  handle: { alignSelf: 'center', width: 32, height: 4, borderRadius: 2, marginTop: space.md },
  heading: { paddingHorizontal: space.xl, paddingTop: space.md, paddingBottom: space.xs, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.xs },
  title: { ...type.title2, flexShrink: 1 },
  body: { padding: space.xl, paddingTop: space.sm, gap: space.md },
});
