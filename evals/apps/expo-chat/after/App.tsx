import React, { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from './src/state/AppContext';
import { Tab } from './src/types';
import { Brand, EmptyState, pressedOpacity } from './src/components/ui';
import { space, type } from './src/theme';
import { TabBar } from './src/components/TabBar';
import { ConversationsScreen } from './src/screens/ConversationsScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { ContactsScreen } from './src/screens/ContactsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

function GatherApp() {
  const { colors, scheme, openConversation, hydrated } = useApp();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [tab, setTab] = useState<Tab>('messages');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedId && !wide) { setSelectedId(null); return true; }
      if (tab !== 'messages') { setTab('messages'); setComposing(false); return true; }
      return false;
    });
    return () => listener.remove();
  }, [selectedId, tab, wide]);

  const open = (id: string) => { openConversation(id); setSelectedId(id); setTab('messages'); setComposing(false); };
  const changeTab = (next: Tab) => { setTab(next); setComposing(false); if (!wide) setSelectedId(null); };
  const compose = () => { setTab('contacts'); setComposing(true); };
  const inbox = <ConversationsScreen onOpen={open} onCompose={compose} selectedId={wide ? selectedId : null} />;
  const contacts = <ContactsScreen onOpen={open} composing={composing} />;

  if (!hydrated) return <View style={[styles.loading, { backgroundColor: colors.background }]}><Brand /><ActivityIndicator color={colors.greenText} style={{ marginTop: space.xl }} /><Text style={[type.footnote, { color: colors.secondary, marginTop: space.sm }]}>Making room for your people…</Text></View>;

  return <SafeAreaView style={[styles.safe, { backgroundColor: wide ? colors.soft : colors.surface }]}>
    <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    <View style={[styles.frame, wide && styles.wideFrame, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      {wide ? <>
        <View style={[styles.sidebar, { borderRightColor: colors.line }]}>{tab === 'contacts' ? contacts : inbox}<TabBar active={tab} onChange={changeTab} /></View>
        <View style={styles.detail}>{tab === 'settings' ? <SettingsScreen /> : selectedId ? <ChatScreen key={selectedId} id={selectedId} onBack={() => setSelectedId(null)} wide /> : <WelcomePanel onOpen={() => open('maya')} />}</View>
      </> : selectedId && tab === 'messages' ? <ChatScreen key={selectedId} id={selectedId} onBack={() => setSelectedId(null)} wide={false} /> : <View style={styles.mobile}>
        {tab === 'messages' ? inbox : tab === 'contacts' ? contacts : <SettingsScreen />}
        <TabBar active={tab} onChange={changeTab} />
      </View>}
    </View>
  </SafeAreaView>;
}

function WelcomePanel({ onOpen }: { onOpen: () => void }) {
  const { colors } = useApp();
  return <View style={[styles.welcome, { backgroundColor: colors.background }]}>
    <View style={[styles.welcomeMark, { backgroundColor: colors.selected }]}><Brand /></View>
    <Text style={[styles.welcomeTitle, { color: colors.text }]}>Less distance.{'\n'}More connection.</Text>
    <EmptyState title="Make room for a little hello." description="Pick a conversation on the left to catch up, make plans, or just make someone’s day." />
    <WelcomeButton onPress={onOpen} />
    <Text style={[styles.welcomeNote, { color: colors.secondary }]}>Your people are what make it Gather.</Text>
  </View>;
}

function WelcomeButton({ onPress }: { onPress: () => void }) {
  const { colors } = useApp();
  return <Pressable accessibilityRole="button" onPress={onPress} android_ripple={{ color: colors.ripple }} style={({ pressed }) => [styles.welcomeButton, { backgroundColor: colors.green, opacity: pressedOpacity(pressed, 0.8) }]}><Text style={[type.headline, { color: colors.onGreen }]}>Say hello to Maya</Text></Pressable>;
}

export default function App() {
  return <SafeAreaProvider><AppProvider><GatherApp /></AppProvider></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { width: '100%', flex: 1, overflow: 'hidden' },
  wideFrame: { maxWidth: 1200, flexDirection: 'row', borderWidth: 1, borderRadius: 24, marginVertical: space.xl, width: '94%' },
  sidebar: { width: 390, borderRightWidth: 1 },
  detail: { flex: 1, minWidth: 0 },
  mobile: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  welcome: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxxl },
  welcomeMark: { padding: space.xl, borderRadius: 28, marginBottom: space.xxl },
  welcomeTitle: { ...type.largeTitle, textAlign: 'center', letterSpacing: -1 },
  welcomeButton: { borderRadius: 12, paddingHorizontal: space.xl, paddingVertical: space.md, minHeight: 52, justifyContent: 'center', overflow: 'hidden' },
  welcomeNote: { ...type.footnote, marginTop: space.xxl },
});
