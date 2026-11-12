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
    theme: buildTheme(),
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
      return Scaffold(
        body: wide ? Row(children: [
          NavigationRail(selectedIndex: selected, onDestinationSelected: _select,
            backgroundColor: Colors.white, labelType: NavigationRailLabelType.all,
            indicatorColor: StillColors.lavender,
            leading: const Padding(padding: EdgeInsets.symmetric(vertical: 24), child: Icon(Icons.spa_outlined, color: StillColors.purple, size: 32)),
            destinations: const [
              NavigationRailDestination(icon: Icon(Icons.wb_sunny_outlined), selectedIcon: Icon(Icons.wb_sunny_rounded), label: Text('Today')),
              NavigationRailDestination(icon: Icon(Icons.grid_view_outlined), selectedIcon: Icon(Icons.grid_view_rounded), label: Text('Explore')),
              NavigationRailDestination(icon: Icon(Icons.bookmark_border_rounded), selectedIcon: Icon(Icons.bookmark_rounded), label: Text('Saved')),
              NavigationRailDestination(icon: Icon(Icons.person_outline_rounded), selectedIcon: Icon(Icons.person_rounded), label: Text('You')),
            ]),
          const VerticalDivider(width: 1), Expanded(child: content),
        ]) : content,
        bottomNavigationBar: wide ? null : Container(
          decoration: const BoxDecoration(border: Border(top: BorderSide(color: StillColors.line))),
          child: NavigationBar(selectedIndex: selected, onDestinationSelected: _select,
            backgroundColor: Colors.white, surfaceTintColor: Colors.transparent,
            indicatorColor: StillColors.lavender, elevation: 0, height: 76,
            labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
            destinations: const [
              NavigationDestination(icon: Icon(Icons.wb_sunny_outlined), selectedIcon: Icon(Icons.wb_sunny_rounded, color: StillColors.purple), label: 'Today'),
              NavigationDestination(icon: Icon(Icons.grid_view_outlined), selectedIcon: Icon(Icons.grid_view_rounded, color: StillColors.purple), label: 'Explore'),
              NavigationDestination(icon: Icon(Icons.bookmark_border_rounded), selectedIcon: Icon(Icons.bookmark_rounded, color: StillColors.purple), label: 'Saved'),
              NavigationDestination(icon: Icon(Icons.person_outline_rounded), selectedIcon: Icon(Icons.person_rounded, color: StillColors.purple), label: 'You'),
            ]),
        ),
      );
    },
  ));
}
