import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { contacts } from '../data';
import { useApp } from '../state/AppContext';
import { Filter } from '../types';
import { space, type } from '../theme';
import { haptics } from '../haptics';
import { Avatar, Brand, EmptyState, Icon, IconButton, pressedOpacity, SearchField } from '../components/ui';
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
      <View style={[styles.profile, { backgroundColor: colors.selected }]} accessibilityLabel={`${preferences.name}, your profile`}><Text style={[type.caption1, { color: colors.greenText, fontWeight: '700' }]} maxFontSizeMultiplier={1.4}>{preferences.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</Text></View>
    </View>
    <View style={styles.titleRow}>
      <View><Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Messages<Text style={{ color: colors.greenText }}>.</Text></Text><Text style={[styles.subtitle, { color: colors.secondary }]}>Good conversations start here.</Text></View>
      <IconButton icon="edit-3" label="New conversation" onPress={onCompose} filled size={48} />
    </View>
    <View style={styles.search}><SearchField value={search} onChangeText={setSearch} placeholder="Search people or messages" /></View>
    {!search && <View style={styles.peopleSection}>
      <View style={styles.sectionHeading}><Text style={[styles.sectionTitle, { color: colors.secondary }]}>Around right now</Text><View style={styles.live}><View style={[styles.liveDot, { backgroundColor: colors.online }]} /><Text style={[styles.liveText, { color: colors.secondary }]}>{contacts.filter(person => person.online).length} online</Text></View></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.people}>
        {contacts.filter(person => person.online).map(person => <Pressable key={person.id} onPress={() => onOpen(person.id)} accessibilityRole="button" accessibilityLabel={`Message ${person.name}, online`} android_ripple={{ color: colors.ripple, borderless: true, radius: 36 }} style={({ pressed }) => [styles.person, { opacity: pressedOpacity(pressed) }]}>
          <View style={[styles.avatarRing, { borderColor: colors.line }]}><Avatar contact={person} size={48} showOnline /></View>
          <Text numberOfLines={1} style={[styles.personName, { color: colors.secondary }]}>{person.name.split(' ')[0]}</Text>
        </Pressable>)}
      </ScrollView>
    </View>}
    <View style={[styles.filtersRow, { borderBottomColor: colors.line }]}>
      <View style={styles.filters}>
        {(['All', 'Unread', 'Groups'] as Filter[]).map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: item === filter }} onPress={() => { if (item !== filter) haptics.selection(); setFilter(item); }} android_ripple={{ color: colors.ripple }} style={({ pressed }) => [styles.filter, { backgroundColor: item === filter ? colors.selected : 'transparent', opacity: pressedOpacity(pressed) }]}>
          <Text style={[styles.filterText, { color: item === filter ? colors.greenText : colors.secondary }]}>{item}</Text>
          {item === 'Unread' && unreadThreads > 0 && <Text style={[styles.filterCount, { color: colors.secondary }]}>{unreadThreads}</Text>}
        </Pressable>)}
      </View>
    </View>
    {filter === 'All' && !search && <View style={styles.listLabel}><Icon name="bookmark" size={12} color={colors.secondary} /><Text style={[styles.listLabelText, { color: colors.secondary }]}>Your conversations</Text></View>}
  </>;

  return <FlatList style={{ flex: 1, backgroundColor: colors.surface }} data={filtered} keyExtractor={item => item.id} ListHeaderComponent={header} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
    renderItem={({ item }) => <ConversationRow conversation={item} selected={item.id === selectedId} onPress={() => onOpen(item.id)} />}
    ListEmptyComponent={<EmptyState title={filter === 'Unread' && !search ? 'All caught up' : 'No conversations found'} description={filter === 'Unread' && !search ? 'A quiet moment. Your unread messages will appear here.' : 'Try another name or message, or start a new conversation.'} icon={filter === 'Unread' ? 'check-circle' : 'search'} />}
    ListFooterComponent={filtered.length > 0 ? <View style={styles.footer}><Icon name="heart" size={12} color={colors.muted} /><Text style={[styles.footerText, { color: colors.secondary }]}>A little closer, wherever you are.</Text></View> : null} />;
}

const styles = StyleSheet.create({
  brandRow: { paddingHorizontal: space.xl, paddingTop: space.xl, paddingBottom: space.xxl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profile: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  titleRow: { paddingHorizontal: space.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.xs },
  title: { ...type.largeTitle, letterSpacing: -1.2 },
  subtitle: { ...type.subhead, marginTop: space.xxs },
  search: { paddingHorizontal: space.xl, marginTop: space.xl },
  peopleSection: { marginTop: space.xl },
  sectionHeading: { paddingHorizontal: space.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...type.footnote, fontWeight: '600' },
  live: { flexDirection: 'row', alignItems: 'center', gap: space.xxs },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { ...type.footnote },
  people: { paddingHorizontal: space.lg, paddingTop: space.md, gap: space.md, paddingBottom: space.xl },
  person: { width: 64, alignItems: 'center', gap: space.xs },
  avatarRing: { padding: space.xxs, borderWidth: 1, borderRadius: 24 },
  personName: { ...type.caption1 },
  filtersRow: { marginHorizontal: space.xl, paddingTop: space.xxs, paddingBottom: space.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  filters: { flexDirection: 'row', gap: space.xxs },
  filter: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.md, minHeight: 44, borderRadius: 12, overflow: 'hidden' },
  filterText: { ...type.subhead, fontWeight: '600' },
  filterCount: { ...type.footnote },
  listLabel: { paddingHorizontal: space.xl, paddingTop: space.lg, paddingBottom: space.xs, flexDirection: 'row', alignItems: 'center', gap: space.xs },
  listLabelText: { ...type.footnote, fontWeight: '500' },
  footer: { paddingHorizontal: space.xl, paddingTop: space.xl, paddingBottom: space.xl, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: space.xs },
  footerText: { ...type.caption1 },
});
