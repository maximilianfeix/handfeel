import 'package:flutter/material.dart';

class AppColors {
  static const bg = Color(0xFF0B0B10);
  static const surface = Color(0xFF16161F);
  static const surfaceHigh = Color(0xFF1F1F2B);
  static const lime = Color(0xFFC6FF3D);
  static const violet = Color(0xFF7C5CFF);
  static const coral = Color(0xFFFF6B6B);
  static const sky = Color(0xFF3DD5FF);
  static const textDim = Color(0xFF9A9AB0);
}

const accentGradient = LinearGradient(
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
  colors: [AppColors.violet, Color(0xFFB04CFF)],
);

const limeGradient = LinearGradient(
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
  colors: [AppColors.lime, Color(0xFF7DFFB0)],
);

ThemeData buildTheme() {
  final base = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: const ColorScheme.dark(
      primary: AppColors.lime,
      secondary: AppColors.violet,
      surface: AppColors.surface,
    ),
    scaffoldBackgroundColor: AppColors.bg,
  );
  return base.copyWith(
    textTheme: base.textTheme.apply(
      bodyColor: Colors.white,
      displayColor: Colors.white,
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: AppColors.surface,
      indicatorColor: AppColors.lime.withOpacity(0.16),
      labelTextStyle: WidgetStateProperty.all(
        const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
      ),
      iconTheme: WidgetStateProperty.resolveWith((states) => IconThemeData(
            color: states.contains(WidgetState.selected)
                ? AppColors.lime
                : AppColors.textDim,
          )),
    ),
  );
}
