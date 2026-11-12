import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../state/AppContext';
import { Contact, IconName } from '../types';

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color?: string }) {
  const { colors } = useApp();
  return <Feather name={name} size={size} color={color ?? colors.text} />;
}

export function IconButton({ icon, label, onPress, filled = false, disabled = false, size = 44 }: { icon: IconName; label: string; onPress: () => void; filled?: boolean; disabled?: boolean; size?: number }) {
  const { colors } = useApp();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: filled ? colors.green : colors.soft, opacity: disabled ? 0.4 : pressed ? 0.65 : 1 }]}>
    <Icon name={icon} size={20} color={filled ? colors.onGreen : colors.text} />
  </Pressable>;
}

export function Avatar({ contact, size = 54, showOnline = false }: { contact: Contact; size?: number; showOnline?: boolean }) {
  const { colors, preferences } = useApp();
  const [failed, setFailed] = useState(false);
  return <View style={{ width: size, height: size }} accessibilityLabel={`${contact.name}${showOnline && contact.online && preferences.onlineStatus ? ', online' : ''}`}>
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size * 0.38, backgroundColor: contact.color }]}>
      {contact.photo && !failed ? <Image source={{ uri: contact.photo }} onError={() => setFailed(true)} style={{ width: size, height: size }} accessibilityIgnoresInvertColors />
        : <Text style={{ color: '#344A3D', fontWeight: '600', fontSize: size * 0.34 }}>{contact.initials}</Text>}
    </View>
    {showOnline && contact.online && preferences.onlineStatus && <View style={[styles.online, { backgroundColor: colors.online, borderColor: colors.surface }]} />}
  </View>;
}

export function SearchField({ value, onChangeText, placeholder }: { value: string; onChangeText: (text: string) => void; placeholder: string }) {
  const { colors } = useApp();
  return <View style={[styles.search, { backgroundColor: colors.soft }]}>
    <Icon name="search" size={19} color={colors.secondary} />
    <TextInput accessibilityLabel={placeholder} placeholder={placeholder} placeholderTextColor={colors.secondary} value={value} onChangeText={onChangeText} autoCapitalize="none" autoCorrect={false} returnKeyType="search" style={[styles.searchInput, { color: colors.text }]} />
    {value.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => onChangeText('')} hitSlop={10}><Icon name="x" size={18} color={colors.secondary} /></Pressable>}
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
      <View style={styles.brandPetal} /><View style={[styles.brandPetal, styles.brandPetalSecond]} />
    </View>
    <Text style={{ color: colors.text, fontSize: small ? 23 : 27, fontWeight: '700', letterSpacing: -1 }}>gather<Text style={{ color: colors.greenText }}>.</Text></Text>
  </View>;
}

export function SectionLabel({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors } = useApp();
  return <View style={[{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12 }, style]}><Text style={{ fontSize: 13, fontWeight: '600', color: colors.secondary }}>{children}</Text></View>;
}

const styles = StyleSheet.create({
  avatar: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  online: { width: 13, height: 13, borderRadius: 7, borderWidth: 3, position: 'absolute', right: -1, bottom: 0 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingHorizontal: 15, height: 48 },
  searchInput: { flex: 1, fontSize: 14, height: 48, padding: 0 },
  empty: { alignItems: 'center', padding: 32, paddingVertical: 48, gap: 12 },
  emptyIcon: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 24, marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  emptyDescription: { fontSize: 14, lineHeight: 22, textAlign: 'center', maxWidth: 280 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: { borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  brandPetal: { width: 10, height: 19, backgroundColor: '#D9EABD', borderRadius: 7, transform: [{ rotate: '-35deg' }], position: 'absolute', left: 9, top: 6 },
  brandPetalSecond: { left: 17, top: 12, height: 15, backgroundColor: '#FFFFFF', transform: [{ rotate: '35deg' }] },
});
