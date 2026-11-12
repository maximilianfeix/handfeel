import { readdirSync, readFileSync, statSync, type Dirent } from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';
import type { Platform } from './types.js';

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.hg', '.svn', 'build', 'dist', 'out', '.expo', '.expo-shared', '.dart_tool', '.pub-cache',
  'Pods', 'DerivedData', '.gradle', '.idea', '.vscode', '.next', 'coverage', 'vendor', '.build', '.swiftpm',
  '__tests__', '__mocks__', 'test', 'tests', 'androidTest', 'Tests', 'UITests', 'integration_test', '.turbo', '.cache',
  'Carthage', 'generated', '.fvm', '__fixtures__', '__generated__',
]);

/** React Native resolves `.web.*` files only for web builds; they never run on a phone. */
const RN_WEB_FILE = /\.web\.[cm]?[jt]sx?$/;

const SKIP_FILE = /(\.test|\.spec|\.stories|\.d|\.g|\.freezed|\.gr|\.config)\.[a-z]+$|^(babel|metro|jest|eslint|prettier|tailwind|postcss|webpack|vite|app)\.config\./i;
export interface Candidate {
  rel: string;
  abs: string;
  platform: Platform;
  /** already read while detecting the platform */
  text?: string;
}

export interface Manifests {
  /** directories (relative) whose package.json depends on react-native or expo */
  rnPackages: { dir: string; pkg: any }[];
  appJson: { dir: string; json: any }[];
  pubspecs: { dir: string; text: string }[];
}

export function globToRegExp(glob: string): RegExp {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        re += '.*';
        i++;
        if (glob[i + 1] === '/') i++;
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else if ('.+^${}()|[]\\'.includes(c)) re += '\\' + c;
    else re += c;
  }
  return new RegExp(`(^|/)${re}($|/)`);
}

/** Bigger source files are generated (bundles, translation tables, fixtures), not screens. */
const MAX_BYTES = 1_000_000;
/** Files above this size whose lines average more than MINIFIED_AVG_LINE characters are minified. */
const MINIFIED_SIZE = 50_000;
const MINIFIED_AVG_LINE = 500;

export interface Skipped {
  file: string;
  reason: string;
}

/**
 * Reads a source file as text. Handles UTF-8 with or without BOM and UTF-16 (with BOM);
 * throws a short, human-readable reason for anything that is not text source.
 */
export function readSource(abs: string): string {
  const buf = readFileSync(abs);
  let text: string;
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) text = new TextDecoder('utf-16le').decode(buf.subarray(2));
  else if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) text = new TextDecoder('utf-16be').decode(buf.subarray(2));
  else {
    text = buf.toString('utf8');
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  }
  if (text.slice(0, 8000).includes('\u0000')) throw new Error('binary file');
  // Minified bundles: big, with few line breaks. A few long SVG path lines in an icon component are fine.
  if (text.length > MINIFIED_SIZE) {
    let lines = 1;
    for (let i = text.indexOf('\n'); i !== -1; i = text.indexOf('\n', i + 1)) lines++;
    if (text.length / lines > MINIFIED_AVG_LINE) throw new Error(`minified or generated (${lines} line(s), ${Math.round(text.length / lines)} characters per line on average)`);
  }
  return text;
}

export function errorReason(e: unknown): string {
  const err = e as NodeJS.ErrnoException;
  if (err?.code === 'EACCES' || err?.code === 'EPERM') return 'permission denied';
  if (err?.code === 'ENOENT') return 'file disappeared during the scan';
  if (err?.code === 'EISDIR') return 'is a directory';
  if (err?.code === 'EMFILE' || err?.code === 'ENFILE') return 'too many open files';
  if (err instanceof RangeError) return 'nested too deeply to process';
  return String(err?.message ?? e).split('\n')[0];
}

function readJson(p: string): any {
  try {
    return JSON.parse(readSource(p));
  } catch {
    return null;
  }
}

function isRnPackage(pkg: any): boolean {
  if (!pkg || typeof pkg !== 'object') return false;
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}), ...(pkg.peerDependencies ?? {}) };
  return 'react-native' in deps || 'expo' in deps;
}

const SOURCE_EXT = /\.(tsx?|jsx?|mjs|dart|swift|kt)$/;
const toPosix = (p: string) => p.split(sep).join('/');

