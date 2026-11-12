import { callSpan } from '../lex.js';
import { SRC } from './sources.js';
import { matches, type Rule } from './api.js';

const SW = ['swiftui'] as const;

export const swiftTapGesture: Rule = {
  id: 'no-press-feedback',
  perOccurrence: true,
  title: 'onTapGesture instead of Button',
  platforms: [...SW],
  weight: 2,
  cap: 10,
  why: 'A view with .onTapGesture has no pressed highlight, no button trait for VoiceOver, no keyboard or Switch Control support and no hover effect. Button gives all of that for free.',
  fix: 'Use Button { ... } label: { ... } with .buttonStyle(.plain) or a custom ButtonStyle if you need a custom look.',
  sources: [SRC.swiftui_button, SRC.hig_buttons, SRC.hig_accessibility],
  file(f, report) {
    for (const m of matches(/\.onTapGesture\s*(\(|\{)/, f.masked)) {
      const after = f.code.slice(m.index, m.index + 40);
      if (/count:\s*[2-9]/.test(after)) continue;
      report(m.index, '.onTapGesture used as a button.');
    }
  },
};

export const swiftFixedFont: Rule = {
  id: 'fixed-font-size',
  perOccurrence: true,
  title: 'Fixed font sizes instead of text styles',
  platforms: [...SW],
  weight: 1,
  cap: 8,
  why: 'Apple: built-in text styles "ensure support for Dynamic Type". .system(size: 28) is a point size that is not tied to any text style, so it does not take part in the type hierarchy the way .title does, and custom(_:fixedSize:) is documented not to scale.',
  fix: 'Use text styles (.largeTitle, .title2, .headline, .body ...) or Font.custom(name, size:, relativeTo: .body). For numbers in a fixed box, use @ScaledMetric.',
  sources: [SRC.hig_typography, SRC.swiftui_custom_fonts],
  file(f, report) {
    for (const m of matches(/\.system\(\s*size:\s*\d/, f.masked)) report(m.index, '.system(size:) is not tied to a text style; prefer .title, .body etc.');
    for (const m of matches(/\.custom\s*\(/, f.masked)) {
      const span = callSpan(f.masked, m.index + m[0].length - 1);
      if (!span) continue;
      const args = f.masked.slice(span.args[0], span.args[1]);
      // custom(_:size:) scales relative to .body per Apple; only fixedSize: opts out
      if (/fixedSize:/.test(args)) report(m.index, 'Font.custom(fixedSize:) does not scale with Dynamic Type.');
    }
  },
};

export const swiftNavigationView: Rule = {
  id: 'deprecated-navigation-view',
  title: 'NavigationView (deprecated)',
  platforms: [...SW],
  weight: 2,
  cap: 2,
  why: 'NavigationView is deprecated. NavigationStack and NavigationSplitView give correct large titles, back-swipe and state restoration, and are what current system apps use.',
  fix: 'Replace NavigationView with NavigationStack (or NavigationSplitView on iPad).',
  sources: [SRC.swiftui_navigationview],
  file(f, report) {
    for (const m of matches(/\bNavigationView\s*\{/, f.masked)) report(m.index, 'NavigationView is deprecated; use NavigationStack.');
  },
};

const IMMERSIVE = /camera|video|player|photo|image|media|scanner|fullscreen|immersive/i;

export const swiftFullScreenCover: Rule = {
  id: 'modal-instead-of-sheet',
  perOccurrence: true,
  title: 'Full-screen covers for simple tasks',
  platforms: [...SW],
  weight: 2,
  cap: 6,
  why: 'Apple reserves full-screen modals for immersive content (video, camera, multi-step creation). For a form or a detail, a sheet keeps the parent visible and can be swiped away. Covers whose binding or content names a camera, video, player, photo or media view are not counted.',
  fix: 'Use .sheet with .presentationDetents([.medium, .large]) unless the task truly needs the whole screen.',
  sources: [SRC.hig_sheets, SRC.hig_modality],
  file(f, report) {
    for (const m of matches(/\.fullScreenCover\s*\(/, f.masked)) {
      const span = callSpan(f.masked, m.index + m[0].length - 1);
      const body = span ? f.code.slice(span.args[0], span.trailing ? span.trailing[1] : span.args[1]) : '';
      // Apple: full screen is for immersive content such as video, photos and the camera
      if (IMMERSIVE.test(body)) continue;
      report(m.index, '.fullScreenCover; would a .sheet do?');
    }
  },
};

export const swiftForcedScheme: Rule = {
  id: 'forced-color-scheme',
  title: 'Color scheme forced on',
  platforms: [...SW],
  weight: 5,
  cap: 5,
  why: 'Hard-wiring .preferredColorScheme(.dark) or (.light) overrides the user’s system setting for the whole app. Apple expects apps to follow the system appearance.',
  fix: 'Remove it, or bind it to a user setting with a "System" default (nil).',
  sources: [SRC.hig_dark],
  file(f, report) {
    for (const m of matches(/\.preferredColorScheme\(\s*\.(dark|light)\s*\)/, f.code)) report(m.index, `.preferredColorScheme(.${m[1]}) ignores the system setting.`);
  },
};

export const swiftSmallTarget: Rule = {
  id: 'touch-target-too-small',
  perOccurrence: true,
  title: 'Touch targets under 44 pt',
  platforms: [...SW],
  weight: 2,
  cap: 12,
  why: 'Apple: "a button needs a hit region of at least 44x44 pt". A 28-point circle with a tap handler is a 28-point target.',
  fix: 'Keep the visual small, but give the button .frame(minWidth: 44, minHeight: 44) and .contentShape(Rectangle()).',
  sources: [SRC.hig_buttons, SRC.hig_accessibility],
  file(f, report) {
    // a small frame immediately followed by a tap handler in the same modifier chain
    for (const m of matches(/\.frame\(\s*width:\s*(\d+(?:\.\d+)?)\s*,\s*height:\s*(\d+(?:\.\d+)?)\s*\)/, f.code)) {
      const w = parseFloat(m[1]);
      const h = parseFloat(m[2]);
      if (w >= 44 && h >= 44) continue;
      const tail = f.masked.slice(m.index + m[0].length, m.index + m[0].length + 260);
      const chainEnd = tail.search(/\n\s*\n|\n\s*[A-Z][A-Za-z]*\s*[({]|\}\s*\n\s*\}/);
      const chain = chainEnd >= 0 ? tail.slice(0, chainEnd) : tail;
      if (/\.onTapGesture/.test(chain) && !/\.contentShape|\.frame\(\s*min/.test(chain)) report(m.index, `Tappable view is ${w}×${h} pt; minimum hit region is 44×44 pt.`);
    }
  },
};

export const swiftRules: Rule[] = [swiftTapGesture, swiftFixedFont, swiftNavigationView, swiftFullScreenCover, swiftForcedScheme, swiftSmallTarget];
