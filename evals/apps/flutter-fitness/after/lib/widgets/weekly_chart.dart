import 'package:flutter/material.dart';

import '../data.dart';
import '../theme.dart';

/// Simple animated bar chart of minutes trained per day.
class WeeklyChart extends StatelessWidget {
  final int todayIndex;
  const WeeklyChart({super.key, required this.todayIndex});

  @override
  Widget build(BuildContext context) {
    final maxV = weeklyMinutes.reduce((a, b) => a > b ? a : b);
    return SizedBox(
      height: 130,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: List.generate(weeklyMinutes.length, (i) {
          final v = weeklyMinutes[i];
          final isToday = i == todayIndex;
          return Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0, end: v / maxV),
                  duration: Duration(milliseconds: 600 + i * 80),
                  curve: Curves.easeOutBack,
                  builder: (_, t, __) => Container(
                    width: 16,
                    height: 8 + 78 * t.clamp(0.0, 1.2),
                    decoration: BoxDecoration(
                      gradient: isToday ? limeGradient : null,
                      color: isToday ? null : Colors.white.withOpacity(0.14),
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  weekDays[i],
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: isToday ? AppColors.lime : AppColors.textDim,
                  ),
                ),
              ],
            ),
          );
        }),
      ),
    );
  }
}
