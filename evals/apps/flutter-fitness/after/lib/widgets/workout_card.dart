import 'package:flutter/material.dart';

import '../models.dart';
import '../screens/workout_detail_screen.dart';
import '../theme.dart';

/// Full-width gradient card for a workout. Set [large] for the hero variant.
class WorkoutCard extends StatelessWidget {
  final Workout workout;
  final bool large;

  const WorkoutCard({super.key, required this.workout, this.large = false});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => WorkoutDetailScreen(workout: workout)),
      ),
      child: Hero(
        tag: 'workout-${workout.id}',
        child: Material(
          color: Colors.transparent,
          child: Container(
            height: large ? 190 : 130,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: workout.colors,
              ),
              borderRadius: BorderRadius.circular(28),
              boxShadow: [
                BoxShadow(
                  color: workout.colors.first.withOpacity(0.35),
                  blurRadius: 24,
                  offset: const Offset(0, 12),
                ),
              ],
            ),
            child: Stack(
              children: [
                Positioned(
                  right: -10,
                  bottom: -14,
                  child: Icon(workout.icon,
                      size: large ? 130 : 90,
                      color: Colors.white.withOpacity(0.18)),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _Pill(text: workout.category.toUpperCase()),
                    const Spacer(),
                    Text(
                      workout.title,
                      style: TextStyle(
                        fontSize: large ? 28 : 22,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${workout.minutes} min  ·  ${workout.kcal} kcal  ·  ${workout.level}',
                      style: TextStyle(
                          color: Colors.white.withOpacity(0.85), fontSize: 13),
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
  const _Pill({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.25),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(text,
          style: const TextStyle(
              fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.1,
              color: AppColors.lime)),
    );
  }
}
