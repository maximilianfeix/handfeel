import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { contacts } from '../data';
import { useApp } from '../state/AppContext';
import { Conversation } from '../types';
import { Avatar, Icon } from './ui';

export function ConversationRow({ conversation, selected, onPress }: { conversation: Conversation; selected: boolean; onPress: () => void }) {
  const { colors } = useApp();
  const contact = contacts.find(item => item.id === conversation.contactId);
  if (!contact) return null;
  const last = conversation.messages[conversation.messages.length - 1];
  const preview = last?.kind === 'place' ? 'A little Sunday coffee? 🌿' : last?.text;
  return <Pressable accessibilityRole="button" accessibilityLabel={`${contact.name}, ${conversation.unread ? `${conversation.unread} unread messages, ` : ''}${preview ?? 'Start a conversation'}`} accessibilityState={{ selected }} onPress={onPress}
    style={({ pressed }) => [styles.row, { backgroundColor: selected ? colors.selected : pressed ? colors.soft : 'transparent' }]}>
    <Avatar contact={contact} showOnline />
    <View style={styles.content}>
      <View style={styles.line}>
        <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>{contact.name}</Text>
        <Text style={[styles.time, { color: conversation.unread ? colors.greenText : colors.secondary }]}>{conversation.time}</Text>
      </View>
      <View style={[styles.line, { marginTop: 7 }]}>
        <View style={styles.preview}>
          {last?.mine && <Icon name="check" size={14} color={colors.secondary} />}
          <Text numberOfLines={1} style={[styles.message, { color: conversation.unread ? colors.text : colors.secondary, fontWeight: conversation.unread ? '500' : '400' }]}>{preview ?? 'Say hello and start something good.'}</Text>
        </View>
        {conversation.unread > 0 ? <View style={[styles.badge, { backgroundColor: colors.green }]}><Text style={styles.badgeText}>{conversation.unread}</Text></View>
          : conversation.pinned ? <Icon name="bookmark" size={13} color={colors.muted} /> : null}
      </View>
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 12, paddingHorizontal: 12, paddingVertical: 16, borderRadius: 16, minHeight: 88 },
  content: { flex: 1 },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { fontSize: 15, fontWeight: '600', flexShrink: 1, letterSpacing: -0.2 },
  time: { fontSize: 11, fontWeight: '500' },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  message: { fontSize: 13, flex: 1, lineHeight: 19 },
  badge: { minWidth: 21, height: 21, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
});
