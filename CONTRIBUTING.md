# Contributing to handfeel

Thanks for helping. The most useful contributions are new rules, reports of false positives, and eval apps for SwiftUI and Jetpack Compose.

## Setup

```sh
git clone https://github.com/maximilianfeix/handfeel
cd handfeel
npm ci
npm test        # builds, then runs unit, ignore-comment and fixture tests
npm run lint    # type-checks and checks the rule catalog
```

Node 18 or newer. CI runs both commands on Linux, macOS and Windows with Node 18 and 22.

## Honesty rules

These apply to every change.

- **No rule without a source.** Every rule cites at least one page from Apple's Human Interface Guidelines, Material 3, or the official docs of the platform or framework. `npm run lint` fails on a rule with no source.
- **Judgement rules cite the slop catalog.** Some tells have no official rule against them (emoji icons, the default purple). Such a rule must cite [docs/slop-catalog.md](docs/slop-catalog.md) and the pattern must actually show up there, measured on generated apps. If it isn't in the catalog yet, add the apps that show it (see "Adding an eval app") before adding the rule.
- **Quote, don't paraphrase into something stronger.** The references quote the source. If a doc says "consider", the rule says "consider".
- **Say what was not tested.** Don't claim a screen ran on iOS or Android if it didn't.

## Adding a rule

Open a [new rule issue](https://github.com/maximilianfeix/handfeel/issues/new?template=new-rule.yml) first if you are unsure whether it fits. Then:

1. **Implement it** in `src/rules/`:
   - `common.ts` for checks that work on any language (colors, emoji, spacing),
   - `rn.ts`, `flutter.ts`, `swiftui.ts`, `compose.ts` for platform-specific checks,
   - `project.ts` for checks that look at the whole project once (no haptics, no dark mode).

   A rule has an `id` (kebab-case), `title`, `platforms`, `weight`, `cap`, optional `free`, `why`, `fix` and `sources`. Add new source URLs to `src/rules/sources.ts` and use them through `SRC.<key>`. Several implementations can share one id, one per platform. Register new exports in `src/rules/index.ts`.

   Pick the weight and cap so one rule can't dominate the score. Compare with `node dist/src/cli.js rules`.

2. **Add a fixture pair** in `scripts/make-fixtures.py`: one `add('<rule>', '<platform>', bad, good)` call per platform, using the `rn()`, `fl()`, `sw()` or `kt()` helpers. Then run:

   ```sh
   python3 scripts/make-fixtures.py
   ```

   This rewrites `test/fixtures/<rule>/<platform>/{bad,good}/`. Commit the generated files. The fixture test requires that `bad/` produces findings and costs points, and that `good/` produces none (or costs nothing, for rules with free findings). Every rule id needs at least one pair.

3. **Document it** in `skills/handfeel/references/<platform>.md` (`expo`, `flutter`, `swiftui`, `compose`). Follow the format of the existing entries: a heading with the rule id in brackets, **Slop** with code, **Fix** with code, **Why** with quotes from the source, and a `Source:` line. Add a line to `skills/handfeel/references/signs.md` if it is a new kind of tell. `npm run lint` fails if a rule id appears in no reference.

4. **Add the source** to [docs/sources.md](docs/sources.md) under its platform, with the date you checked it.

5. **Run** `npm test` and `npm run lint`. If the rule changes eval scores, run `node scripts/evals.mjs` and `node scripts/catalog.mjs` and commit the updated `evals/results.json` and `docs/slop-catalog.md` (see below). Mention score changes in the PR.

## Reporting a false positive

Use the [false positive template](https://github.com/maximilianfeix/handfeel/issues/new?template=false-positive.yml) with the rule id, the smallest snippet that triggers it, and why the code is fine. A fix usually comes with a new `good` fixture that covers your case.

## Adding an eval app

Eval apps are what make the score believable. SwiftUI and Compose apps are the most needed.

1. Generate an app from a plain prompt in an empty folder, the way a user would ask ("a modern habit tracker"). Don't mention design rules. Commit the output unchanged in `evals/apps/<app>/before/`, with the exact prompt, the model and the tool (with version) in `evals/apps/<app>/PROMPT.md`.
2. To evaluate the skill, give a fresh agent only one instruction: use `skills/handfeel/SKILL.md` on a copy of the folder in fix mode, no questions. Commit its result in `after/` and a summary of its report in `FIX-REPORT.md`, including every ignore comment it added and why.
3. Run `node scripts/evals.mjs` (scores, writes `evals/results.json`) and `node scripts/catalog.mjs` (rule frequencies, writes `docs/slop-catalog.md`).
4. Check what the score can't see: the code still type-checks or analyzes, and the screens still render. Add the numbers to `docs/evals.md` in the same format, including anything that got worse.

## Pull requests

Keep a PR to one rule or one fix where possible. Fill in the PR template. Commits and PRs should describe what changed and why; there is no required format.

By contributing you agree that your contribution is licensed under the [MIT License](LICENSE).
