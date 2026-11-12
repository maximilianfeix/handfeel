import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useApp } from '../state/AppContext';
import { IconName } from '../types';
import { space, type } from '../theme';
import { haptics } from '../haptics';
import { Brand, Icon, pressedOpacity, SectionLabel } from '../components/ui';
import { Dialog } from '../components/Dialog';

function SettingRow({ icon, title, subtitle, value, onToggle, onPress, danger }: { icon: IconName; title: string; subtitle?: string; value?: boolean; onToggle?: (value: boolean) => void; onPress?: () => void; danger?: boolean }) {
  const { colors } = useApp();
  const content = <><View style={[styles.settingIcon, { backgroundColor: colors.soft }]}><Icon name={icon} size={20} color={danger ? colors.danger : colors.greenText} /></View><View style={styles.settingCopy}><Text style={[styles.settingTitle, { color: danger ? colors.danger : colors.text }]}>{title}</Text>{subtitle && <Text style={[styles.settingSubtitle, { color: colors.secondary }]}>{subtitle}</Text>}</View>{onToggle ? <Switch accessibilityLabel={title} value={value} onValueChange={onToggle} trackColor={{ false: colors.line, true: colors.green }} thumbColor={Platform.OS === 'android' ? colors.onGreen : undefined} ios_backgroundColor={colors.line} /> : <Icon name="chevron-right" size={18} color={colors.secondary} />}</>;
  return onPress ? <Pressable accessibilityRole="button" onPress={onPress} android_ripple={{ color: colors.ripple }} style={({ pressed }) => [styles.setting, { opacity: pressedOpacity(pressed) }]}>{content}</Pressable> : <View style={styles.setting}>{content}</View>;
}

