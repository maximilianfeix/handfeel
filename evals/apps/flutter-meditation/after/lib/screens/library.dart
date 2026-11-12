import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models.dart';
import '../widgets/common.dart';

class LibraryScreen extends StatefulWidget {
  final PracticeState practice;
  final ValueChanged<Session> onOpen;
  final bool savedOnly;
  const LibraryScreen({super.key, required this.practice, required this.onOpen, this.savedOnly = false});
  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> {
  String category = 'All', query = '';
  @override
  Widget build(BuildContext context) {
    final filtered = sessions.where((s) =>
      (!widget.savedOnly || widget.practice.saved.contains(s.id)) &&
      (category == 'All' || s.category == category) &&
      '${s.title} ${s.category}'.toLowerCase().contains(query.toLowerCase())).toList();
    final cs = Theme.of(context).colorScheme;
    return CustomScrollView(slivers: [SliverPadding(padding: const EdgeInsets.symmetric(horizontal: 24), sliver: SliverList(delegate: SliverChildListDelegate([
      PageHeading(title: widget.savedOnly ? 'Your quiet corner' : 'Find your moment', subtitle: widget.savedOnly ? 'The sessions you want to come back to.' : 'A little support for whatever today brings.'),
      TextField(onChanged: (value) => setState(() => query = value),
        textInputAction: TextInputAction.search,
        decoration: InputDecoration(hintText: 'Search sessions', prefixIcon: const Icon(Icons.search_rounded, size: 22),
          filled: true, fillColor: cs.surfaceContainerHigh, contentPadding: const EdgeInsets.all(16),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none))),
      const SizedBox(height: 20),
      SingleChildScrollView(scrollDirection: Axis.horizontal, child: Row(children: [
        for (final item in ['All', 'Mindfulness', 'Sleep', 'Breathwork', 'Focus'])
          Padding(padding: const EdgeInsets.only(right: 8), child: ChoiceChip(label: Text(item), selected: category == item,
            onSelected: (_) {
              if (category != item) HapticFeedback.selectionClick();
              setState(() => category = item);
            }, showCheckmark: false,
            selectedColor: cs.inverseSurface, backgroundColor: Colors.transparent,
            labelStyle: TextStyle(color: category == item ? cs.onInverseSurface : cs.onSurfaceVariant),
            side: BorderSide(color: category == item ? cs.inverseSurface : cs.outlineVariant),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)))),
      ])),
      SectionHeading(widget.savedOnly ? 'Saved sessions' : category == 'All' ? 'Explore the library' : category),
      if (filtered.isEmpty) Padding(padding: const EdgeInsets.symmetric(vertical: 48), child: Column(children: [
        Icon(widget.savedOnly ? Icons.bookmark_border_rounded : Icons.search_off_rounded, size: 44, color: cs.primary),
        const SizedBox(height: 16), Text(widget.savedOnly && query.isEmpty && category == 'All' ? 'A space for your favorites' : 'No sessions found', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 8), Text(widget.savedOnly && query.isEmpty && category == 'All' ? 'Tap the bookmark beside any session to save it here.' : 'Try another search or choose a different category.', textAlign: TextAlign.center),
      ])),
    ]))),
    SliverPadding(padding: const EdgeInsets.fromLTRB(24, 0, 24, 32), sliver: SliverList(delegate: SliverChildBuilderDelegate((context, index) {
      final session = filtered[index];
      return SessionRow(session: session, saved: widget.practice.saved.contains(session.id),
        onTap: () => widget.onOpen(session), onSave: () => widget.practice.toggleSaved(session.id));
    }, childCount: filtered.length))),
    ]);
  }
}
