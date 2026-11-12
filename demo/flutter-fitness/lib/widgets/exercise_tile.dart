import 'package:flutter/material.dart';

import '../models.dart';
import '../theme.dart';

class ExerciseTile extends StatelessWidget {
  final int index;
  final Exercise exercise;
  final bool done;
  final VoidCallback onToggle;

  const ExerciseTile({
    super.key,
    required this.index,
    required this.exercise,
    required this.done,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onToggle,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: done ? AppColors.lime.withOpacity(0.10) : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: done
                ? AppColors.lime.withOpacity(0.5)
                : Colors.white.withOpacity(0.05),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.surfaceHigh,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(exercise.icon,
                  color: done ? AppColors.lime : Colors.white70),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    exercise.name,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      decoration: done ? TextDecoration.lineThrough : null,
                      color: done ? Colors.white54 : Colors.white,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${exercise.muscle}  ·  ${exercise.sets} x ${exercise.reps}',
                    style: const TextStyle(
                        fontSize: 13, color: AppColors.textDim),
                  ),
                ],
              ),
            ),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              child: done
                  ? const Icon(Icons.check_circle,
                      key: ValueKey('d'), color: AppColors.lime)
                  : const Icon(Icons.radio_button_unchecked,
                      key: ValueKey('u'), color: Colors.white30),
            ),
          ],
        ),
      ),
    );
  }
}
