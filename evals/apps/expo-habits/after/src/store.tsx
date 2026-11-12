import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { todayKey } from './dates';
import type { Habit, Settings } from './types';

const HABITS_KEY = 'habitly.habits.v1';
const SETTINGS_KEY = 'habitly.settings.v1';

const defaultSettings: Settings = { themeMode: 'system', haptics: true };

type Store = {
  ready: boolean;
  habits: Habit[];
  settings: Settings;
  addHabit: (input: { name: string; emoji: string; color: string }) => void;
  deleteHabit: (id: string) => void;
  toggleToday: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [h, s] = await Promise.all([
          AsyncStorage.getItem(HABITS_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
        ]);
        if (h) setHabits(JSON.parse(h));
        if (s) setSettings({ ...defaultSettings, ...JSON.parse(s) });
      } catch {
        // fall back to defaults
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits)).catch(() => {});
  }, [habits, ready]);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(() => {});
  }, [settings, ready]);

  const addHabit = useCallback((input: { name: string; emoji: string; color: string }) => {
    const habit: Habit = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: input.name.trim(),
      emoji: input.emoji,
      color: input.color,
      createdAt: todayKey(),
      completions: [],
    };
    setHabits((prev) => [...prev, habit]);
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const toggleToday = useCallback((id: string) => {
    const key = todayKey();
    setHabits((prev) =>
      prev.map((h) =>
        h.id !== id
          ? h
          : {
              ...h,
              completions: h.completions.includes(key)
                ? h.completions.filter((c) => c !== key)
                : [...h.completions, key],
            },
      ),
    );
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetAll = useCallback(() => setHabits([]), []);

  const value = useMemo(
    () => ({ ready, habits, settings, addHabit, deleteHabit, toggleToday, updateSettings, resetAll }),
    [ready, habits, settings, addHabit, deleteHabit, toggleToday, updateSettings, resetAll],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}
