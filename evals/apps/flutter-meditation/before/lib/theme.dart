import 'package:flutter/material.dart';

abstract final class StillColors {
  static const background = Color(0xFFF9F8FC);
  static const ink = Color(0xFF302B42);
  static const muted = Color(0xFF797486);
  static const purple = Color(0xFF7963A8);
  static const lavender = Color(0xFFECE6F5);
  static const line = Color(0xFFECE9F1);
}

ThemeData buildTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: StillColors.purple,
    surface: StillColors.background,
    brightness: Brightness.light,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: StillColors.background,
    fontFamily: 'sans-serif',
    textTheme: const TextTheme(
      headlineLarge: TextStyle(fontSize: 36, fontWeight: FontWeight.w600, letterSpacing: -1.2, height: 1.15, color: StillColors.ink),
      headlineMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.w600, letterSpacing: -.8, color: StillColors.ink),
      titleLarge: TextStyle(fontSize: 21, fontWeight: FontWeight.w600, letterSpacing: -.4, color: StillColors.ink),
      titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: StillColors.ink),
      bodyLarge: TextStyle(fontSize: 16, height: 1.6, color: StillColors.ink),
      bodyMedium: TextStyle(fontSize: 14, height: 1.5, color: StillColors.muted),
      labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
    ),
    dividerColor: StillColors.line,
    splashFactory: InkSparkle.splashFactory,
    appBarTheme: const AppBarTheme(backgroundColor: StillColors.background, foregroundColor: StillColors.ink, elevation: 0),
    sliderTheme: const SliderThemeData(trackHeight: 3, thumbShape: RoundSliderThumbShape(enabledThumbRadius: 6)),
    filledButtonTheme: FilledButtonThemeData(style: FilledButton.styleFrom(
      backgroundColor: StillColors.ink,
      foregroundColor: Colors.white,
      minimumSize: const Size(48, 54),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    )),
  );
}
