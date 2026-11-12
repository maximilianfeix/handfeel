import 'package:flutter/material.dart';
import '../models.dart';
import '../widgets/common.dart';

class ProfileScreen extends StatelessWidget {
  final PracticeState practice;
  final VoidCallback onExplore;
  const ProfileScreen({super.key, required this.practice, required this.onExplore});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final monday = today.subtract(Duration(days: today.weekday - 1));
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    return ListView(padding: const EdgeInsets.fromLTRB(24, 0, 24, 32), children: [
      const PageHeading(title: 'Your practice', subtitle: 'Every time you show up, it counts.'),
      Row(children: [
        Container(width: 64, height: 64, decoration: BoxDecoration(color: cs.secondaryContainer, shape: BoxShape.circle),
          child: Icon(Icons.spa_outlined, color: cs.primary, size: 32)),
        const SizedBox(width: 16),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('A mindful beginning', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4), const Text('Growing at your own pace'),
        ])),
      ]),
      const SizedBox(height: 28),
      Container(padding: const EdgeInsets.all(24), decoration: BoxDecoration(color: cs.secondaryContainer, borderRadius: BorderRadius.circular(24)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(Icons.local_fire_department_outlined, color: cs.primary, size: 24), const SizedBox(width: 8),
          Text('${practice.streak} day streak', style: Theme.of(context).textTheme.titleLarge),
        ]),
        const SizedBox(height: 8),
        Text(practice.streak == 0 ? 'Your next moment of stillness starts a new streak.' : 'A little consistency, a little more calm.'),
        const SizedBox(height: 24),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          for (var i = 0; i < 7; i++) _Day(
            label: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i],
            date: monday.add(Duration(days: i)),
            done: practice.practicedOn(monday.add(Duration(days: i))),
            today: today,
          ),
        ]),
      ])),
      const SizedBox(height: 20),
      Row(children: [
        Expanded(child: _Stat(value: '${practice.totalMinutes}', label: 'Mindful minutes', icon: Icons.schedule_rounded)),
        const SizedBox(width: 16),
        Expanded(child: _Stat(value: '${practice.completions.length}', label: 'Sessions completed', icon: Icons.self_improvement_rounded)),
      ]),
      const SectionHeading('A gentle reminder'),
      Text('You don’t have to quiet every thought. Simply noticing is already part of the practice.', style: tt.bodyLarge?.copyWith(height: 1.8, color: cs.onSurfaceVariant)),
      const SectionHeading('Recent moments'),
      if (practice.completions.isEmpty)
        Container(padding: const EdgeInsets.all(24), decoration: BoxDecoration(color: cs.surfaceContainerLowest, borderRadius: BorderRadius.circular(16)), child: Column(children: [
          Icon(Icons.waves_rounded, color: cs.primary, size: 32),
          const SizedBox(height: 12), Text('Your story starts with a breath', style: Theme.of(context).textTheme.titleMedium, textAlign: TextAlign.center),
          const SizedBox(height: 8), const Text('Complete a session and watch your practice grow.', textAlign: TextAlign.center),
          const SizedBox(height: 20), FilledButton(onPressed: onExplore, child: const Text('Find a session')),
        ]))
      else
        ...practice.completions.reversed.take(5).map((date) => Padding(
          padding: const EdgeInsets.only(bottom: 16), child: Row(children: [
            Icon(Icons.check_circle_outline_rounded, color: cs.primary), const SizedBox(width: 12),
            Expanded(child: Text('A moment of mindfulness', style: Theme.of(context).textTheme.titleMedium)),
            Text('${date.day}/${date.month}', style: tt.bodyMedium),
          ]),
        )),
      const SizedBox(height: 28),
      Center(child: Text('Your practice and saved sessions stay in memory\nfor this app visit. A fresh start is always welcome.',
        textAlign: TextAlign.center, style: tt.bodySmall?.copyWith(height: 1.7))),
    ]);
  }
}

class _Stat extends StatelessWidget {
  final String value, label;
  final IconData icon;
  const _Stat({required this.value, required this.label, required this.icon});
  @override
  Widget build(BuildContext context) => Container(padding: const EdgeInsets.all(20), decoration: BoxDecoration(color: Theme.of(context).colorScheme.surfaceContainerLowest, borderRadius: BorderRadius.circular(16)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Icon(icon, color: Theme.of(context).colorScheme.primary, size: 24), const SizedBox(height: 16),
      Text(value, style: Theme.of(context).textTheme.headlineMedium), const SizedBox(height: 4),
      Text(label, style: Theme.of(context).textTheme.bodySmall),
    ]));
}

class _Day extends StatelessWidget {
  final String label;
  final DateTime date, today;
  final bool done;
  const _Day({required this.label, required this.date, required this.today, required this.done});
  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    return Semantics(
    label: '${date.day}/${date.month}: ${done ? 'Practice completed' : 'No practice'}${date == today ? ', today' : ''}',
    child: Column(children: [
      Text(label, style: tt.labelMedium), const SizedBox(height: 8),
      Container(width: 32, height: 32, decoration: BoxDecoration(
        color: done ? cs.primary : cs.surfaceContainerLowest, shape: BoxShape.circle,
        border: date == today ? Border.all(color: cs.primary, width: 1.5) : null),
        child: done ? Icon(Icons.check_rounded, color: cs.onPrimary, size: 16) : Center(child: Text('${date.day}', style: tt.labelSmall?.copyWith(fontWeight: FontWeight.w400)))),
    ]),
  );
  }
}
