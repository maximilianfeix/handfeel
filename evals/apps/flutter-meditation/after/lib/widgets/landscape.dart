import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme.dart';

/// Resolution-independent landscape artwork. No network or asset loading.
class Landscape extends StatelessWidget {
  final int variant;
  final Widget? child;
  const Landscape({super.key, this.variant = 0, this.child});
  @override
  Widget build(BuildContext context) => CustomPaint(
    painter: _LandscapePainter(variant),
    child: child ?? const SizedBox.expand(),
  );
}

class _LandscapePainter extends CustomPainter {
  final int variant;
  _LandscapePainter(this.variant);
  @override
  void paint(Canvas canvas, Size size) {
    final colors = landscapePalettes[variant % landscapePalettes.length];
    canvas.drawRect(Offset.zero & size, Paint()..color = colors[0]);
    canvas.drawCircle(Offset(size.width * .73, size.height * .27), size.shortestSide * .16, Paint()..color = colors[1]);
    for (var layer = 0; layer < 3; layer++) {
      final path = Path()..moveTo(0, size.height);
      for (var x = 0.0; x <= size.width + 2; x += 2) {
        final t = x / size.width;
        final y = size.height * (.56 + layer * .16) +
            math.sin(t * math.pi * 1.6 + layer * 1.9 + variant) * size.height * .11 +
            math.cos(t * math.pi * 3.1 + layer) * size.height * .035;
        path.lineTo(x, y);
      }
      path.lineTo(size.width, size.height);
      path.close();
      canvas.drawPath(path, Paint()..color = colors[layer + 2]);
    }
    // A few fine contour lines give the rolling hills a quiet sense of depth.
    final contour = Paint()..color = colors.last.withOpacity(.15)..style = PaintingStyle.stroke..strokeWidth = 1;
    for (var i = 0; i < 3; i++) {
      canvas.drawArc(Rect.fromLTWH(-size.width * .3, size.height * (.75 + i * .06), size.width * 1.8, size.height * .65), math.pi, math.pi, false, contour);
    }
  }
  @override
  bool shouldRepaint(covariant _LandscapePainter oldDelegate) => oldDelegate.variant != variant;
}
