import 'package:flutter/material.dart';

import '../data.dart';
import '../theme.dart';
import '../widgets/progress_ring.dart';
import '../widgets/stat_chip.dart';
import '../widgets/weekly_chart.dart';
import '../widgets/workout_card.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final today = sampleWorkouts.first;
    final todayIndex = DateTime.now().weekday - 1;
    const goal = 60.0;
    const done = 42.0;
    final sectionTitle = tt.titleLarge?.copyWith(fontWeight: FontWeight.w800);

    return ListView(
      padding: const EdgeInsets.fromLTRB(
          Space.lg + Space.xs, Space.lg, Space.lg + Space.xs, Space.xl),
      children: [
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_greeting(),
                      style:
                          tt.bodyLarge?.copyWith(color: cs.onSurfaceVariant)),
                  const SizedBox(height: 2),
                  Text('Alex',
                      style: tt.headlineMedium?.copyWith(
                          fontWeight: FontWeight.w800, letterSpacing: -0.8)),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: Space.md, vertical: Space.sm),
              decoration: BoxDecoration(
                color: cs.surfaceContainer,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  Icon(Icons.local_fire_department,
                      color: cs.primary, size: 18),
                  const SizedBox(width: Space.xs),
                  Text('12 day streak',
                      style: tt.labelLarge
                          ?.copyWith(fontWeight: FontWeight.w700)),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: Space.xl),
        Container(
          padding: const EdgeInsets.all(Space.xl),
          decoration: BoxDecoration(
            color: cs.surfaceContainer,
            borderRadius: BorderRadius.circular(28),
          ),
          child: Row(
            children: [
              ProgressRing(
                progress: done / goal,
                size: 128,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('70%',
                        style: tt.headlineMedium
                            ?.copyWith(fontWeight: FontWeight.w800)),
                    Text('of goal',
                        style: tt.bodySmall
                            ?.copyWith(color: cs.onSurfaceVariant)),
                  ],
                ),
              ),
              const SizedBox(width: Space.xl),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Today's progress",
                        style: tt.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800)),
                    const SizedBox(height: Space.sm),
                    Text(
                        '42 of 60 active minutes.\nOne more session to close your ring.',
                        style: tt.bodyMedium?.copyWith(
                            color: cs.onSurfaceVariant, height: 1.4)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: Space.lg),
        const Row(
          children: [
            Expanded(
                child: StatChip(
                    icon: Icons.bolt, value: '1,240', label: 'kcal burned')),
            SizedBox(width: Space.md),
            Expanded(
                child: StatChip(
                    icon: Icons.timer_outlined,
                    value: '42 min',
                    label: 'active')),
            SizedBox(width: Space.md),
            Expanded(
                child: StatChip(
                    icon: Icons.directions_walk,
                    value: '8.4k',
                    label: 'steps')),
          ],
        ),
        const SizedBox(height: Space.xxl),
        Text("Today's workout", style: sectionTitle),
        const SizedBox(height: Space.md),
        WorkoutCard(workout: today, large: true),
        const SizedBox(height: Space.xxl),
        Text('This week', style: sectionTitle),
        const SizedBox(height: Space.md),
        Container(
          padding: const EdgeInsets.all(Space.lg + Space.xs),
          decoration: BoxDecoration(
            color: cs.surfaceContainer,
            borderRadius: BorderRadius.circular(24),
          ),
          child: WeeklyChart(todayIndex: todayIndex),
        ),
      ],
    );
  }
}
