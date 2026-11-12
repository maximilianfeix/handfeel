import 'package:flutter/material.dart';

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
    final w = widget.workout;
    final total = w.exercises.length;
    final allDone = _done.length == total;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 260,
            pinned: true,
            backgroundColor: w.colors.first,
            flexibleSpace: FlexibleSpaceBar(
              background: Hero(
                tag: 'workout-${w.id}',
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: w.colors,
                    ),
                  ),
                  child: Stack(
                    children: [
                      Positioned(
                        right: -20,
                        bottom: -10,
                        child: Icon(w.icon,
                            size: 200, color: Colors.white.withOpacity(0.15)),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.end,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(w.category.toUpperCase(),
                                style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 1.4,
                                    color: Colors.black87)),
                            const SizedBox(height: 4),
                            Material(
                              color: Colors.transparent,
                              child: Text(w.title,
                                  style: const TextStyle(
                                      fontSize: 36,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: -1)),
                            ),
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
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
              child: Row(
                children: [
                  _Meta(icon: Icons.timer_outlined, text: '${w.minutes} min'),
                  const SizedBox(width: 10),
                  _Meta(
                      icon: Icons.local_fire_department_outlined,
                      text: '${w.kcal} kcal'),
                  const SizedBox(width: 10),
                  _Meta(icon: Icons.signal_cellular_alt, text: w.level),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
              child: Row(
                children: [
                  const Expanded(
                    child: Text('Exercises',
                        style: TextStyle(
                            fontSize: 20, fontWeight: FontWeight.w800)),
                  ),
                  Text('${_done.length}/$total done',
                      style: const TextStyle(color: AppColors.textDim)),
                ],
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
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
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: SizedBox(
        width: MediaQuery.of(context).size.width - 40,
        height: 58,
        child: FilledButton.icon(
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.lime,
            foregroundColor: Colors.black,
            shape: const StadiumBorder(),
          ),
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
              content: Text(allDone
                  ? 'Workout complete. Nice work!'
                  : 'Workout started. Let\'s go!'),
            ));
          },
          icon: Icon(allDone ? Icons.emoji_events : Icons.play_arrow_rounded),
          label: Text(allDone ? 'Finish workout' : 'Start workout',
              style:
                  const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
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
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: AppColors.lime),
          const SizedBox(width: 6),
          Text(text,
              style:
                  const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
