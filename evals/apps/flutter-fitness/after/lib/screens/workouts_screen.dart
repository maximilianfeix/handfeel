import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../data.dart';
import '../theme.dart';
import '../widgets/workout_card.dart';

class WorkoutsScreen extends StatefulWidget {
  const WorkoutsScreen({super.key});

  @override
  State<WorkoutsScreen> createState() => _WorkoutsScreenState();
}

class _WorkoutsScreenState extends State<WorkoutsScreen> {
  String _filter = 'All';

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final categories = [
      'All',
      ...{for (final w in sampleWorkouts) w.category}
    ];
    final items = _filter == 'All'
        ? sampleWorkouts
        : sampleWorkouts.where((w) => w.category == _filter).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(
              Space.lg + Space.xs, Space.lg, Space.lg + Space.xs, Space.xs),
          child: Text('Workouts',
              style: tt.headlineLarge?.copyWith(
                  fontWeight: FontWeight.w800, letterSpacing: -0.8)),
        ),
        SizedBox(
          // 48 dp chip tap targets plus 8 dp above and below.
          height: 64,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(
                horizontal: Space.lg + Space.xs, vertical: Space.sm),
            itemCount: categories.length,
            separatorBuilder: (_, __) => const SizedBox(width: Space.sm),
            itemBuilder: (_, i) {
              final c = categories[i];
              final selected = c == _filter;
              return ChoiceChip(
                label: Text(c),
                selected: selected,
                showCheckmark: false,
                onSelected: (_) {
                  if (selected) return;
                  HapticFeedback.selectionClick();
                  setState(() => _filter = c);
                },
                backgroundColor: cs.surfaceContainer,
                selectedColor: cs.primary,
                side: BorderSide.none,
                shape: const StadiumBorder(),
                labelStyle: tt.labelLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: selected ? cs.onPrimary : cs.onSurfaceVariant,
                ),
              );
            },
          ),
        ),
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(
                Space.lg + Space.xs, Space.sm, Space.lg + Space.xs, Space.xl),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: Space.lg),
            itemBuilder: (_, i) => WorkoutCard(workout: items[i]),
          ),
        ),
      ],
    );
  }
}
