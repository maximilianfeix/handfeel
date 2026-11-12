import 'package:flutter/material.dart';

import '../theme.dart';
import '../widgets/stat_chip.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _reminders = true;
  bool _metric = true;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final sectionTitle = tt.titleLarge?.copyWith(fontWeight: FontWeight.w800);

    return ListView(
      padding: const EdgeInsets.fromLTRB(
          Space.lg + Space.xs, Space.lg, Space.lg + Space.xs, Space.xl),
      children: [
        Center(
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(Space.xs),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: cs.primary, width: 2),
                ),
                child: CircleAvatar(
                  radius: 48,
                  backgroundColor: cs.surfaceContainerHigh,
                  foregroundColor: cs.onSurface,
                  child: Text('A',
                      style: tt.displaySmall
                          ?.copyWith(fontWeight: FontWeight.w800)),
                ),
              ),
              const SizedBox(height: Space.md),
              Text('Alex Morgan',
                  style:
                      tt.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: Space.xs),
              Text('Member since March 2025',
                  style: tt.bodyMedium?.copyWith(color: cs.onSurfaceVariant)),
            ],
          ),
        ),
        const SizedBox(height: Space.xl),
        const Row(
          children: [
            Expanded(
                child: StatChip(
                    icon: Icons.fitness_center,
                    value: '148',
                    label: 'workouts')),
            SizedBox(width: Space.md),
            Expanded(
                child: StatChip(
                    icon: Icons.local_fire_department,
                    value: '12',
                    label: 'day streak')),
            SizedBox(width: Space.md),
            Expanded(
                child: StatChip(
                    icon: Icons.emoji_events_outlined,
                    value: '9',
                    label: 'badges')),
          ],
        ),
        const SizedBox(height: Space.xl),
        Text('Goals', style: sectionTitle),
        const SizedBox(height: Space.md),
        const _GoalBar(label: 'Weekly workouts', value: 4, max: 5),
        const _GoalBar(label: 'Active minutes / day', value: 42, max: 60),
        const _GoalBar(
            label: 'Weight target', value: 78, max: 75, invert: true),
        const SizedBox(height: Space.lg),
        Text('Settings', style: sectionTitle),
        const SizedBox(height: Space.sm),
        Material(
          color: cs.surfaceContainer,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              SwitchListTile.adaptive(
                value: _reminders,
                onChanged: (v) => setState(() => _reminders = v),
                title: const Text('Workout reminders'),
                secondary: const Icon(Icons.notifications_none),
              ),
              SwitchListTile.adaptive(
                value: _metric,
                onChanged: (v) => setState(() => _metric = v),
                title: const Text('Metric units'),
                secondary: const Icon(Icons.straighten),
              ),
              const ListTile(
                leading: Icon(Icons.lock_outline),
                title: Text('Privacy'),
                trailing: Icon(Icons.chevron_right),
              ),
              ListTile(
                leading: Icon(Icons.logout, color: cs.error),
                title: Text('Sign out', style: TextStyle(color: cs.error)),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _GoalBar extends StatelessWidget {
  final String label;
  final double value;
  final double max;
  final bool invert;
  const _GoalBar(
      {required this.label,
      required this.value,
      required this.max,
      this.invert = false});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    final ratio = invert ? (max / value) : (value / max);
    return Padding(
      padding: const EdgeInsets.only(bottom: Space.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                  child: Text(label,
                      style: tt.bodyMedium
                          ?.copyWith(fontWeight: FontWeight.w600))),
              Text('${value.toStringAsFixed(0)} / ${max.toStringAsFixed(0)}',
                  style: tt.bodyMedium?.copyWith(color: cs.onSurfaceVariant)),
            ],
          ),
          const SizedBox(height: Space.sm),
          ClipRRect(
            borderRadius: BorderRadius.circular(Space.sm),
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: ratio.clamp(0.0, 1.0)),
              duration: reduceMotion
                  ? Duration.zero
                  : const Duration(milliseconds: 900),
              curve: Curves.easeOutCubic,
              builder: (_, t, __) => LinearProgressIndicator(
                value: t,
                minHeight: Space.sm,
                backgroundColor: cs.surfaceContainerHighest,
                color: cs.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
