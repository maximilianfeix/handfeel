import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

/// Brand values, defined once. Screens read [ColorScheme] roles, never these.
abstract final class StillBrand {
  static const purple = Color(0xFF7963A8);
  static const ink = Color(0xFF302B42);
  // Darkened from 0xFF797486 so secondary text on the light background passes 4.5:1.
  static const muted = Color(0xFF6B6680);
  static const background = Color(0xFFF9F8FC);
  static const lavender = Color(0xFFECE6F5);
  static const line = Color(0xFFECE9F1);
}

/// Per-session tint, part of the session data (artwork, not chrome).
abstract final class SessionTints {
  static const lavender = Color(0xFFDAD0EB);
  static const sand = Color(0xFFEADCC9);
  static const dusk = Color(0xFFCFD6E8);
  static const sage = Color(0xFFD6E3DB);
  static const rose = Color(0xFFE8D7DC);
}

/// Landscape artwork palettes: sky, sun, three hill layers.
const landscapePalettes = <List<Color>>[
  [Color(0xFFE5DDF0), Color(0xFFF8EDDF), Color(0xFFC5B5DC), Color(0xFFA28DBF), Color(0xFF7F6A9E)],
  [Color(0xFFF0E4D4), Color(0xFFFFF6DE), Color(0xFFD9C6AE), Color(0xFFB4B49A), Color(0xFF8A9D87)],
  [Color(0xFFD8DEED), Color(0xFFF6F2E6), Color(0xFFAEBBD5), Color(0xFF8699BC), Color(0xFF627D9F)],
  [Color(0xFFDFEAE2), Color(0xFFF7F3DA), Color(0xFFBDD1C7), Color(0xFF94B4A7), Color(0xFF6E998D)],
];

ColorScheme _lightScheme() => ColorScheme.fromSeed(seedColor: StillBrand.purple).copyWith(
      primary: StillBrand.purple,
      surface: StillBrand.background,
      onSurface: StillBrand.ink,
      onSurfaceVariant: StillBrand.muted,
      outlineVariant: StillBrand.line,
      secondaryContainer: StillBrand.lavender,
      onSecondaryContainer: StillBrand.ink,
      surfaceContainerLowest: const Color(0xFFFFFFFF),
      surfaceContainerLow: const Color(0xFFF2EEF8),
      surfaceContainer: const Color(0xFFEEEFF3),
      surfaceContainerHigh: const Color(0xFFF0EDF5),
      inverseSurface: StillBrand.ink,
      onInverseSurface: const Color(0xFFFFFFFF),
    );

ColorScheme _darkScheme() => ColorScheme.fromSeed(seedColor: StillBrand.purple, brightness: Brightness.dark);

TextTheme _textTheme(ColorScheme cs) => TextTheme(
      headlineLarge: TextStyle(fontSize: 36, fontWeight: FontWeight.w600, letterSpacing: -1.2, height: 1.15, color: cs.onSurface),
      headlineMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.w600, letterSpacing: -.8, color: cs.onSurface),
      headlineSmall: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, letterSpacing: -1, color: cs.onSurface),
      titleLarge: TextStyle(fontSize: 21, fontWeight: FontWeight.w600, letterSpacing: -.4, color: cs.onSurface),
      titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: cs.onSurface),
      bodyLarge: TextStyle(fontSize: 16, height: 1.6, color: cs.onSurface),
      bodyMedium: TextStyle(fontSize: 14, height: 1.5, color: cs.onSurfaceVariant),
      bodySmall: TextStyle(fontSize: 12, height: 1.5, color: cs.onSurfaceVariant),
      labelLarge: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
      labelMedium: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: cs.onSurfaceVariant),
      labelSmall: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: cs.onSurfaceVariant),
    );

bool get _isCupertinoHost =>
    defaultTargetPlatform == TargetPlatform.iOS || defaultTargetPlatform == TargetPlatform.macOS;

ThemeData buildTheme(Brightness brightness) {
  final cs = brightness == Brightness.dark ? _darkScheme() : _lightScheme();
  return ThemeData(
    useMaterial3: true,
    colorScheme: cs,
    scaffoldBackgroundColor: cs.surface,
    textTheme: _textTheme(cs),
    dividerColor: cs.outlineVariant,
    // Ripple on Android; on iOS a highlight only, as native iOS controls do.
    splashFactory: _isCupertinoHost ? NoSplash.splashFactory : InkSparkle.splashFactory,
    appBarTheme: AppBarTheme(backgroundColor: cs.surface, foregroundColor: cs.onSurface, elevation: 0),
    sliderTheme: const SliderThemeData(trackHeight: 3, thumbShape: RoundSliderThumbShape(enabledThumbRadius: 6)),
    filledButtonTheme: FilledButtonThemeData(style: FilledButton.styleFrom(
      backgroundColor: cs.inverseSurface,
      foregroundColor: cs.onInverseSurface,
      minimumSize: const Size(48, 54),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    )),
  );
}
