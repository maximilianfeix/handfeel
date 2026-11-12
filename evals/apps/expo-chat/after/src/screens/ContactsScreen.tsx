import React, { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { contacts } from '../data';
import { useApp } from '../state/AppContext';
import { space, type } from '../theme';
import { haptics } from '../haptics';
import { Avatar, Brand, EmptyState, Icon, isAndroid, pressedOpacity, SearchField } from '../components/ui';

export function ContactsScreen({ onOpen, composing }: { onOpen: (id: string) => void; composing: boolean }) {
  const { colors } = useApp();
  const [search, setSearch] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const people = useMemo(() => contacts.filter(person => !['weekend', 'studio'].includes(person.id) && person.name.toLowerCase().includes(search.toLowerCase()) && (!onlineOnly || person.online)).sort((a, b) => a.name.localeCompare(b.name)), [search, onlineOnly]);
  const sections = useMemo(() => [...new Set(people.map(person => person.name[0] ?? '#'))].map(letter => ({ title: letter, data: people.filter(person => person.name.startsWith(letter)) })), [people]);

  return <SectionList style={{ flex: 1, backgroundColor: colors.surface }} sections={sections} keyExtractor={item => item.id} stickySectionHeadersEnabled={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
    ListHeaderComponent={<View style={styles.header}>
      <Brand small />
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{composing ? 'A new hello.' : 'Your people.'}</Text>
      <Text style={[styles.subtitle, { color: colors.secondary }]}>{composing ? 'Pick someone to start a conversation.' : 'Familiar faces. A message away.'}</Text>
      <SearchField value={search} onChangeText={setSearch} placeholder="Find a friend" />
      <View style={styles.filterRow}><Text style={[styles.count, { color: colors.secondary }]}>{people.length} {people.length === 1 ? 'contact' : 'contacts'}</Text><Pressable accessibilityRole="button" accessibilityState={{ selected: onlineOnly }} onPress={() => { haptics.selection(); setOnlineOnly(!onlineOnly); }} android_ripple={{ color: colors.ripple }} style={({ pressed }) => [styles.filter, { backgroundColor: onlineOnly ? colors.selected : colors.soft, opacity: pressedOpacity(pressed) }]}><View style={[styles.dot, { backgroundColor: colors.online }]} /><Text style={[type.footnote, { color: onlineOnly ? colors.greenText : colors.secondary, fontWeight: '500' }]}>Online now</Text></Pressable></View>
    </View>}
    renderSectionHeader={({ section }) => <Text style={[styles.letter, { color: colors.secondary, backgroundColor: colors.background }]}>{section.title}</Text>}
    renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`Message ${item.name}`} onPress={() => onOpen(item.id)} android_ripple={{ color: colors.ripple }} style={({ pressed }) => [styles.contactRow, { backgroundColor: pressed && !isAndroid ? colors.pressed : colors.surface }]}>
      <Avatar contact={item} size={49} showOnline />
      <View style={{ flex: 1, gap: space.xxs }}><Text style={[styles.name, { color: colors.text }]}>{item.name}</Text><Text numberOfLines={1} style={[styles.about, { color: colors.secondary }]}>{item.about}</Text></View>
      <View style={[styles.messageIcon, { backgroundColor: colors.selected }]}><Icon name="message-circle" size={18} color={colors.greenText} /></View>
    </Pressable>}
    ListEmptyComponent={<EmptyState icon="users" title="No people found" description="Try another name or turn off the online filter to see everyone." />}
    contentContainerStyle={{ paddingBottom: space.xl }} />;
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.xl, paddingTop: space.xl },
  title: { ...type.largeTitle, letterSpacing: -1, marginTop: space.xxl },
  subtitle: { ...type.subhead, marginTop: space.xs, marginBottom: space.xl },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space.lg },
  count: { ...type.footnote, fontWeight: '500' },
  filter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.sm, minHeight: 44, borderRadius: 12, gap: space.xs, overflow: 'hidden' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  letter: { ...type.footnote, paddingHorizontal: space.xl, paddingVertical: space.xs, fontWeight: '600' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.xl, paddingVertical: space.md },
  name: { ...type.headline },
  about: { ...type.footnote },
  messageIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});
