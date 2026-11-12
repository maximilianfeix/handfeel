import React, { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { contacts } from '../data';
import { useApp } from '../state/AppContext';
import { Message } from '../types';
import { space, type } from '../theme';
import { haptics } from '../haptics';
import { Avatar, EmptyState, Icon, IconButton, pressedOpacity, SearchField } from '../components/ui';
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
    haptics.send();
    setDraft('');
    setEmojisOpen(false);
    if (searching) { setSearching(false); setSearch(''); }
    input.current?.focus();
  };

  return <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior="padding">
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
      {!wide && <Pressable accessibilityRole="button" accessibilityLabel="Back to messages" onPress={onBack} android_ripple={{ color: colors.ripple, borderless: true, radius: 22 }} style={({ pressed }) => [styles.back, { opacity: pressedOpacity(pressed) }]}><Icon name="chevron-left" size={24} /></Pressable>}
      <Avatar contact={contact} size={44} />
      <Pressable accessibilityRole="button" accessibilityLabel={`Conversation details for ${contact.name}`} accessibilityState={{ expanded: infoOpen }} onPress={() => setInfoOpen(!infoOpen)} android_ripple={{ color: colors.ripple }} style={({ pressed }) => [styles.headerText, { opacity: pressedOpacity(pressed) }]}><Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>{contact.name}</Text>
        <View style={styles.status}>{contact.online && preferences.onlineStatus && <View style={[styles.onlineDot, { backgroundColor: colors.online }]} />}<Text numberOfLines={1} style={[styles.statusText, { color: colors.secondary }]}>{conversation.group ? `${conversation.members} people, one good conversation` : contact.online && preferences.onlineStatus ? 'Around right now' : 'A little closer on Gather'}</Text></View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={searching ? 'Close message search' : 'Search this conversation'} onPress={() => { setSearching(!searching); setSearch(''); }} android_ripple={{ color: colors.ripple, borderless: true, radius: 22 }} style={({ pressed }) => [styles.headerAction, { opacity: pressedOpacity(pressed) }]}><Icon name={searching ? 'x' : 'search'} size={20} color={colors.secondary} /></Pressable>
    </View>
    {searching && <View style={[styles.search, { backgroundColor: colors.surface }]}><SearchField value={search} onChangeText={setSearch} placeholder="Find something in this chat" /></View>}
    {infoOpen && <View style={[styles.info, { backgroundColor: colors.selected }]}><Icon name={conversation.group ? 'users' : 'info'} size={18} color={colors.greenText} /><View style={{ flex: 1 }}><Text style={[styles.infoName, { color: colors.text }]}>{contact.name}</Text><Text style={[styles.infoAbout, { color: colors.secondary }]}>{contact.about}</Text></View><Pressable onPress={() => setInfoOpen(false)} accessibilityLabel="Close details" accessibilityRole="button" android_ripple={{ color: colors.ripple, borderless: true, radius: 22 }} style={({ pressed }) => [styles.closeInfo, { opacity: pressedOpacity(pressed) }]}><Icon name="x" size={18} /></Pressable></View>}
    <FlatList ref={list} data={messages} keyExtractor={item => item.id} style={styles.list} contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
      onContentSizeChange={() => { if (!searching) list.current?.scrollToEnd({ animated: false }); }}
      ListHeaderComponent={messages.length ? <View style={styles.day}><View style={[styles.rule, { backgroundColor: colors.line }]} /><Text style={[styles.dayText, { color: colors.secondary }]}>{searching ? `${messages.length} matching messages` : 'The conversation so far'}</Text><View style={[styles.rule, { backgroundColor: colors.line }]} /></View> : null}
      renderItem={({ item, index }) => <MessageBubble message={item} contact={contact} grouped={index > 0 && messages[index - 1]?.mine === item.mine} />}
      ListEmptyComponent={<EmptyState icon={searching ? 'search' : 'sun'} title={searching ? 'No matching messages' : `Say hello to ${contact.name.split(' ')[0]}`} description={searching ? 'Try a different word or close search to see the conversation.' : 'A quick hello can make someone’s day. Send the first message below.'} />} />
    <View style={[styles.composerSection, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
      {emojisOpen && <View style={styles.emojiRow}>{['👋', '🤍', '🌿', '☕', '✨', '🙌'].map(emoji => <Pressable key={emoji} accessibilityRole="button" accessibilityLabel={`Add ${emoji}`} onPress={() => setDraft(previous => previous + emoji)} android_ripple={{ color: colors.ripple, borderless: true, radius: 22 }} style={({ pressed }) => [styles.emojiButton, { opacity: pressedOpacity(pressed) }]}><Text style={styles.emoji}>{emoji}</Text></Pressable>)}</View>}
      <View style={[styles.composer, { backgroundColor: colors.soft }]}>
        <Pressable onPress={() => setEmojisOpen(!emojisOpen)} accessibilityRole="button" accessibilityLabel="Choose an emoji" accessibilityState={{ expanded: emojisOpen }} android_ripple={{ color: colors.ripple, borderless: true, radius: 22 }} style={({ pressed }) => [styles.emojiToggle, { opacity: pressedOpacity(pressed) }]}><Icon name="smile" size={24} color={colors.secondary} /></Pressable>
        <TextInput ref={input} value={draft} onChangeText={setDraft} multiline maxLength={4000} placeholder="Write a little hello…" placeholderTextColor={colors.secondary} accessibilityLabel="Message" style={[styles.input, { color: colors.text }]}
          onKeyPress={event => {
            if (Platform.OS === 'web' && event.nativeEvent.key === 'Enter' && !(event.nativeEvent as unknown as { shiftKey: boolean }).shiftKey) { event.preventDefault(); submit(); }
          }} />
        <IconButton icon="arrow-up" label="Send message" onPress={submit} filled disabled={!draft.trim()} size={44} />
      </View>
      <View style={styles.localNote}><Icon name="hard-drive" size={12} color={colors.secondary} /><Text style={[styles.noteText, { color: colors.secondary }]}>A local demo. Messages stay on this device.</Text></View>
    </View>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { minHeight: 88, paddingHorizontal: space.lg, paddingVertical: space.md, flexDirection: 'row', alignItems: 'center', gap: space.xs, borderBottomWidth: 1 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -space.sm },
  headerText: { flex: 1, minHeight: 44, justifyContent: 'center' },
  name: { ...type.headline },
  status: { flexDirection: 'row', alignItems: 'center', gap: space.xxs, marginTop: space.xxs },
  statusText: { ...type.footnote, flexShrink: 1 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  headerAction: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  search: { paddingHorizontal: space.xl, paddingBottom: space.md },
  info: { padding: space.md, paddingRight: space.xs, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  closeInfo: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  infoName: { ...type.subhead, fontWeight: '600' },
  infoAbout: { ...type.footnote, marginTop: space.xxs },
  list: { flex: 1 },
  messages: { paddingHorizontal: space.xl, paddingBottom: space.xl, paddingTop: space.lg, flexGrow: 1 },
  day: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.md, paddingVertical: space.sm, marginBottom: space.xs },
  dayText: { ...type.caption2 },
  rule: { height: 1, width: 40 },
  composerSection: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.sm, borderTopWidth: 1 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', padding: space.xxs, borderRadius: 24, gap: space.xxs },
  input: { flex: 1, ...type.body, paddingVertical: space.sm, paddingHorizontal: space.xxs, minHeight: 44, maxHeight: 120 },
  emojiToggle: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  localNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xxs, marginTop: space.xs },
  noteText: { ...type.caption2 },
  emojiRow: { flexDirection: 'row', justifyContent: 'space-around', paddingBottom: space.md },
  emojiButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: type.title2.fontSize },
});
