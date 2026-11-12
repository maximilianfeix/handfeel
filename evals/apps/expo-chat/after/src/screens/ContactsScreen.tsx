import React, { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { contacts } from '../data';
import { useApp } from '../state/AppContext';
import { Avatar, Brand, EmptyState, Icon, SearchField } from '../components/ui';

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
      <View style={styles.filterRow}><Text style={[styles.count, { color: colors.secondary }]}>{people.length} {people.length === 1 ? 'contact' : 'contacts'}</Text><Pressable accessibilityRole="button" accessibilityState={{ selected: onlineOnly }} onPress={() => setOnlineOnly(!onlineOnly)} style={[styles.filter, { backgroundColor: onlineOnly ? colors.selected : colors.soft }]}><View style={[styles.dot, { backgroundColor: colors.online }]} /><Text style={{ color: onlineOnly ? colors.greenText : colors.secondary, fontSize: 11, fontWeight: '500' }}>Online now</Text></Pressable></View>
    </View>}
    renderSectionHeader={({ section }) => <Text style={[styles.letter, { color: colors.secondary, backgroundColor: colors.background }]}>{section.title}</Text>}
    renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`Message ${item.name}`} onPress={() => onOpen(item.id)} style={({ pressed }) => [styles.contactRow, { backgroundColor: pressed ? colors.soft : colors.surface }]}>
      <Avatar contact={item} size={49} showOnline />
      <View style={{ flex: 1, gap: 6 }}><Text style={[styles.name, { color: colors.text }]}>{item.name}</Text><Text numberOfLines={1} style={[styles.about, { color: colors.secondary }]}>{item.about}</Text></View>
      <View style={[styles.messageIcon, { backgroundColor: colors.selected }]}><Icon name="message-circle" size={17} color={colors.greenText} /></View>
    </Pressable>}
    ListEmptyComponent={<EmptyState icon="users" title="No people found" description="Try another name or turn off the online filter to see everyone." />}
    contentContainerStyle={{ paddingBottom: 24 }} />;
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingTop: 26 },
  title: { fontSize: 34, fontWeight: '700', letterSpacing: -1, marginTop: 34 },
  subtitle: { fontSize: 13, marginTop: 8, marginBottom: 25 },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 24 },
  count: { fontSize: 12, fontWeight: '500' },
  filter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 9, borderRadius: 9, gap: 6 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  letter: { paddingHorizontal: 26, paddingVertical: 9, fontSize: 11, fontWeight: '600' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 24, paddingVertical: 16 },
  name: { fontSize: 14, fontWeight: '600' },
  about: { fontSize: 11 },
  messageIcon: { width: 36, height: 36, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
});
