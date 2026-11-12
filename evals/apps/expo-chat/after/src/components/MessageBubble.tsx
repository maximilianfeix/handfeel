import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useApp } from '../state/AppContext';
import { Contact, Message } from '../types';
import { Avatar, Icon } from './ui';

export function MessageBubble({ message, contact, grouped }: { message: Message; contact: Contact; grouped: boolean }) {
  const { colors, preferences } = useApp();
  return <View style={[styles.row, { justifyContent: message.mine ? 'flex-end' : 'flex-start', marginTop: grouped ? 6 : 20 }]}>
    {!message.mine && <View style={styles.avatar}>{!grouped && <Avatar contact={contact} size={28} />}</View>}
    <View style={styles.messageColumn}>
      {message.kind === 'place' ? <View style={[styles.place, { backgroundColor: colors.incoming, borderColor: colors.line }]}>
        <View style={[styles.placeArt, { backgroundColor: colors.selected }]}>
          <View style={[styles.placeCircle, { backgroundColor: colors.lime }]}><Icon name="coffee" size={34} color="#245C49" /></View>
          <View style={[styles.placeTag, { backgroundColor: colors.surface }]}><Icon name="map-pin" size={11} color={colors.greenText} /><Text style={{ color: colors.greenText, fontSize: 10, fontWeight: '600' }}>Our next little plan</Text></View>
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
  avatar: { width: 28, marginTop: 4 },
  messageColumn: { maxWidth: '79%', flexShrink: 1 },
  bubble: { paddingHorizontal: 17, paddingVertical: 13, borderRadius: 19 },
  received: { borderTopLeftRadius: 5 },
  sent: { borderBottomRightRadius: 5 },
  body: { fontSize: 14, lineHeight: 22 },
  meta: { flexDirection: 'row', gap: 4, alignItems: 'center', marginTop: 6, marginHorizontal: 3 },
  time: { fontSize: 10 },
  place: { width: 255, maxWidth: '100%', borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  placeArt: { height: 116, alignItems: 'center', justifyContent: 'center' },
  placeCircle: { width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  placeTag: { position: 'absolute', left: 12, bottom: 10, flexDirection: 'row', gap: 5, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  placeBody: { padding: 14, gap: 6 },
  placeTitle: { fontSize: 15, fontWeight: '600', letterSpacing: -0.3 },
  placeDescription: { fontSize: 11, lineHeight: 17 },
  placeTime: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  placeTimeText: { fontSize: 11, fontWeight: '500' },
});
