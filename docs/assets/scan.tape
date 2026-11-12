# Terminal demo. Recorded with vhs (github.com/charmbracelet/vhs).
# Run from a folder that has handfeel installed (npm install handfeel) and two copies of
# evals/apps/expo-budget: `ledger` (before) and `ledger-fixed` (after).
Output scan.gif
Require npx

Set Shell zsh
Set FontFamily "JetBrainsMono Nerd Font"
Set FontSize 20
Set Width 1200
Set Height 760
Set Padding 28
Set LineHeight 1.25
Set TypingSpeed 45ms
Set Theme { "name": "handfeel", "background": "#151412", "foreground": "#F4F1EA", "cursor": "#E0592A", "selection": "#33302B", "black": "#151412", "red": "#F0714A", "green": "#8FCB7A", "yellow": "#E8B85A", "blue": "#8AB4D8", "magenta": "#C9A0D8", "cyan": "#86C5C0", "white": "#F4F1EA", "brightBlack": "#A49E93", "brightRed": "#F0714A", "brightGreen": "#8FCB7A", "brightYellow": "#E8B85A", "brightBlue": "#8AB4D8", "brightMagenta": "#C9A0D8", "brightCyan": "#86C5C0", "brightWhite": "#FFFFFF" }

Hide
Type "cd ledger && clear" Enter
Sleep 300ms
Show

Type "npx handfeel scan . --summary" Sleep 400ms Enter
Sleep 4s
Type "clear" Enter
Type "cd ../ledger-fixed && npx handfeel scan . --summary" Sleep 400ms Enter
Sleep 3.5s
Type "clear" Enter
Type "npx handfeel explain purple-gradient" Sleep 400ms Enter
Sleep 6s
