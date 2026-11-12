import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'models.dart';
import 'screens/home.dart';
import 'screens/library.dart';
import 'screens/player.dart';
import 'screens/profile.dart';
import 'theme.dart';

void main() => runApp(const StillApp());

class StillApp extends StatelessWidget {
  const StillApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Still — a little space for yourself',
    debugShowCheckedModeBanner: false,
    theme: buildTheme(Brightness.light),
    darkTheme: buildTheme(Brightness.dark),
    home: const PracticeShell(),
  );
}

class PracticeShell extends StatefulWidget {
  const PracticeShell({super.key});
  @override
  State<PracticeShell> createState() => _PracticeShellState();
}

class _PracticeShellState extends State<PracticeShell> {
  final practice = PracticeState();
  int selected = 0;
  void _select(int value) => setState(() => selected = value);

  void _open(Session session) {
    Navigator.of(context).push(MaterialPageRoute<void>(
      builder: (_) => PlayerScreen(session: session, practice: practice),
      fullscreenDialog: true,
    ));
  }

  @override
  void dispose() { practice.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => ListenableBuilder(listenable: practice, builder: (context, _) => LayoutBuilder(
    builder: (context, constraints) {
      final wide = constraints.maxWidth >= 900;
      final content = SafeArea(child: Center(child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 780),
        child: IndexedStack(index: selected, children: [
          HomeScreen(practice: practice, onOpen: _open, onLibrary: () => _select(1), onProfile: () => _select(3)),
          LibraryScreen(key: const ValueKey('library'), practice: practice, onOpen: _open),
          LibraryScreen(key: const ValueKey('saved'), practice: practice, onOpen: _open, savedOnly: true),
          ProfileScreen(practice: practice, onExplore: () => _select(1)),
        ]),
      )));
      final cs = Theme.of(context).colorScheme;
      final isCupertino = switch (Theme.of(context).platform) {
        TargetPlatform.iOS || TargetPlatform.macOS => true,
        _ => false,
      };
      return Scaffold(
        body: wide ? Row(children: [
          NavigationRail(selectedIndex: selected, onDestinationSelected: _select,
            backgroundColor: cs.surfaceContainerLowest, labelType: NavigationRailLabelType.all,
            leading: Padding(padding: const EdgeInsets.symmetric(vertical: 24), child: Icon(Icons.spa_outlined, color: cs.primary, size: 32)),
            destinations: const [
              NavigationRailDestination(icon: Icon(Icons.wb_sunny_outlined), selectedIcon: Icon(Icons.wb_sunny_rounded), label: Text('Today')),
              NavigationRailDestination(icon: Icon(Icons.grid_view_outlined), selectedIcon: Icon(Icons.grid_view_rounded), label: Text('Explore')),
              NavigationRailDestination(icon: Icon(Icons.bookmark_border_rounded), selectedIcon: Icon(Icons.bookmark_rounded), label: Text('Saved')),
              NavigationRailDestination(icon: Icon(Icons.person_outline_rounded), selectedIcon: Icon(Icons.person_rounded), label: Text('You')),
            ]),
          const VerticalDivider(width: 1), Expanded(child: content),
        ]) : content,
        bottomNavigationBar: wide ? null : isCupertino
          // iOS: a native tab bar (it adds the home-indicator inset itself).
          ? CupertinoTabBar(currentIndex: selected, onTap: _select,
              activeColor: cs.primary, inactiveColor: cs.onSurfaceVariant,
              backgroundColor: cs.surfaceContainerLowest,
              border: Border(top: BorderSide(color: cs.outlineVariant)),
              items: const [
                BottomNavigationBarItem(icon: Icon(Icons.wb_sunny_outlined), activeIcon: Icon(Icons.wb_sunny_rounded), label: 'Today'),
                BottomNavigationBarItem(icon: Icon(Icons.grid_view_outlined), activeIcon: Icon(Icons.grid_view_rounded), label: 'Explore'),
                BottomNavigationBarItem(icon: Icon(Icons.bookmark_border_rounded), activeIcon: Icon(Icons.bookmark_rounded), label: 'Saved'),
                BottomNavigationBarItem(icon: Icon(Icons.person_outline_rounded), activeIcon: Icon(Icons.person_rounded), label: 'You'),
              ])
          : DecoratedBox(
          decoration: BoxDecoration(border: Border(top: BorderSide(color: cs.outlineVariant))),
          child: NavigationBar(selectedIndex: selected, onDestinationSelected: _select,
            backgroundColor: cs.surfaceContainerLowest, surfaceTintColor: Colors.transparent,
            elevation: 0, height: 76,
            labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
            destinations: [
              NavigationDestination(icon: const Icon(Icons.wb_sunny_outlined), selectedIcon: Icon(Icons.wb_sunny_rounded, color: cs.primary), label: 'Today'),
              NavigationDestination(icon: const Icon(Icons.grid_view_outlined), selectedIcon: Icon(Icons.grid_view_rounded, color: cs.primary), label: 'Explore'),
              NavigationDestination(icon: const Icon(Icons.bookmark_border_rounded), selectedIcon: Icon(Icons.bookmark_rounded, color: cs.primary), label: 'Saved'),
              NavigationDestination(icon: const Icon(Icons.person_outline_rounded), selectedIcon: Icon(Icons.person_rounded, color: cs.primary), label: 'You'),
            ]),
        ),
      );
    },
  ));
}
