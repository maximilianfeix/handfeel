import React, { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { contacts } from '../data';
import { useApp } from '../state/AppContext';
import { Message } from '../types';
import { Avatar, EmptyState, Icon, IconButton, SearchField } from '../components/ui';
import { MessageBubble } from '../components/MessageBubble';

export function ChatScreen({ id, onBack, wide }: { id: string; onBack: () => void; wide: boolean }) {
  const { colors, conversations, sendMessage, preferences } = useApp();
  const conversation = conversations.find(item => item.id === id);
  const contact = contacts.find(item => item.id === conversation?.contactId);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [emojisOpen, setEmojisOpen] = useState(false);
  const list = useRef<FlatList<Message>>(null);
  const input = useRef<TextInput>(null);
  if (!conversation || !contact) return <EmptyState title="Choose your people" description="Open a conversation to pick up where you left off." />;
  const messages = conversation.messages.filter(message => !searching || message.text.toLowerCase().includes(search.toLowerCase()));
  const submit = () => {
    if (!draft.trim()) return;
    sendMessage(id, draft);
    setDraft('');
    setEmojisOpen(false);
    if (searching) { setSearching(false); setSearch(''); }
    input.current?.focus();
  };

  return <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
      {!wide && <Pressable accessibilityRole="button" accessibilityLabel="Back to messages" onPress={onBack} style={styles.back}><Icon name="chevron-left" size={25} /></Pressable>}
      <Avatar contact={contact} size={44} />
      <Pressable accessibilityRole="button" accessibilityLabel={`Conversation details for ${contact.name}`} accessibilityState={{ expanded: infoOpen }} onPress={() => setInfoOpen(!infoOpen)} style={styles.headerText}><Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>{contact.name}</Text>
        <View style={styles.status}>{contact.online && preferences.onlineStatus && <View style={[styles.onlineDot, { backgroundColor: colors.online }]} />}<Text numberOfLines={1} style={[styles.statusText, { color: colors.secondary }]}>{conversation.group ? `${conversation.members} people, one good conversation` : contact.online && preferences.onlineStatus ? 'Around right now' : 'A little closer on Gather'}</Text></View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={searching ? 'Close message search' : 'Search this conversation'} onPress={() => { setSearching(!searching); setSearch(''); }} style={styles.headerAction}><Icon name={searching ? 'x' : 'search'} size={19} color={colors.secondary} /></Pressable>
    </View>
    {searching && <View style={[styles.search, { backgroundColor: colors.surface }]}><SearchField value={search} onChangeText={setSearch} placeholder="Find something in this chat" /></View>}
    {infoOpen && <View style={[styles.info, { backgroundColor: colors.selected }]}><Icon name={conversation.group ? 'users' : 'info'} size={18} color={colors.greenText} /><View style={{ flex: 1 }}><Text style={[styles.infoName, { color: colors.text }]}>{contact.name}</Text><Text style={[styles.infoAbout, { color: colors.secondary }]}>{contact.about}</Text></View><Pressable onPress={() => setInfoOpen(false)} accessibilityLabel="Close details" accessibilityRole="button" hitSlop={12}><Icon name="x" size={18} /></Pressable></View>}
    <FlatList ref={list} data={messages} keyExtractor={item => item.id} style={styles.list} contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
      onContentSizeChange={() => { if (!searching) list.current?.scrollToEnd({ animated: false }); }}
      ListHeaderComponent={messages.length ? <View style={styles.day}><View style={[styles.rule, { backgroundColor: colors.line }]} /><Text style={[styles.dayText, { color: colors.secondary }]}>{searching ? `${messages.length} matching messages` : 'The conversation so far'}</Text><View style={[styles.rule, { backgroundColor: colors.line }]} /></View> : null}
      renderItem={({ item, index }) => <MessageBubble message={item} contact={contact} grouped={index > 0 && messages[index - 1]?.mine === item.mine} />}
      ListEmptyComponent={<EmptyState icon={searching ? 'search' : 'sun'} title={searching ? 'No matching messages' : `Say hello to ${contact.name.split(' ')[0]}`} description={searching ? 'Try a different word or close search to see the conversation.' : 'A quick hello can make someone’s day. Send the first message below.'} />} />
    <View style={[styles.composerSection, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
      {emojisOpen && <View style={styles.emojiRow}>{['👋', '🤍', '🌿', '☕', '✨', '🙌'].map(emoji => <Pressable key={emoji} accessibilityRole="button" accessibilityLabel={`Add ${emoji}`} onPress={() => setDraft(previous => previous + emoji)} style={styles.emojiButton}><Text style={styles.emoji}>{emoji}</Text></Pressable>)}</View>}
      <View style={[styles.composer, { backgroundColor: colors.soft }]}>
        <Pressable onPress={() => setEmojisOpen(!emojisOpen)} accessibilityRole="button" accessibilityLabel="Choose an emoji" accessibilityState={{ expanded: emojisOpen }} style={styles.emojiToggle}><Icon name="smile" size={22} color={colors.secondary} /></Pressable>
        <TextInput ref={input} value={draft} onChangeText={setDraft} multiline maxLength={4000} placeholder="Write a little hello…" placeholderTextColor={colors.secondary} accessibilityLabel="Message" style={[styles.input, { color: colors.text }]}
          onKeyPress={event => {
            if (Platform.OS === 'web' && event.nativeEvent.key === 'Enter' && !(event.nativeEvent as unknown as { shiftKey: boolean }).shiftKey) { event.preventDefault(); submit(); }
          }} />
        <IconButton icon="arrow-up" label="Send message" onPress={submit} filled disabled={!draft.trim()} size={38} />
      </View>
      <View style={styles.localNote}><Icon name="hard-drive" size={10} color={colors.secondary} /><Text style={[styles.noteText, { color: colors.secondary }]}>A local demo. Messages stay on this device.</Text></View>
    </View>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { minHeight: 90, paddingHorizontal: 20, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1 },
  back: { minWidth: 24, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -10 },
  headerText: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  statusText: { fontSize: 11, flexShrink: 1 },
  onlineDot: { width: 5, height: 5, borderRadius: 3 },
  headerAction: { minWidth: 32, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  search: { paddingHorizontal: 24, paddingBottom: 16 },
  info: { padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoName: { fontSize: 13, fontWeight: '600' },
  infoAbout: { fontSize: 12, marginTop: 5 },
  list: { flex: 1 },
  messages: { paddingHorizontal: 24, paddingBottom: 28, paddingTop: 20, flexGrow: 1 },
  day: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15, paddingVertical: 12, marginBottom: 10 },
  dayText: { fontSize: 10 },
  rule: { height: 1, width: 42 },
  composerSection: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, borderTopWidth: 1 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', padding: 7, borderRadius: 19, gap: 6 },
  input: { flex: 1, fontSize: 14, paddingVertical: 10, paddingHorizontal: 2, minHeight: 38, maxHeight: 120, lineHeight: 20 },
  emojiToggle: { width: 34, height: 38, alignItems: 'center', justifyContent: 'center' },
  localNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 11 },
  noteText: { fontSize: 9 },
  emojiRow: { flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 16 },
  emojiButton: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
});
