import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models.dart';
import 'landscape.dart';

class PageHeading extends StatelessWidget {
  final String title, subtitle;
  final Widget? trailing;
  const PageHeading({super.key, required this.title, required this.subtitle, this.trailing});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 16, bottom: 28),
    child: Row(children: [Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: Theme.of(context).textTheme.headlineLarge),
      const SizedBox(height: 8), Text(subtitle),
    ])), if (trailing != null) trailing!]),
  );
}

class SectionHeading extends StatelessWidget {
  final String title;
  final String? action;
  final VoidCallback? onTap;
  const SectionHeading(this.title, {super.key, this.action, this.onTap});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 28, bottom: 16),
    child: Row(children: [Expanded(child: Text(title, style: Theme.of(context).textTheme.titleLarge)),
      if (action != null) TextButton(onPressed: onTap, child: Text(action!)),
    ]),
  );
}

class SessionCard extends StatelessWidget {
  final Session session;
  final VoidCallback onTap;
  const SessionCard({super.key, required this.session, required this.onTap});
  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Semantics(
    button: true,
    label: '${session.title}, ${session.minutes} minutes, ${session.category}',
    child: Material(color: Colors.transparent, child: InkWell(
      borderRadius: BorderRadius.circular(18), onTap: onTap,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        AspectRatio(aspectRatio: 1.5, child: ClipRRect(borderRadius: BorderRadius.circular(18),
          child: Landscape(variant: session.landscape, child: Align(alignment: Alignment.bottomRight,
            child: Padding(padding: const EdgeInsets.all(12), child: Container(
              padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: cs.surfaceContainerLowest, shape: BoxShape.circle),
              child: Icon(Icons.play_arrow_rounded, color: cs.onSurface, size: 20),
            )),
          )),
        )),
        Padding(padding: const EdgeInsets.only(top: 12), child: Text(session.title, style: Theme.of(context).textTheme.titleMedium)),
        const SizedBox(height: 4),
        Text('${session.category} · ${session.minutes} min', style: Theme.of(context).textTheme.bodySmall),
      ]),
    )),
  );
  }
}

class SessionRow extends StatelessWidget {
  final Session session;
  final bool saved;
  final VoidCallback onTap, onSave;
  const SessionRow({super.key, required this.session, required this.saved, required this.onTap, required this.onSave});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Material(color: Theme.of(context).colorScheme.surfaceContainerLowest, borderRadius: BorderRadius.circular(16), child: InkWell(
      onTap: onTap, borderRadius: BorderRadius.circular(16),
      child: Padding(padding: const EdgeInsets.all(12), child: Row(children: [
        SizedBox(width: 72, height: 76, child: ClipRRect(borderRadius: BorderRadius.circular(12), child: Landscape(variant: session.landscape))),
        const SizedBox(width: 16),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(session.title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8), Text('${session.category} · ${session.minutes} min', style: Theme.of(context).textTheme.bodySmall),
        ])),
        IconButton(tooltip: saved ? 'Remove from saved' : 'Save session',
          onPressed: () { HapticFeedback.selectionClick(); onSave(); },
          icon: Icon(saved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded, size: 20, color: Theme.of(context).colorScheme.primary)),
      ])),
    )),
  );
}
