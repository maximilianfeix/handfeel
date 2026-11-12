import 'package:flutter/material.dart';

import '../models.dart';
import '../screens/workout_detail_screen.dart';
import '../theme.dart';

/// Full-width card for a workout. Set [large] for the featured variant.
class WorkoutCard extends StatelessWidget {
  final Workout workout;
  final bool large;

  const WorkoutCard({super.key, required this.workout, this.large = false});

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final fg = workout.tone.onColor;
    return Hero(
      tag: 'workout-${workout.id}',
      child: Card(
        margin: EdgeInsets.zero,
        elevation: 0,
        color: workout.tone.color,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        child: InkWell(
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute(
                builder: (_) => WorkoutDetailScreen(workout: workout)),
          ),
          child: Container(
            constraints: BoxConstraints(minHeight: large ? 192 : 128),
            padding: const EdgeInsets.all(Space.lg + Space.xs),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Positioned(
                  right: -12,
                  bottom: -16,
                  child: ExcludeSemantics(
                    child: Icon(workout.icon,
                        size: large ? 128 : 88, color: fg.withOpacity(0.12)),
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _Pill(text: workout.category.toUpperCase(), color: fg),
                    SizedBox(height: large ? Space.xxl + Space.lg : Space.lg),
                    Text(
                      workout.title,
                      style: (large ? tt.headlineMedium : tt.titleLarge)
                          ?.copyWith(
                        color: fg,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: Space.xs),
                    Text(
                      '${workout.minutes} min  ·  ${workout.kcal} kcal  ·  ${workout.level}',
                      style: tt.bodyMedium?.copyWith(color: fg.withOpacity(0.8)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  final String text;
  final Color color;
  const _Pill({required this.text, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding:
          const EdgeInsets.symmetric(horizontal: Space.sm, vertical: Space.xs),
      decoration: BoxDecoration(
        border: Border.all(color: color.withOpacity(0.4)),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(text,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: color, fontWeight: FontWeight.w800, letterSpacing: 1.1)),
    );
  }
}