export function SettingsScreen() {
  const { colors, preferences, updatePreferences, clearHistory, storageError } = useApp();
  const [dialog, setDialog] = useState<'profile' | 'privacy' | 'about' | 'clear' | null>(null);
  const [name, setName] = useState(preferences.name);
  const [about, setAbout] = useState(preferences.about);
  const [notice, setNotice] = useState('');
  const title = dialog === 'profile' ? 'Make yourself at home' : dialog === 'privacy' ? 'Your space, your data' : dialog === 'clear' ? 'Clear all messages?' : 'A little about Gather';
  const initials = preferences.name.split(' ').map(part => part[0]).slice(0, 2).join('');

  return <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Brand small /><Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Your space.</Text><Text style={[styles.subtitle, { color: colors.secondary }]}>Just the way you like it.</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Edit your profile" onPress={() => { setName(preferences.name); setAbout(preferences.about); setDialog('profile'); }} android_ripple={{ color: colors.ripple }} style={({ pressed }) => [styles.profile, { backgroundColor: colors.selected, opacity: pressedOpacity(pressed) }]}>
      <View style={[styles.profileAvatar, { backgroundColor: colors.green }]}><Text style={[styles.initials, { color: colors.onGreen }]} maxFontSizeMultiplier={1.4}>{initials}</Text></View>
      <View style={{ flex: 1, gap: space.xxs }}><Text style={[styles.profileName, { color: colors.text }]}>{preferences.name}</Text><Text numberOfLines={2} style={[styles.profileAbout, { color: colors.secondary }]}>{preferences.about}</Text><Text style={[styles.editLabel, { color: colors.greenText }]}>Edit profile</Text></View>
      <Icon name="edit-2" size={16} color={colors.greenText} />
    </Pressable>
    {notice ? <Text accessibilityLiveRegion="polite" style={[styles.notice, { color: colors.greenText }]}>{notice}</Text> : null}
    {storageError && <Text accessibilityRole="alert" style={[styles.notice, { color: colors.danger }]}>{storageError}</Text>}
    <SectionLabel>Make it yours</SectionLabel>
    <SettingRow icon="smartphone" title="Match system appearance" subtitle="Light or dark, the same as your phone" value={preferences.followSystemAppearance} onToggle={followSystemAppearance => updatePreferences({ followSystemAppearance })} />
    {!preferences.followSystemAppearance && <SettingRow icon="moon" title="Dark appearance" subtitle="A softer glow for late-night chats" value={preferences.darkMode} onToggle={darkMode => updatePreferences({ darkMode })} />}
    <SettingRow icon="clock" title="Message timestamps" subtitle="Show when each message was written" value={preferences.showTimestamps} onToggle={showTimestamps => updatePreferences({ showTimestamps })} />
    <SettingRow icon="activity" title="Online indicators" subtitle="Show availability in the demo contacts" value={preferences.onlineStatus} onToggle={onlineStatus => updatePreferences({ onlineStatus })} />
    <View style={[styles.divider, { backgroundColor: colors.line }]} />
    <SectionLabel>Good to know</SectionLabel>
    <SettingRow icon="hard-drive" title="Data & privacy" subtitle="Understand what stays on this device" onPress={() => setDialog('privacy')} />
    <SettingRow icon="heart" title="About Gather" subtitle="A little closer, wherever you are" onPress={() => setDialog('about')} />
    <View style={[styles.divider, { backgroundColor: colors.line }]} />
    <SectionLabel>A fresh start</SectionLabel>
    <SettingRow icon="trash-2" title="Clear message history" subtitle="Remove all messages from this device" danger onPress={() => setDialog('clear')} />
    <View style={styles.footer}><Brand small /><Text style={[styles.footerText, { color: colors.secondary }]}>Made for the everyday hellos.</Text><Text style={[styles.version, { color: colors.secondary }]}>Version 1.0.0 · Local demo</Text></View>
    <Dialog visible={dialog !== null} title={title} onClose={() => setDialog(null)}>
      {dialog === 'profile' ? <>
        <Text style={[styles.fieldLabel, { color: colors.secondary }]}>Your name</Text>
        {/* These fields live in Dialog, which wraps its content in a KeyboardAvoidingView. */}
        {/* handfeel-ignore-next-line keyboard-covers-input */}
        <TextInput autoFocus accessibilityLabel="Your name" value={name} onChangeText={setName} maxLength={40} placeholder="Your name" placeholderTextColor={colors.secondary} style={[styles.field, { color: colors.text, backgroundColor: colors.soft }]} />
        <Text style={[styles.fieldLabel, { color: colors.secondary }]}>A little about you</Text><TextInput accessibilityLabel="About you" value={about} onChangeText={setAbout} maxLength={120} multiline style={[styles.field, styles.aboutField, { color: colors.text, backgroundColor: colors.soft }]} />
        <Pressable accessibilityRole="button" disabled={!name.trim()} onPress={() => { updatePreferences({ name: name.trim(), about: about.trim() }); haptics.success(); setDialog(null); setNotice('Your profile is updated.'); }} android_ripple={{ color: colors.ripple }} style={({ pressed }) => [styles.button, { backgroundColor: colors.green, opacity: name.trim() ? pressedOpacity(pressed, 0.8) : 0.45 }]}><Text style={[styles.buttonText, { color: colors.onGreen }]}>Save profile</Text></Pressable>
      </> : dialog === 'clear' ? <>
        <Text style={[styles.dialogText, { color: colors.secondary }]}>This removes every message, including the sample conversations and anything you’ve written. Your contacts and profile stay. This action can’t be undone.</Text>
        <Pressable accessibilityRole="button" onPress={() => { clearHistory(); haptics.success(); setDialog(null); setNotice('Message history cleared. Ready for a fresh hello.'); }} android_ripple={{ color: colors.ripple }} style={({ pressed }) => [styles.button, { backgroundColor: colors.dangerFill, opacity: pressedOpacity(pressed, 0.8) }]}><Text style={[styles.buttonText, { color: colors.onDanger }]}>Clear all messages</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => setDialog(null)} android_ripple={{ color: colors.ripple }} style={({ pressed }) => [styles.cancel, { opacity: pressedOpacity(pressed) }]}><Text style={[type.body, { color: colors.text, fontWeight: '500' }]}>Keep my messages</Text></Pressable>
      </> : <>
        <View style={[styles.dialogIcon, { backgroundColor: colors.selected }]}><Icon name={dialog === 'privacy' ? 'hard-drive' : 'heart'} size={32} color={colors.greenText} /></View>
        <Text style={[styles.dialogText, { color: colors.secondary }]}>{dialog === 'privacy' ? 'Gather is a local messaging demo. Messages, your display name, and preferences are saved in app storage on this device. They are not sent to a chat server, and this storage is not encrypted. Avoid entering sensitive information.\n\nContact photos load from Unsplash. The names, availability, and sample conversations are fictional.' : 'Gather is a small space for the people who make your everyday a little better. Built with Expo, React Native, and a love for the simple hello.\n\nThis demo lets you explore conversations, write messages, find contacts, and make the app your own. Real-time delivery and accounts are not connected.'}</Text>
      </>}
    </Dialog>
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: space.xl },
  header: { padding: space.xl },
  title: { ...type.largeTitle, letterSpacing: -1, marginTop: space.xxl },
  subtitle: { ...type.subhead, marginTop: space.xs },
  profile: { marginHorizontal: space.xl, padding: space.md, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: space.sm, overflow: 'hidden' },
  profileAvatar: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  initials: { ...type.headline, fontWeight: '500' },
  profileName: { ...type.headline },
  profileAbout: { ...type.footnote },
  editLabel: { ...type.footnote, fontWeight: '600', marginTop: space.xxs },
  setting: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.xl, paddingVertical: space.md, minHeight: 76 },
  settingIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingCopy: { flex: 1, gap: space.xxs },
  settingTitle: { ...type.body, fontWeight: '500' },
  settingSubtitle: { ...type.footnote },
  divider: { height: 1, marginHorizontal: space.xl, marginTop: space.md },
  footer: { alignItems: 'center', marginTop: space.xxxl, gap: space.sm },
  footerText: { ...type.footnote },
  version: { ...type.caption1 },
  notice: { ...type.footnote, paddingHorizontal: space.xl, paddingTop: space.md },
  fieldLabel: { ...type.footnote, fontWeight: '500' },
  field: { padding: space.md, borderRadius: 12, ...type.body, minHeight: 48 },
  aboutField: { minHeight: 80, textAlignVertical: 'top' },
  button: { minHeight: 52, paddingVertical: space.md, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: space.xxs, overflow: 'hidden' },
  buttonText: { ...type.headline },
  cancel: { alignItems: 'center', justifyContent: 'center', minHeight: 48, padding: space.sm },
  dialogText: { ...type.body, lineHeight: 24 },
  dialogIcon: { width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: space.xxs },
});
