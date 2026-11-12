import 'package:flutter/material.dart';

import '../data.dart';
import '../theme.dart';

/// Simple animated bar chart of minutes trained per day.
class WeeklyChart extends StatelessWidget {
  final int todayIndex;
  const WeeklyChart({super.key, required this.todayIndex});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    final maxV = weeklyMinutes.reduce((a, b) => a > b ? a : b);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: List.generate(weeklyMinutes.length, (i) {
        final v = weeklyMinutes[i];
        final isToday = i == todayIndex;
        return Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              // Fixed bar area so the card does not grow while bars animate.
              SizedBox(
                height: 88,
                child: Align(
                  alignment: Alignment.bottomCenter,
                  child: TweenAnimationBuilder<double>(
                    tween: Tween(begin: 0, end: v / maxV),
                    duration: reduceMotion
                        ? Duration.zero
                        : Duration(milliseconds: 600 + i * 80),
                    curve: Curves.easeOutCubic,
                    builder: (_, t, __) => Container(
                      width: 16,
                      height: 8 + 80 * t.clamp(0.0, 1.0),
                      decoration: BoxDecoration(
                        color: isToday ? cs.primary : cs.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: Space.sm),
              Text(
                weekDays[i],
                style: tt.labelMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: isToday ? cs.primary : cs.onSurfaceVariant,
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}
