import React, { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../state/AppContext';
import { Contact, IconName } from '../types';
import { space, type } from '../theme';

export const isAndroid = Platform.OS === 'android';

// Android shows a ripple (android_ripple); iOS and web dim the control while pressed.
export const pressedOpacity = (pressed: boolean, dimmed = 0.6) => (pressed && !isAndroid ? dimmed : 1);

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color?: string }) {
  const { colors } = useApp();
  return <Feather name={name} size={size} color={color ?? colors.text} />;
}

export function IconButton({ icon, label, onPress, filled = false, disabled = false, size = 48 }: { icon: IconName; label: string; onPress: () => void; filled?: boolean; disabled?: boolean; size?: number }) {
  const { colors } = useApp();
  const target = Math.max(size, 44);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    android_ripple={{ color: colors.ripple, borderless: false, foreground: true }}
    style={({ pressed }) => [{ width: target, height: target, borderRadius: target / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: filled ? colors.green : colors.soft, opacity: disabled ? 0.4 : pressedOpacity(pressed, 0.65) }]}>
    <Icon name={icon} size={20} color={filled ? colors.onGreen : colors.text} />
  </Pressable>;
}

export function Avatar({ contact, size = 54, showOnline = false }: { contact: Contact; size?: number; showOnline?: boolean }) {
  const { colors, preferences } = useApp();
  const [failed, setFailed] = useState(false);
  return <View style={{ width: size, height: size }} accessibilityLabel={`${contact.name}${showOnline && contact.online && preferences.onlineStatus ? ', online' : ''}`}>
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size * 0.38, backgroundColor: colors.avatar[contact.color] }]}>
      {contact.photo && !failed ? <Image source={{ uri: contact.photo }} onError={() => setFailed(true)} style={{ width: size, height: size }} accessibilityIgnoresInvertColors />
        : <Text style={{ color: colors.onAvatar, fontWeight: '600', fontSize: size * 0.34 }} maxFontSizeMultiplier={1.4}>{contact.initials}</Text>}
    </View>
    {showOnline && contact.online && preferences.onlineStatus && <View style={[styles.online, { backgroundColor: colors.online, borderColor: colors.surface }]} />}
  </View>;
}

export function SearchField({ value, onChangeText, placeholder }: { value: string; onChangeText: (text: string) => void; placeholder: string }) {
  const { colors } = useApp();
  return <View style={[styles.search, { backgroundColor: colors.soft }]}>
    <Icon name="search" size={20} color={colors.secondary} />
    {/* Keyboard avoidance lives in the screens: search fields sit at the top of their list, and the chat search sits inside ChatScreen's KeyboardAvoidingView. */}
    {/* handfeel-ignore-next-line keyboard-covers-input */}
    <TextInput accessibilityLabel={placeholder} placeholder={placeholder} placeholderTextColor={colors.secondary} value={value} onChangeText={onChangeText} autoCapitalize="none" autoCorrect={false} returnKeyType="search" clearButtonMode="never" style={[styles.searchInput, { color: colors.text }]} />
    {value.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => onChangeText('')}
      android_ripple={{ color: colors.ripple, borderless: true, radius: 22 }}
      style={({ pressed }) => [styles.clear, { opacity: pressedOpacity(pressed) }]}><Icon name="x" size={18} color={colors.secondary} /></Pressable>}
  </View>;
}

export function EmptyState({ icon = 'message-circle', title, description }: { icon?: IconName; title: string; description: string }) {
  const { colors } = useApp();
  return <View style={styles.empty}>
    <View style={[styles.emptyIcon, { backgroundColor: colors.selected }]}><Icon name={icon} size={28} color={colors.greenText} /></View>
    <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
    <Text style={[styles.emptyDescription, { color: colors.secondary }]}>{description}</Text>
  </View>;
}

export function Brand({ small = false }: { small?: boolean }) {
  const { colors } = useApp();
  return <View style={styles.brand}>
    <View style={[styles.brandMark, { backgroundColor: colors.green, width: small ? 30 : 34, height: small ? 30 : 34 }]}>
      <View style={[styles.brandPetal, { backgroundColor: colors.lime }]} /><View style={[styles.brandPetal, styles.brandPetalSecond, { backgroundColor: colors.onGreen }]} />
    </View>
    <Text style={{ color: colors.text, fontSize: small ? 23 : 27, fontWeight: '700', letterSpacing: -1 }}>gather<Text style={{ color: colors.greenText }}>.</Text></Text>
  </View>;
}

export function SectionLabel({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors } = useApp();
  return <View style={[{ paddingHorizontal: space.xl, paddingTop: space.xl, paddingBottom: space.sm }, style]}><Text accessibilityRole="header" style={[type.footnote, { fontWeight: '600', color: colors.secondary }]}>{children}</Text></View>;
}

const styles = StyleSheet.create({
  avatar: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  online: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, position: 'absolute', right: -1, bottom: 0 },
  search: { flexDirection: 'row', alignItems: 'center', gap: space.xs, borderRadius: 14, paddingLeft: space.md, paddingRight: space.xxs, minHeight: 48 },
  searchInput: { flex: 1, ...type.body, minHeight: 48, paddingVertical: space.sm, paddingHorizontal: 0 },
  clear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', padding: space.xxl, paddingVertical: 48, gap: space.sm },
  emptyIcon: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 24, marginBottom: space.xxs },
  emptyTitle: { ...type.headline, textAlign: 'center' },
  emptyDescription: { ...type.subhead, textAlign: 'center', maxWidth: 280 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  brandMark: { borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  brandPetal: { width: 10, height: 19, borderRadius: 7, transform: [{ rotate: '-35deg' }], position: 'absolute', left: 9, top: 6 },
  brandPetalSecond: { left: 17, top: 12, height: 15, transform: [{ rotate: '35deg' }] },
});
