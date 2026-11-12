# handfeel

Find the AI look in mobile apps. A static scanner and an agent skill for Expo/React Native, Flutter, SwiftUI and Jetpack Compose.

**Work in progress.** Not released yet; the npm package is not published.

```sh
npm install && npm run build
node dist/src/cli.js scan path/to/your/app
```

The scanner runs offline, makes no AI calls, and prints a 0-100 score with every finding as `file:line`. `node dist/src/cli.js rules` lists the rules, `explain <rule>` shows why each one exists and its sources.

MIT licensed.
