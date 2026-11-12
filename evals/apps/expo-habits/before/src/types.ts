export type Habit = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: string; // YYYY-MM-DD
  completions: string[]; // YYYY-MM-DD
};

export type ThemeMode = 'system' | 'light' | 'dark';

export type Settings = {
  themeMode: ThemeMode;
  haptics: boolean;
};