export function collect(root: string, ignore: RegExp[] = []): { candidates: Candidate[]; manifests: Manifests; skipped: Skipped[] } {
  const all: { rel: string; abs: string }[] = [];
  const manifests: Manifests = { rnPackages: [], appJson: [], pubspecs: [] };
  const skipped: Skipped[] = [];
  /** text read during detection, reused by the scan */
  const texts = new Map<string, string>();
  /** files that failed to read during detection; reported only if they turn out to be app source */
  const failed = new Map<string, string>();
  const read = (f: { rel: string; abs: string }): string | null => {
    const hit = texts.get(f.abs);
    if (hit !== undefined) return hit;
    if (failed.has(f.abs)) return null;
    try {
      const t = readSource(f.abs);
      texts.set(f.abs, t);
      return t;
    } catch (e) {
      failed.set(f.abs, errorReason(e));
      return null;
    }
  };

  // Recursion depth is bounded by the OS path length limit (a few thousand folders at most).
  const visit = (dir: string, depth: number) => {
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      if (dir !== root) skipped.push({ file: toPosix(relative(root, dir)) + '/', reason: errorReason(e) });
      return;
    }
    if (depth > 200) {
      skipped.push({ file: toPosix(relative(root, dir)) + '/', reason: 'nested more than 200 folders deep' });
      return;
    }
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    const names = new Set(entries.map((e) => e.name));
    for (const ent of entries) {
      const name = ent.name;
      const abs = join(dir, name);
      const rel = toPosix(relative(root, abs));
      if (ignore.some((r) => r.test(rel))) continue;
      let isDir = ent.isDirectory();
      let isFile = ent.isFile();
      let size = -1;
      if (ent.isSymbolicLink()) {
        // Symlinked folders are not followed: they loop (a -> ..) or lead out of the project.
        let st;
        try {
          st = statSync(abs);
        } catch {
          continue; // dangling link
        }
        if (st.isDirectory()) continue;
        isDir = false;
        isFile = st.isFile();
        size = st.size;
      }
      if (isDir) {
        if (SKIP_DIRS.has(name) || name.startsWith('.')) continue;
        // native folders of an RN/Flutter app hold generated or template code
        if ((name === 'ios' || name === 'android' || name === 'macos' || name === 'web' || name === 'windows' || name === 'linux') && (names.has('pubspec.yaml') || names.has('package.json'))) continue;
        visit(abs, depth + 1);
        continue;
      }
      if (!isFile) continue;
      const isManifest = name === 'package.json' || name === 'app.json' || name === 'app.config.json' || name === 'pubspec.yaml';
      const isSource = !isManifest && !SKIP_FILE.test(name) && SOURCE_EXT.test(name);
      if (!isManifest && !isSource) continue;
      if (size < 0) {
        try {
          size = statSync(abs).size;
        } catch (e) {
          skipped.push({ file: rel, reason: errorReason(e) });
          continue;
        }
      }
      if (size > MAX_BYTES) {
        if (isSource) skipped.push({ file: rel, reason: `larger than ${MAX_BYTES / 1_000_000} MB` });
        continue;
      }
      const dirRel = toPosix(relative(root, dir));
      if (name === 'package.json') {
        const pkg = readJson(abs);
        if (isRnPackage(pkg)) manifests.rnPackages.push({ dir: dirRel, pkg });
        continue;
      }
      if (name === 'app.json' || name === 'app.config.json') {
        const json = readJson(abs);
        if (json) manifests.appJson.push({ dir: dirRel, json });
        continue;
      }
      if (name === 'pubspec.yaml') {
        try {
          manifests.pubspecs.push({ dir: dirRel, text: readSource(abs) });
        } catch (e) {
          skipped.push({ file: rel, reason: errorReason(e) });
        }
        continue;
      }
      all.push({ rel, abs });
    }
  };
  visit(root, 0);

  const rnDirs = manifests.rnPackages.map((p) => p.dir);
  const inDir = (rel: string, d: string) => d === '' || rel === d || rel.startsWith(d + '/');
  const candidates: Candidate[] = [];
  let swiftUI = false;
  let compose = false;
  const swift: typeof all = [];
  const kotlin: typeof all = [];

  for (const f of all) {
    if (f.rel.endsWith('.dart')) {
      candidates.push({ ...f, platform: 'flutter' });
    } else if (f.rel.endsWith('.swift')) {
      swift.push(f);
    } else if (f.rel.endsWith('.kt')) {
      kotlin.push(f);
    } else {
      if (RN_WEB_FILE.test(f.rel)) continue;
      if (rnDirs.some((d) => inDir(f.rel, d))) {
        candidates.push({ ...f, platform: 'react-native' });
      } else {
        // no manifest found (e.g. a single folder): fall back to imports
        const head = (read(f) ?? '').slice(0, 4000);
        if (/from\s+['"](react-native|expo[-\w/]*)['"]/.test(head)) candidates.push({ ...f, platform: 'react-native' });
      }
    }
  }
  for (const f of swift) if (!swiftUI && /^\s*import\s+SwiftUI\b/m.test(read(f) ?? '')) swiftUI = true;
  for (const f of kotlin) if (!compose && /^\s*import\s+androidx\.compose\./m.test(read(f) ?? '')) compose = true;
  if (swiftUI) for (const f of swift) candidates.push({ ...f, platform: 'swiftui' });
  if (compose) for (const f of kotlin) candidates.push({ ...f, platform: 'compose' });

  const usable: Candidate[] = [];
  for (const c of candidates) {
    const why = failed.get(c.abs);
    if (why !== undefined) {
      skipped.push({ file: c.rel, reason: why });
      continue;
    }
    const t = texts.get(c.abs);
    if (t !== undefined) c.text = t;
    usable.push(c);
  }
  return { candidates: usable, manifests, skipped };
}

export { dirname };
