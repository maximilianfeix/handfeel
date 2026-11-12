import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { contacts, initialConversations } from '../data';
import { Conversation, Message, Preferences } from '../types';
import { Colors, darkColors, lightColors } from '../theme';

const STORAGE_KEY = 'gather:v1';
const defaults: Preferences = { darkMode: false, showTimestamps: true, onlineStatus: true, name: 'Alex Morgan', about: 'Here for the good conversations.' };

interface AppState {
  conversations: Conversation[];
  preferences: Preferences;
  colors: Colors;
  hydrated: boolean;
  storageError: string | null;
  unreadCount: number;
  updatePreferences: (values: Partial<Preferences>) => void;
  openConversation: (id: string) => void;
  sendMessage: (id: string, text: string) => void;
  clearHistory: () => void;
}

const Context = createContext<AppState | null>(null);

function isConversation(value: unknown): value is Conversation {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<Conversation>;
  return typeof item.id === 'string' && contacts.some(c => c.id === item.contactId)
    && typeof item.unread === 'number' && typeof item.time === 'string'
    && Array.isArray(item.messages) && item.messages.every(message =>
      message && typeof message.id === 'string' && typeof message.text === 'string'
      && typeof message.mine === 'boolean' && typeof message.time === 'string');
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState(initialConversations);
  const [preferences, setPreferences] = useState(defaults);
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!mounted || !raw) return;
      const saved: unknown = JSON.parse(raw);
      if (!saved || typeof saved !== 'object') throw new Error('Invalid saved data');
      const data = saved as { conversations?: unknown; preferences?: Partial<Preferences> };
      if (Array.isArray(data.conversations) && data.conversations.every(isConversation)) setConversations(data.conversations);
      const p = data.preferences;
      if (p && Object.keys(defaults).every(key => typeof p[key as keyof Preferences] === typeof defaults[key as keyof Preferences])) {
        setPreferences({ ...defaults, ...p });
      }
    }).catch(() => { if (mounted) setStorageError('Saved data could not be loaded. This session still works.'); })
      .finally(() => { if (mounted) setHydrated(true); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    // Coalesce rapid edits before persisting a snapshot.
    const timeout = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ conversations, preferences }))
        .catch(() => setStorageError('Changes could not be saved on this device.'));
    }, 300);
    return () => clearTimeout(timeout);
  }, [conversations, preferences, hydrated]);

  const value = useMemo<AppState>(() => ({
    conversations, preferences, hydrated, storageError,
    colors: preferences.darkMode ? darkColors : lightColors,
    unreadCount: conversations.reduce((sum, item) => sum + item.unread, 0),
    updatePreferences: values => setPreferences(previous => ({ ...previous, ...values })),
    openConversation: id => setConversations(previous => {
      const existing = previous.find(item => item.id === id);
      if (existing) return previous.map(item => item.id === id ? { ...item, unread: 0 } : item);
      if (!contacts.some(contact => contact.id === id)) return previous;
      return [{ id, contactId: id, unread: 0, time: 'Now', messages: [] }, ...previous];
    }),
    sendMessage: (id, text) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const message: Message = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text: trimmed, mine: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setConversations(previous => previous.map(item => item.id === id
        ? { ...item, time: 'Now', messages: [...item.messages, message] } : item));
    },
    clearHistory: () => setConversations(previous => previous.map(item => ({ ...item, messages: [], unread: 0, time: '' }))),
  }), [conversations, preferences, hydrated, storageError]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useApp() {
  const context = useContext(Context);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
