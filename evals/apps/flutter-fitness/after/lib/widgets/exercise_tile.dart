import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

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
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    final radius = BorderRadius.circular(20);

    return Padding(
      padding: const EdgeInsets.only(bottom: Space.md),
      child: Semantics(
        checked: done,
        child: Material(
          color: done ? cs.primaryContainer : cs.surfaceContainer,
          shape: RoundedRectangleBorder(
            borderRadius: radius,
            side: BorderSide(
                color: done ? cs.primary.withOpacity(0.5) : cs.outlineVariant),
          ),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: () {
              HapticFeedback.selectionClick();
              onToggle();
            },
            child: Padding(
              padding: const EdgeInsets.all(Space.lg),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: cs.surfaceContainerHigh,
                      borderRadius: BorderRadius.circular(Space.lg),
                    ),
                    child: Icon(exercise.icon,
                        color: done ? cs.primary : cs.onSurfaceVariant),
                  ),
                  const SizedBox(width: Space.lg),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          exercise.name,
                          style: tt.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                            decoration:
                                done ? TextDecoration.lineThrough : null,
                            color: done ? cs.onSurfaceVariant : cs.onSurface,
                          ),
                        ),
                        const SizedBox(height: Space.xs),
                        Text(
                          '${exercise.muscle}  ·  ${exercise.sets} x ${exercise.reps}',
                          style: tt.bodyMedium
                              ?.copyWith(color: cs.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                  AnimatedSwitcher(
                    duration: reduceMotion
                        ? Duration.zero
                        : const Duration(milliseconds: 200),
                    child: done
                        ? Icon(Icons.check_circle,
                            key: const ValueKey('d'), color: cs.primary)
                        : Icon(Icons.radio_button_unchecked,
                            key: const ValueKey('u'), color: cs.outline),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
