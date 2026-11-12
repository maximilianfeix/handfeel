import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models.dart';
import '../theme.dart';
import '../widgets/common.dart';
import '../widgets/landscape.dart';

class HomeScreen extends StatelessWidget {
  final PracticeState practice;
  final ValueChanged<Session> onOpen;
  final VoidCallback onLibrary, onProfile;
  const HomeScreen({super.key, required this.practice, required this.onOpen, required this.onLibrary, required this.onProfile});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    return ListView(padding: const EdgeInsets.fromLTRB(24, 12, 24, 32), children: [
      Row(children: [
        Icon(Icons.spa_outlined, size: 24, color: cs.primary),
        const SizedBox(width: 8),
        Text('still', style: theme.headlineSmall),
        const Spacer(),
        TextButton.icon(onPressed: onProfile, icon: const Icon(Icons.local_fire_department_outlined, size: 20),
          label: Text('${practice.streak} day streak'),
          style: TextButton.styleFrom(foregroundColor: cs.primary, backgroundColor: cs.secondaryContainer, padding: const EdgeInsets.symmetric(horizontal: 16))),
      ]),
      const SizedBox(height: 32),
      Text(_greeting(), style: theme.bodyMedium),
      const SizedBox(height: 8),
      Text('A little space\nfor yourself.', style: theme.headlineLarge),
      const SizedBox(height: 12),
      const Text('Slow down. Breathe. Begin again.'),
      const SizedBox(height: 28),
      _DailySession(onTap: () => onOpen(sessions.first)),
      const SizedBox(height: 28),
      Text('How are you feeling?', style: theme.titleLarge),
      const SizedBox(height: 8),
      Text(practice.mood == null ? 'Take a moment to check in with yourself.' : 'Feeling ${practice.mood!.toLowerCase()} is welcome here.'),
      const SizedBox(height: 16),
      LayoutBuilder(builder: (context, constraints) => Row(mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          for (final entry in <(String, IconData)>[
            ('Great', Icons.sentiment_very_satisfied_rounded),
            ('Good', Icons.sentiment_satisfied_alt_rounded),
            ('Okay', Icons.sentiment_neutral_rounded),
            ('Low', Icons.sentiment_dissatisfied_rounded),
            ('Stressed', Icons.sentiment_very_dissatisfied_rounded),
          ])
            _MoodChoice(label: entry.$1, icon: entry.$2, selected: practice.mood == entry.$1,
              compact: constraints.maxWidth < 330, onTap: () {
                if (practice.mood != entry.$1) HapticFeedback.selectionClick();
                practice.checkIn(entry.$1);
              }),
        ],
      )),
      SectionHeading('Made for this moment', action: 'View all', onTap: onLibrary),
      LayoutBuilder(builder: (context, constraints) {
        final count = constraints.maxWidth > 700 ? 3 : 2;
        final items = [sessions[1], sessions[2], sessions[3]];
        return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          for (var i = 0; i < count; i++) ...[
            if (i > 0) const SizedBox(width: 16),
            Expanded(child: SessionCard(session: items[i], onTap: () => onOpen(items[i]))),
          ],
        ]);
      }),
      const SizedBox(height: 32),
      Container(padding: const EdgeInsets.all(20), decoration: BoxDecoration(color: cs.surfaceContainer, borderRadius: BorderRadius.circular(16)),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(Icons.wb_sunny_outlined, color: cs.primary, size: 24),
          const SizedBox(width: 16), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Small moments. Meaningful change.', style: theme.titleMedium),
            const SizedBox(height: 4), Text('A few mindful minutes can be a beautiful place to start.', style: theme.bodyMedium?.copyWith(height: 1.6)),
          ])),
        ])),
    ]);
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  }
}

class _DailySession extends StatelessWidget {
  final VoidCallback onTap;
  const _DailySession({required this.onTap});
  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    return Container(
    decoration: BoxDecoration(color: cs.secondaryContainer, borderRadius: BorderRadius.circular(24)),
    clipBehavior: Clip.antiAlias,
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SizedBox(height: 180, width: double.infinity, child: Landscape(child: Padding(
        padding: const EdgeInsets.all(20), child: Align(alignment: Alignment.topLeft, child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          // Sits on light artwork in both modes, so it keeps a light chip.
          decoration: BoxDecoration(color: StillChip.background, borderRadius: BorderRadius.circular(20)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.auto_awesome_outlined, size: 16, color: StillChip.accent), const SizedBox(width: 8), Text('Your daily moment', style: tt.labelSmall?.copyWith(color: StillChip.foreground))]),
        )),
      ))),
      Padding(padding: const EdgeInsets.fromLTRB(24, 20, 24, 24), child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('A little more present', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text('Mindfulness · 10 min', style: tt.bodyMedium),
        ])),
        const SizedBox(width: 8),
        IconButton.filled(onPressed: onTap, tooltip: 'Start your daily session',
          style: IconButton.styleFrom(backgroundColor: cs.inverseSurface, foregroundColor: cs.onInverseSurface, minimumSize: const Size(52, 52)),
          icon: const Icon(Icons.play_arrow_rounded, size: 28)),
      ])),
    ]),
  );
  }
}

class _MoodChoice extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected, compact;
  final VoidCallback onTap;
  const _MoodChoice({required this.label, required this.icon, required this.selected, required this.compact, required this.onTap});
  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Semantics(selected: selected, button: true, label: 'Feeling $label', child: InkWell(
    borderRadius: BorderRadius.circular(16), onTap: onTap,
    child: Padding(padding: const EdgeInsets.symmetric(vertical: 4), child: Column(children: [
      AnimatedContainer(duration: const Duration(milliseconds: 180), width: compact ? 46 : 54, height: compact ? 46 : 54,
        decoration: BoxDecoration(color: selected ? cs.primary : cs.surfaceContainerHigh, shape: BoxShape.circle),
        child: Icon(icon, size: 28, color: selected ? cs.onPrimary : cs.onSurfaceVariant)),
      const SizedBox(height: 8), Text(label, style: Theme.of(context).textTheme.labelSmall?.copyWith(color: selected ? cs.primary : cs.onSurfaceVariant, fontWeight: selected ? FontWeight.w600 : FontWeight.w400)),
    ])),
  ));
  }
}
