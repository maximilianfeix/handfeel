import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';
import type { Platform } from './types.js';

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.hg', '.svn', 'build', 'dist', 'out', '.expo', '.expo-shared', '.dart_tool', '.pub-cache',
  'Pods', 'DerivedData', '.gradle', '.idea', '.vscode', '.next', 'coverage', 'vendor', '.build', '.swiftpm',
  '__tests__', '__mocks__', 'test', 'tests', 'androidTest', 'Tests', 'UITests', 'integration_test', '.turbo', '.cache',
  'Carthage', 'generated', '.fvm',
]);

const SKIP_FILE = /(\.test|\.spec|\.stories|\.d|\.g|\.freezed|\.gr|\.config)\.[a-z]+$|^(babel|metro|jest|eslint|prettier|tailwind|postcss|webpack|vite|app)\.config\./i;
const MAX_BYTES = 1_000_000;

export interface Candidate {
  rel: string;
  abs: string;
  platform: Platform;
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

function readJson(p: string): any {
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function isRnPackage(pkg: any): boolean {
  if (!pkg) return false;
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}), ...(pkg.peerDependencies ?? {}) };
  return 'react-native' in deps || 'expo' in deps;
}

export function collect(root: string, ignore: RegExp[] = []): { candidates: Candidate[]; manifests: Manifests } {
  const all: { rel: string; abs: string }[] = [];
  const manifests: Manifests = { rnPackages: [], appJson: [], pubspecs: [] };

  const visit = (dir: string) => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      const abs = join(dir, name);
      const rel = relative(root, abs).split(sep).join('/');
      if (ignore.some((r) => r.test(rel))) continue;
      let st;
      try {
        st = statSync(abs);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (SKIP_DIRS.has(name) || name.startsWith('.')) continue;
        // native folders of an RN/Flutter app hold generated or template code
        if ((name === 'ios' || name === 'android' || name === 'macos' || name === 'web' || name === 'windows' || name === 'linux') && (existsSync(join(dir, 'pubspec.yaml')) || existsSync(join(dir, 'package.json')))) continue;
        visit(abs);
        continue;
      }
      if (!st.isFile() || st.size > MAX_BYTES) continue;
      if (name === 'package.json') {
        const pkg = readJson(abs);
        if (isRnPackage(pkg)) manifests.rnPackages.push({ dir: relative(root, dir).split(sep).join('/'), pkg });
        continue;
      }
      if (name === 'app.json' || name === 'app.config.json') {
        const json = readJson(abs);
        if (json) manifests.appJson.push({ dir: relative(root, dir).split(sep).join('/'), json });
        continue;
      }
      if (name === 'pubspec.yaml') {
        manifests.pubspecs.push({ dir: relative(root, dir).split(sep).join('/'), text: readFileSync(abs, 'utf8') });
        continue;
      }
      if (SKIP_FILE.test(name)) continue;
      if (/\.(tsx?|jsx?|mjs|dart|swift|kts?)$/.test(name) && !/\.kts$/.test(name)) all.push({ rel, abs });
    }
  };
  visit(root);

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
    } else if (/\.kt$/.test(f.rel)) {
      kotlin.push(f);
    } else {
      if (rnDirs.some((d) => inDir(f.rel, d))) {
        candidates.push({ ...f, platform: 'react-native' });
      } else {
        // no manifest found (e.g. a single folder): fall back to imports
        const head = readFileSync(f.abs, 'utf8').slice(0, 4000);
        if (/from\s+['"](react-native|expo[-\w/]*)['"]/.test(head)) candidates.push({ ...f, platform: 'react-native' });
      }
    }
  }
  for (const f of swift) if (/^\s*import\s+SwiftUI\b/m.test(readFileSync(f.abs, 'utf8'))) swiftUI = true;
  for (const f of kotlin) if (/^\s*import\s+androidx\.compose\./m.test(readFileSync(f.abs, 'utf8'))) compose = true;
  if (swiftUI) for (const f of swift) candidates.push({ ...f, platform: 'swiftui' });
  if (compose) for (const f of kotlin) candidates.push({ ...f, platform: 'compose' });

  return { candidates, manifests };
}

export { dirname };
