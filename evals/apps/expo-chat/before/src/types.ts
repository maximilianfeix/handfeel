export type Tab = 'messages' | 'contacts' | 'settings';
export type Filter = 'All' | 'Unread' | 'Groups';
export type IconName = import('react').ComponentProps<typeof import('@expo/vector-icons').Feather>['name'];

export interface Contact {
  id: string;
  name: string;
  initials: string;
  color: string;
  photo?: string;
  online: boolean;
  about: string;
}

export interface Message {
  id: string;
  text: string;
  mine: boolean;
  time: string;
  kind?: 'text' | 'place';
}

export interface Conversation {
  id: string;
  contactId: string;
  group?: boolean;
  members?: number;
  pinned?: boolean;
  unread: number;
  time: string;
  messages: Message[];
}

export interface Preferences {
  darkMode: boolean;
  showTimestamps: boolean;
  onlineStatus: boolean;
  name: string;
  about: string;
}
