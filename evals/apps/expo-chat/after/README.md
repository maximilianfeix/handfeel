# Gather

A modern Expo + React Native messaging demo written in TypeScript. A forest-green palette, expressive avatars, thoughtful spacing, and adaptive layouts keep the focus on conversations.

## Included

- Searchable conversations with pinned chats, unread badges, and All / Unread / Groups filters.
- One-to-one and group chat screens with message bubbles, timestamps, a coffee-plan card, conversation details, emoji picker, and message search.
- A multiline composer with blank-message protection. On web, Enter sends and Shift+Enter inserts a newline.
- Alphabetical contacts, contact search, and an online filter. Selecting a contact opens or creates a conversation.
- Editable profile, dark appearance, online indicators, timestamp preferences, and a confirmation before clearing message history.
- Local persistence with AsyncStorage and initials when remote avatar images are unavailable.
- Mobile navigation, Android back-button support, keyboard avoidance, safe areas, and a two-pane layout at 900px and wider.
- Accessible control labels, empty states, and storage error feedback.

## Project structure

```text
App.tsx                     Responsive shell and navigation
index.ts                    Expo entry point
app.json                    Native and web configuration
src/components/             Shared UI, navigation, messages, dialogs
src/screens/                Conversations, chat, contacts, settings
src/state/AppContext.tsx    App state and local persistence
src/data.ts                 Fictional contacts and sample conversations
src/theme.ts                Light and dark color tokens
src/types.ts                Shared TypeScript models
```

## Running later

Use Node 20.19.4 or newer. The project targets Expo SDK 54, React Native 0.81, and React 19.1, following the [Expo SDK 54 release notes](https://expo.dev/changelog/sdk-54). After installing dependencies yourself, the `start`, `ios`, `android`, and `web` scripts are available. `npm run typecheck` checks the TypeScript source.

Dependencies have not been installed and the application has not been started or runtime-tested as part of this delivery.

## Demo boundaries

Messages are saved on this device; they are not delivered to other people. Contacts, presence, and conversations are fictional sample data. There is no authentication, push notification service, calling, file upload, or backend. AsyncStorage is not encrypted; do not use the demo to store sensitive information. Avatar images load from Unsplash, with a built-in initials fallback. No API keys or environment variables are needed.
