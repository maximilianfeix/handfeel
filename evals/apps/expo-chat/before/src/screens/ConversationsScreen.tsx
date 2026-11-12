import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { contacts } from '../data';
import { useApp } from '../state/AppContext';
import { Filter } from '../types';
import { Avatar, Brand, EmptyState, Icon, IconButton, SearchField } from '../components/ui';
import { ConversationRow } from '../components/ConversationRow';

export function ConversationsScreen({ onOpen, onCompose, selectedId }: { onOpen: (id: string) => void; onCompose: () => void; selectedId: string | null }) {
  const { colors, conversations, preferences } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const filtered = useMemo(() => conversations.filter(item => {
    const contact = contacts.find(person => person.id === item.contactId);
    const matchesSearch = contact?.name.toLowerCase().includes(search.toLowerCase())
      || item.messages.some(message => message.text.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch && (filter === 'All' || (filter === 'Unread' && item.unread > 0) || (filter === 'Groups' && item.group));
  }).sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || (a.time === b.time ? 0 : a.time === 'Now' ? -1 : b.time === 'Now' ? 1 : 0)), [conversations, filter, search]);
  const unreadThreads = conversations.filter(item => item.unread > 0).length;

  const header = <>
    <View style={styles.brandRow}>
      <Brand />
      <View style={[styles.profile, { backgroundColor: colors.selected }]} accessibilityLabel={`${preferences.name}, your profile`}><Text style={{ color: colors.greenText, fontSize: 12, fontWeight: '700' }}>{preferences.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</Text></View>
    </View>
    <View style={styles.titleRow}>
      <View><Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Messages<Text style={{ color: colors.greenText }}>.</Text></Text><Text style={[styles.subtitle, { color: colors.secondary }]}>Good conversations start here.</Text></View>
      <IconButton icon="edit-3" label="New conversation" onPress={onCompose} filled size={46} />
    </View>
    <View style={styles.search}><SearchField value={search} onChangeText={setSearch} placeholder="Search people or messages" /></View>
    {!search && <View style={styles.peopleSection}>
      <View style={styles.sectionHeading}><Text style={[styles.sectionTitle, { color: colors.secondary }]}>Around right now</Text><View style={styles.live}><View style={[styles.liveDot, { backgroundColor: colors.online }]} /><Text style={[styles.liveText, { color: colors.secondary }]}>{contacts.filter(person => person.online).length} online</Text></View></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.people}>
        {contacts.filter(person => person.online).map(person => <Pressable key={person.id} onPress={() => onOpen(person.id)} accessibilityRole="button" accessibilityLabel={`Message ${person.name}, online`} style={({ pressed }) => [styles.person, { opacity: pressed ? 0.6 : 1 }]}>
          <View style={[styles.avatarRing, { borderColor: colors.line }]}><Avatar contact={person} size={48} showOnline /></View>
          <Text numberOfLines={1} style={[styles.personName, { color: colors.secondary }]}>{person.name.split(' ')[0]}</Text>
        </Pressable>)}
      </ScrollView>
    </View>}
    <View style={[styles.filtersRow, { borderBottomColor: colors.line }]}>
      <View style={styles.filters}>
        {(['All', 'Unread', 'Groups'] as Filter[]).map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: item === filter }} onPress={() => setFilter(item)} style={[styles.filter, { backgroundColor: item === filter ? colors.selected : 'transparent' }]}>
          <Text style={[styles.filterText, { color: item === filter ? colors.greenText : colors.secondary }]}>{item}</Text>
          {item === 'Unread' && unreadThreads > 0 && <Text style={[styles.filterCount, { color: colors.secondary }]}>{unreadThreads}</Text>}
        </Pressable>)}
      </View>
      <Icon name="filter" size={16} color={colors.secondary} />
    </View>
    {filter === 'All' && !search && <View style={styles.listLabel}><Icon name="bookmark" size={12} color={colors.secondary} /><Text style={[styles.listLabelText, { color: colors.secondary }]}>Your conversations</Text></View>}
  </>;

  return <FlatList style={{ flex: 1, backgroundColor: colors.surface }} data={filtered} keyExtractor={item => item.id} ListHeaderComponent={header} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
    renderItem={({ item }) => <ConversationRow conversation={item} selected={item.id === selectedId} onPress={() => onOpen(item.id)} />}
    ListEmptyComponent={<EmptyState title={filter === 'Unread' && !search ? 'All caught up' : 'No conversations found'} description={filter === 'Unread' && !search ? 'A quiet moment. Your unread messages will appear here.' : 'Try another name or message, or start a new conversation.'} icon={filter === 'Unread' ? 'check-circle' : 'search'} />}
    ListFooterComponent={filtered.length > 0 ? <View style={styles.footer}><Icon name="heart" size={12} color={colors.muted} /><Text style={[styles.footerText, { color: colors.secondary }]}>A little closer, wherever you are.</Text></View> : null} />;
}

const styles = StyleSheet.create({
  brandRow: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profile: { width: 34, height: 34, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  titleRow: { paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 34, fontWeight: '700', letterSpacing: -1.2 },
  subtitle: { fontSize: 12, marginTop: 7 },
  search: { paddingHorizontal: 24, marginTop: 25 },
  peopleSection: { marginTop: 27 },
  sectionHeading: { paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 12, fontWeight: '500' },
  live: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 5, height: 5, borderRadius: 3 },
  liveText: { fontSize: 10 },
  people: { paddingHorizontal: 21, paddingTop: 15, gap: 18, paddingBottom: 24 },
  person: { width: 60, alignItems: 'center', gap: 9 },
  avatarRing: { padding: 4, borderWidth: 1, borderRadius: 24 },
  personName: { fontSize: 11 },
  filtersRow: { marginHorizontal: 24, paddingTop: 4, paddingBottom: 17, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  filters: { flexDirection: 'row', gap: 5 },
  filter: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  filterText: { fontSize: 12, fontWeight: '600' },
  filterCount: { fontSize: 10 },
  listLabel: { paddingHorizontal: 26, paddingTop: 20, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  listLabelText: { fontSize: 11, fontWeight: '500' },
  footer: { paddingHorizontal: 24, paddingTop: 26, paddingBottom: 28, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 },
  footerText: { fontSize: 10 },
});
