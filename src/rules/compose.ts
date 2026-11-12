import { callSpan } from '../lex.js';
import { SRC } from './sources.js';
import { hasBottomNav, matches, type Rule } from './api.js';

const CO = ['compose'] as const;

export const composeNoIndication: Rule = {
  id: 'no-press-feedback',
  perOccurrence: true,
  title: 'Taps without visual feedback',
  platforms: [...CO],
  weight: 2,
  cap: 10,
  why: 'clickable(indication = null) and detectTapGestures remove the ripple, Material’s only signal that a press registered.',
  fix: 'Keep the default indication (ripple), or use a Material component (Button, IconButton, Card(onClick)).',
  sources: [SRC.m3_states, SRC.compose_touch],
  file(f, report) {
    for (const m of matches(/indication\s*=\s*null/, f.masked)) report(m.index, 'indication = null removes the ripple.');
    for (const m of matches(/detectTapGestures\s*\(\s*(?:onTap\s*=|\{)/, f.masked)) report(m.index, 'detectTapGestures used for a click; no ripple, no semantics.');
  },
};

export const composeSmallTarget: Rule = {
  id: 'touch-target-too-small',
  perOccurrence: true,
  title: 'Touch targets under 48 dp',
  platforms: [...CO],
  weight: 2,
  cap: 12,
  why: 'Material asks for 48×48 dp touch targets. Material components enforce it, but a Box with .size(24.dp).clickable does not.',
  fix: 'Use IconButton, or add Modifier.minimumInteractiveComponentSize() before clickable.',
  sources: [SRC.compose_touch, SRC.android_a11y_targets, SRC.m3_a11y],
  file(f, report) {
    for (const m of matches(/\.clickable\b/, f.masked)) {
      // walk back to the start of this modifier chain
      const from = Math.max(0, m.index - 300);
      const before = f.masked.slice(from, m.index);
      const start = before.lastIndexOf('Modifier');
      if (start < 0) continue;
      const chain = f.code.slice(from + start, m.index);
      if (/minimumInteractiveComponentSize|sizeIn\(\s*min/.test(chain)) continue;
      const sz = /\.size\(\s*(\d+)\.dp\s*\)|\.size\(\s*(\d+)\.dp\s*,\s*(\d+)\.dp\s*\)|\.height\(\s*(\d+)\.dp\s*\)/.exec(chain);
      if (!sz) continue;
      const v = Math.min(...[sz[1], sz[2], sz[3], sz[4]].filter(Boolean).map(Number));
      if (v < 48) report(m.index, `Clickable is ${v} dp; minimum is 48×48 dp.`);
    }
  },
};

export const composeIconLabel: Rule = {
  id: 'icon-button-no-label',
  perOccurrence: true,
  title: 'Icon-only buttons without a label',
  platforms: [...CO],
  weight: 1,
  cap: 6,
  why: 'An IconButton whose Icon has contentDescription = null is read as "button, unlabeled" by TalkBack.',
  fix: 'Give the Icon a contentDescription (stringResource) when it is the only content of the button.',
  sources: [SRC.compose_a11y],
  file(f, report) {
    for (const m of matches(/\b(?:Filled|FilledTonal|Outlined)?IconButton\s*\(/, f.masked)) {
      const span = callSpan(f.masked, m.index + m[0].length - 1);
      if (!span) continue;
      const body = f.code.slice(span.args[0], span.trailing ? span.trailing[1] : span.args[1]);
      if (/contentDescription\s*=\s*null/.test(body)) report(m.index, 'IconButton icon has contentDescription = null.');
    }
  },
};

export const composeHardcodedType: Rule = {
  id: 'type-outside-scale',
  perOccurrence: true,
  title: 'Text sizes outside the type scale',
  platforms: [...CO, 'flutter'],
  weight: 0.5,
  cap: 5,
  why: 'Literal fontSize values in screens bypass MaterialTheme.typography / Theme.of(context).textTheme, so headings drift and theme changes do not reach them.',
  fix: 'Use style = MaterialTheme.typography.titleMedium (Compose) or Theme.of(context).textTheme.titleMedium (Flutter); adjust the theme, not each Text.',
  sources: [SRC.m3_type_scale],
  file(f, report) {
    if (f.isTokenFile) return;
    const re = f.lang === 'kotlin' ? /\bfontSize\s*=\s*\d+(?:\.\d+)?\.sp/ : /\bfontSize:\s*\d+(?:\.\d+)?/;
    for (const m of matches(re, f.code)) report(m.index, `${m[0]} instead of a type-scale role.`);
  },
};

export const composeDrawer: Rule = {
  id: 'hamburger-navigation',
  title: 'Hamburger drawer as main navigation',
  platforms: [...CO],
  weight: 6,
  cap: 6,
  why: 'Material 3 uses a NavigationBar for three to five destinations on phones; the modal drawer is deprecated in M3 Expressive in favour of an expanded navigation rail. A drawer in an app that also has a NavigationBar (adaptive navigation) is not counted.',
  fix: 'Use NavigationBar (or NavigationSuiteScaffold to adapt between bar, rail and drawer by window size).',
  sources: [SRC.m3_nav_bar, SRC.m3_nav_drawer],
  file(f, report, p) {
    if (hasBottomNav(p, 'compose')) return;
    for (const m of matches(/\bModalNavigationDrawer\s*\(/, f.masked)) report(m.index, 'ModalNavigationDrawer as navigation, and the app has no NavigationBar.');
  },
};

export const composeRules: Rule[] = [composeNoIndication, composeSmallTarget, composeIconLabel, composeHardcodedType, composeDrawer];
