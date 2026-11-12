import 'package:flutter/material.dart';

import 'models.dart';

/// The one brand accent: the lime the app already used for its primary
/// actions. Every other color is a role derived from it.
const brand = Color(0xFFC6FF3D);

/// Spacing scale on the 4/8-point grid.
abstract final class Space {
  static const double xs = 4, sm = 8, md = 12, lg = 16, xl = 24, xxl = 32;
}

ColorScheme _scheme(Brightness brightness) {
  final seeded =
      ColorScheme.fromSeed(seedColor: brand, brightness: brightness);
  if (brightness == Brightness.light) return seeded;
  // Dark: keep the original near-black surfaces and the lime accent.
  return seeded.copyWith(
    primary: brand,
    onPrimary: const Color(0xFF151A05),
    surface: const Color(0xFF0B0B10),
    onSurface: const Color(0xFFF2F2F7),
    onSurfaceVariant: const Color(0xFF9A9AB0),
    surfaceContainerLow: const Color(0xFF121219),
    surfaceContainer: const Color(0xFF16161F),
    surfaceContainerHigh: const Color(0xFF1F1F2B),
    surfaceContainerHighest: const Color(0xFF2A2A38),
    outlineVariant: const Color(0xFF2A2A38),
  );
}

/// Builds the light or dark theme. MaterialApp picks one from the system
/// setting (themeMode stays at ThemeMode.system).
ThemeData buildTheme(Brightness brightness) {
  final cs = _scheme(brightness);
  return ThemeData(
    useMaterial3: true,
    colorScheme: cs,
    scaffoldBackgroundColor: cs.surface,
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: cs.surfaceContainer,
    ),
  );
}

/// Workout colors. Bright fills with dark foreground keep contrast above
/// 4.5:1 in both light and dark mode.
extension WorkoutToneColors on WorkoutTone {
  Color get color => switch (this) {
        WorkoutTone.orange => const Color(0xFFFF8A3D),
        WorkoutTone.coral => const Color(0xFFFF6B6B),
        WorkoutTone.sky => const Color(0xFF3DD5FF),
        WorkoutTone.mint => const Color(0xFF2EE59D),
        WorkoutTone.amber => const Color(0xFFFFC53D),
      };

  Color get onColor => const Color(0xFF14141A);
}
