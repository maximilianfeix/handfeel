import 'package:flutter/material.dart';
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
    return ListView(padding: const EdgeInsets.fromLTRB(24, 12, 24, 32), children: [
      Row(children: [
        const Icon(Icons.spa_outlined, size: 26, color: StillColors.purple),
        const SizedBox(width: 8),
        const Text('still', style: TextStyle(fontSize: 25, fontWeight: FontWeight.w600, letterSpacing: -1, color: StillColors.ink)),
        const Spacer(),
        TextButton.icon(onPressed: onProfile, icon: const Icon(Icons.local_fire_department_outlined, size: 19),
          label: Text('${practice.streak} day streak'),
          style: TextButton.styleFrom(foregroundColor: StillColors.purple, backgroundColor: StillColors.lavender, padding: const EdgeInsets.symmetric(horizontal: 14))),
      ]),
      const SizedBox(height: 30),
      Text(_greeting(), style: theme.bodyMedium),
      const SizedBox(height: 6),
      Text('A little space\nfor yourself.', style: theme.headlineLarge),
      const SizedBox(height: 12),
      const Text('Slow down. Breathe. Begin again.'),
      const SizedBox(height: 28),
      _DailySession(onTap: () => onOpen(sessions.first)),
      const SizedBox(height: 28),
      Text('How are you feeling?', style: theme.titleLarge),
      const SizedBox(height: 6),
      Text(practice.mood == null ? 'Take a moment to check in with yourself.' : 'Feeling ${practice.mood!.toLowerCase()} is welcome here.'),
      const SizedBox(height: 18),
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
              compact: constraints.maxWidth < 330, onTap: () => practice.checkIn(entry.$1)),
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
      const SizedBox(height: 30),
      Container(padding: const EdgeInsets.all(20), decoration: BoxDecoration(color: const Color(0xFFEEEFF3), borderRadius: BorderRadius.circular(16)),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Icon(Icons.wb_sunny_outlined, color: StillColors.purple, size: 24),
          const SizedBox(width: 14), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Small moments. Meaningful change.', style: theme.titleMedium),
            const SizedBox(height: 5), const Text('A few mindful minutes can be a beautiful place to start.', style: TextStyle(fontSize: 13, height: 1.6, color: StillColors.muted)),
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
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(color: const Color(0xFFECE6F4), borderRadius: BorderRadius.circular(24)),
    clipBehavior: Clip.antiAlias,
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SizedBox(height: 180, width: double.infinity, child: Landscape(child: Padding(
        padding: const EdgeInsets.all(20), child: Align(alignment: Alignment.topLeft, child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(color: Colors.white.withOpacity(.8), borderRadius: BorderRadius.circular(20)),
          child: const Row(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.auto_awesome_outlined, size: 14, color: StillColors.purple), SizedBox(width: 6), Text('Your daily moment', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: StillColors.ink))]),
        )),
      ))),
      Padding(padding: const EdgeInsets.fromLTRB(22, 20, 22, 22), child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('A little more present', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 7),
          const Text('Mindfulness · 10 min', style: TextStyle(fontSize: 13, color: Color(0xFF6A607B))),
        ])),
        const SizedBox(width: 8),
        IconButton.filled(onPressed: onTap, tooltip: 'Start your daily session',
          style: IconButton.styleFrom(backgroundColor: StillColors.ink, foregroundColor: Colors.white, minimumSize: const Size(52, 52)),
          icon: const Icon(Icons.play_arrow_rounded, size: 28)),
      ])),
    ]),
  );
}

class _MoodChoice extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected, compact;
  final VoidCallback onTap;
  const _MoodChoice({required this.label, required this.icon, required this.selected, required this.compact, required this.onTap});
  @override
  Widget build(BuildContext context) => Semantics(selected: selected, button: true, label: 'Feeling $label', child: InkWell(
    borderRadius: BorderRadius.circular(16), onTap: onTap,
    child: Padding(padding: const EdgeInsets.symmetric(vertical: 4), child: Column(children: [
      AnimatedContainer(duration: const Duration(milliseconds: 180), width: compact ? 46 : 54, height: compact ? 46 : 54,
        decoration: BoxDecoration(color: selected ? StillColors.purple : const Color(0xFFF0EDF5), shape: BoxShape.circle),
        child: Icon(icon, size: 28, color: selected ? Colors.white : const Color(0xFF8A7D9F))),
      const SizedBox(height: 8), Text(label, style: TextStyle(fontSize: 11, color: selected ? StillColors.purple : StillColors.muted, fontWeight: selected ? FontWeight.w600 : FontWeight.w400)),
    ])),
  ));
}
