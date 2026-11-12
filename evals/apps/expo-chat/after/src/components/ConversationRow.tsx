import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { contacts } from '../data';
import { useApp } from '../state/AppContext';
import { Conversation } from '../types';
import { space, type } from '../theme';
import { Avatar, Icon, isAndroid } from './ui';

export function ConversationRow({ conversation, selected, onPress }: { conversation: Conversation; selected: boolean; onPress: () => void }) {
  const { colors } = useApp();
  const contact = contacts.find(item => item.id === conversation.contactId);
  if (!contact) return null;
  const last = conversation.messages[conversation.messages.length - 1];
  const preview = last?.kind === 'place' ? 'A little Sunday coffee? 🌿' : last?.text;
  return <Pressable accessibilityRole="button" accessibilityLabel={`${contact.name}, ${conversation.unread ? `${conversation.unread} unread messages, ` : ''}${preview ?? 'Start a conversation'}`} accessibilityState={{ selected }} onPress={onPress}
    android_ripple={{ color: colors.ripple }}
    style={({ pressed }) => [styles.row, { backgroundColor: selected ? colors.selected : pressed && !isAndroid ? colors.pressed : 'transparent' }]}>
    <Avatar contact={contact} showOnline />
    <View style={styles.content}>
      <View style={styles.line}>
        <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>{contact.name}</Text>
        <Text style={[styles.time, { color: conversation.unread ? colors.greenText : colors.secondary }]}>{conversation.time}</Text>
      </View>
      <View style={[styles.line, { marginTop: space.xxs }]}>
        <View style={styles.preview}>
          {last?.mine && <Icon name="check" size={14} color={colors.secondary} />}
          <Text numberOfLines={1} style={[styles.message, { color: conversation.unread ? colors.text : colors.secondary, fontWeight: conversation.unread ? '500' : '400' }]}>{preview ?? 'Say hello and start something good.'}</Text>
        </View>
        {conversation.unread > 0 ? <View style={[styles.badge, { backgroundColor: colors.green }]}><Text style={[styles.badgeText, { color: colors.onGreen }]} maxFontSizeMultiplier={1.6}>{conversation.unread}</Text></View>
          : conversation.pinned ? <Icon name="bookmark" size={14} color={colors.muted} /> : null}
      </View>
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginHorizontal: space.sm, paddingHorizontal: space.sm, paddingVertical: space.md, borderRadius: 16, minHeight: 88, overflow: 'hidden' },
  content: { flex: 1 },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.xs },
  name: { ...type.headline, flexShrink: 1 },
  time: { ...type.subhead },
  preview: { flexDirection: 'row', alignItems: 'center', gap: space.xxs, flex: 1 },
  message: { ...type.subhead, flex: 1 },
  badge: { minWidth: 20, minHeight: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xxs },
  badgeText: { ...type.caption2, fontWeight: '600' },
});
