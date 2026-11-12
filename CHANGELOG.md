# Changelog

## 0.1.0

First public release.

- **Scanner** for Expo / React Native, Flutter, SwiftUI and Jetpack Compose: 27 rules, each with a cited source, a 0-100 score with a per-rule breakdown, and `file:line` findings. Static and offline: no network, no AI calls, no code execution.
- **Commands**: `scan` (text, `--json`, `--sarif`, `--md`, `--summary`, `--min-score`, `--ignore`, `--only`, `--disable`, `--card <file.svg>`, `--demo`), `rules`, `explain <rule>`, `badge`, `init cursor`. `handfeel <command> --help` for each.
- **Exit codes**: 0 scanned, 1 below `--min-score`, 2 usage error / folder not found / no mobile app source found, 3 internal error.
- **No mobile code, no score**: a folder without app source prints what was looked for and exits 2; `--json` has `"score": null` and a `reason`.
- **`--demo`** scans a bundled generated Flutter app (unchanged model output, prompt included), so the scanner can be tried without an app.
- **`--card`** writes a 1200×630 SVG score card.
- **Robust on real projects**: unreadable, binary, minified and over-1 MB files, symlink loops, deeply nested code and folders, UTF-8 BOM, CRLF and UTF-16 are skipped or handled and listed in `skipped`, never a crash. Decorators and Flow types parse.
- **Agent skill** (`skills/handfeel`) with platform references for all four frameworks, installable with `npx skills add maximilianfeix/handfeel`, as a Claude Code plugin, or into Cursor with `handfeel init cursor`.
