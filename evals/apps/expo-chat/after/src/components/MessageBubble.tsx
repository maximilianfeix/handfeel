import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useApp } from '../state/AppContext';
import { Contact, Message } from '../types';
import { space, type } from '../theme';
import { Avatar, Icon } from './ui';

export function MessageBubble({ message, contact, grouped }: { message: Message; contact: Contact; grouped: boolean }) {
  const { colors, preferences } = useApp();
  return <View style={[styles.row, { justifyContent: message.mine ? 'flex-end' : 'flex-start', marginTop: grouped ? space.xxs : space.lg }]}>
    {!message.mine && <View style={styles.avatar}>{!grouped && <Avatar contact={contact} size={28} />}</View>}
    <View style={styles.messageColumn}>
      {message.kind === 'place' ? <View style={[styles.place, { backgroundColor: colors.incoming, borderColor: colors.line }]}>
        <View style={[styles.placeArt, { backgroundColor: colors.selected }]}>
          <View style={[styles.placeCircle, { backgroundColor: colors.lime }]}><Icon name="coffee" size={32} color={colors.onLime} /></View>
          <View style={[styles.placeTag, { backgroundColor: colors.surface }]}><Icon name="map-pin" size={12} color={colors.greenText} /><Text style={[type.caption2, { color: colors.greenText, fontWeight: '600' }]}>Our next little plan</Text></View>
        </View>
        <View style={styles.placeBody}><Text style={[styles.placeTitle, { color: colors.text }]}>A little Sunday coffee</Text><Text style={[styles.placeDescription, { color: colors.secondary }]}>Good coffee. Even better company.</Text><View style={styles.placeTime}><Icon name="calendar" size={13} color={colors.greenText} /><Text style={[styles.placeTimeText, { color: colors.greenText }]}>{message.text}</Text></View></View>
      </View> : <View style={[styles.bubble, message.mine ? styles.sent : styles.received, { backgroundColor: message.mine ? colors.green : colors.incoming }]}>
        <Text selectable style={[styles.body, { color: message.mine ? colors.onGreen : colors.text }]}>{message.text}</Text>
      </View>}
      {preferences.showTimestamps && <View style={[styles.meta, { justifyContent: message.mine ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.time, { color: colors.secondary }]}>{message.time}</Text>
        {message.mine && <Icon name="check" size={12} color={colors.secondary} />}
      </View>}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  avatar: { width: 28, marginTop: space.xxs },
  messageColumn: { maxWidth: '79%', flexShrink: 1 },
  bubble: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: 20 },
  received: { borderTopLeftRadius: 4 },
  sent: { borderBottomRightRadius: 4 },
  body: { ...type.body },
  meta: { flexDirection: 'row', gap: space.xxs, alignItems: 'center', marginTop: space.xxs, marginHorizontal: space.xxs },
  time: { ...type.caption2 },
  place: { width: 256, maxWidth: '100%', borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  placeArt: { minHeight: 116, paddingVertical: space.sm, alignItems: 'center', justifyContent: 'center' },
  placeCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: space.xs },
  placeTag: { position: 'absolute', left: space.sm, bottom: space.xs, flexDirection: 'row', gap: space.xxs, alignItems: 'center', paddingHorizontal: space.xs, paddingVertical: space.xxs, borderRadius: 6 },
  placeBody: { padding: space.md, gap: space.xxs },
  placeTitle: { ...type.headline },
  placeDescription: { ...type.footnote },
  placeTime: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.xxs },
  placeTimeText: { ...type.footnote, fontWeight: '500' },
});
