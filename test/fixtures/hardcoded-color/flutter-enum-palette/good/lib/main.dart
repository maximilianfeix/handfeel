import 'package:flutter/material.dart';
enum AvatarColor { blue, green }
extension AvatarColorX on AvatarColor {
  Color get color => switch (this) {
    AvatarColor.blue => const Color(0xFF3B82F6),
    AvatarColor.green => const Color(0xFF16A34A),
  };
}
Widget scrim() => Container(color: Colors.black.withValues(alpha: 0.4));
