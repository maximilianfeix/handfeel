export type Platform = 'react-native' | 'flutter' | 'swiftui' | 'compose';

export const PLATFORM_LABEL: Record<Platform, string> = {
  'react-native': 'Expo / React Native',
  flutter: 'Flutter',
  swiftui: 'SwiftUI',
  compose: 'Jetpack Compose',
};

export interface Source {
  title: string;
  url: string;
}

export interface Finding {
  rule: string;
  /** Path relative to the scanned root, forward slashes. */
  file: string;
  /** 1-based. */
  line: number;
  /** 1-based. */
  column: number;
  message: string;
}

export interface RuleMeta {
  id: string;
  title: string;
  platforms: Platform[];
  /** Points deducted per finding. */
  weight: number;
  /** Maximum points this rule can deduct. */
  cap: number;
  /** Findings tolerated before deductions start. */
  free?: number;
  /** Why it matters to the person holding the phone. */
  why: string;
  /** Short hint on how to fix it. */
  fix: string;
  sources: Source[];
}

export interface RuleScore {
  rule: string;
  title: string;
  count: number;
  penalty: number;
  weight: number;
  cap: number;
  free: number;
}

export interface ScanResult {
  version: string;
  root: string;
  platforms: Platform[];
  filesScanned: number;
  score: number;
  grade: string;
  breakdown: RuleScore[];
  findings: Finding[];
  skipped: { file: string; reason: string }[];
}
