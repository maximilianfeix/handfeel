import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models.dart';
import '../theme.dart';
import '../widgets/exercise_tile.dart';

class WorkoutDetailScreen extends StatefulWidget {
  final Workout workout;
  const WorkoutDetailScreen({super.key, required this.workout});

  @override
  State<WorkoutDetailScreen> createState() => _WorkoutDetailScreenState();
}

class _WorkoutDetailScreenState extends State<WorkoutDetailScreen> {
  final Set<int> _done = {};

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final w = widget.workout;
    final fg = w.tone.onColor;
    final total = w.exercises.length;
    final allDone = _done.length == total;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 260,
            pinned: true,
            backgroundColor: w.tone.color,
            foregroundColor: fg,
            flexibleSpace: FlexibleSpaceBar(
              background: Hero(
                tag: 'workout-${w.id}',
                child: Material(
                  color: w.tone.color,
                  child: Stack(
                    children: [
                      Positioned(
                        right: -20,
                        bottom: -8,
                        child: ExcludeSemantics(
                          child: Icon(w.icon,
                              size: 200, color: fg.withOpacity(0.12)),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(Space.lg + Space.xs,
                            0, Space.lg + Space.xs, Space.xl),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.end,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(w.category.toUpperCase(),
                                style: tt.labelMedium?.copyWith(
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 1.4,
                                    color: fg.withOpacity(0.8))),
                            const SizedBox(height: Space.xs),
                            Text(w.title,
                                style: tt.displaySmall?.copyWith(
                                    color: fg,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: -1)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(Space.lg + Space.xs,
                  Space.lg + Space.xs, Space.lg + Space.xs, Space.sm),
              child: Wrap(
                spacing: Space.sm,
                runSpacing: Space.sm,
                children: [
                  _Meta(icon: Icons.timer_outlined, text: '${w.minutes} min'),
                  _Meta(
                      icon: Icons.local_fire_department_outlined,
                      text: '${w.kcal} kcal'),
                  _Meta(icon: Icons.signal_cellular_alt, text: w.level),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(Space.lg + Space.xs,
                  Space.lg, Space.lg + Space.xs, Space.md),
              child: Row(
                children: [
                  Expanded(
                    child: Text('Exercises',
                        style: tt.titleLarge
                            ?.copyWith(fontWeight: FontWeight.w800)),
                  ),
                  Text('${_done.length}/$total done',
                      style:
                          tt.bodyMedium?.copyWith(color: cs.onSurfaceVariant)),
                ],
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(
                Space.lg + Space.xs, 0, Space.lg + Space.xs, Space.lg),
            sliver: SliverList.builder(
              itemCount: total,
              itemBuilder: (_, i) => ExerciseTile(
                index: i,
                exercise: w.exercises[i],
                done: _done.contains(i),
                onToggle: () => setState(() {
                  if (!_done.remove(i)) _done.add(i);
                }),
              ),
            ),
          ),
        ],
      ),
      // Primary action pinned above the home indicator, inside the safe area.
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
              Space.lg + Space.xs, Space.sm, Space.lg + Space.xs, Space.md),
          child: FilledButton.icon(
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(56),
              shape: const StadiumBorder(),
              textStyle: tt.labelLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            onPressed: () {
              if (allDone) {
                HapticFeedback.mediumImpact();
              } else {
                HapticFeedback.lightImpact();
              }
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                content: Text(allDone
                    ? 'Workout complete. Nice work!'
                    : 'Workout started. Let\'s go!'),
              ));
            },
            icon: Icon(allDone ? Icons.emoji_events : Icons.play_arrow_rounded),
            label: Text(allDone ? 'Finish workout' : 'Start workout'),
          ),
        ),
      ),
    );
  }
}

class _Meta extends StatelessWidget {
  final IconData icon;
  final String text;
  const _Meta({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding:
          const EdgeInsets.symmetric(horizontal: Space.md, vertical: Space.sm),
      decoration: BoxDecoration(
        color: cs.surfaceContainer,
        borderRadius: BorderRadius.circular(Space.lg),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: cs.onSurfaceVariant),
          const SizedBox(width: Space.sm),
          Text(text,
              style: Theme.of(context)
                  .textTheme
                  .labelLarge
                  ?.copyWith(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
