import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models.dart';
import '../widgets/landscape.dart';

class PlayerScreen extends StatefulWidget {
  final Session session;
  final PracticeState practice;
  const PlayerScreen({super.key, required this.session, required this.practice});
  @override
  State<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends State<PlayerScreen> with WidgetsBindingObserver {
  Timer? timer;
  int elapsed = 0;
  bool playing = false, completed = false;
  int get duration => widget.session.minutes * 60;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!playing || completed) return;
      if (elapsed + 1 >= duration) {
        _finish();
      } else {
        setState(() => elapsed++);
      }
    });
  }

  void _finish() {
    if (completed) return;
    widget.practice.complete(widget.session);
    HapticFeedback.mediumImpact(); // success: the session is recorded
    setState(() { elapsed = duration; playing = false; completed = true; });
  }

  void _skip(int seconds) {
    setState(() => elapsed = (elapsed + seconds).clamp(0, duration - 1).toInt());
  }

  String _time(int value) => '${value ~/ 60}:${(value % 60).toString().padLeft(2, '0')}';

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Keep this foreground practice timer honest when the app is interrupted.
    if (state != AppLifecycleState.resumed && playing) {
      setState(() => playing = false);
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.session;
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    return Scaffold(backgroundColor: cs.surfaceContainerLow, body: SafeArea(child: Center(child: ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 640),
      child: ListView(padding: const EdgeInsets.fromLTRB(24, 8, 24, 32), children: [
        Row(children: [
          IconButton(onPressed: () => Navigator.pop(context), tooltip: 'Close player', icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 32)),
          Expanded(child: Text('A moment for you', textAlign: TextAlign.center, style: tt.bodyMedium)),
          ListenableBuilder(listenable: widget.practice, builder: (context, _) => IconButton(
            tooltip: widget.practice.saved.contains(s.id) ? 'Remove from saved' : 'Save session',
            onPressed: () { HapticFeedback.selectionClick(); widget.practice.toggleSaved(s.id); },
            icon: Icon(widget.practice.saved.contains(s.id) ? Icons.bookmark_rounded : Icons.bookmark_border_rounded))),
        ]),
        const SizedBox(height: 24),
        Center(child: SizedBox(width: 288, height: 288, child: ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(150), bottom: Radius.circular(24)),
          child: Landscape(variant: s.landscape)))),
        const SizedBox(height: 32),
        Text(completed ? 'A little more grounded.' : s.title, textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 8),
        Text(completed ? 'Your ${s.minutes} mindful minutes are recorded.' : '${s.category} · ${s.minutes} min · Silent practice', textAlign: TextAlign.center),
        const SizedBox(height: 24),
        AnimatedSwitcher(duration: const Duration(milliseconds: 300), child: Text(
          completed ? 'Carry this little bit of stillness with you.' : playing ? s.guide : 'Get comfortable. Your practice begins when you’re ready.',
          key: ValueKey('$playing$completed'), textAlign: TextAlign.center,
          style: tt.bodyLarge?.copyWith(height: 1.7, color: cs.onSurfaceVariant))),
        const SizedBox(height: 24),
        if (!completed) ...[
          Slider(value: elapsed.toDouble(), max: duration.toDouble(), label: _time(elapsed),
            semanticFormatterCallback: (value) => '${value ~/ 60} minutes ${value.toInt() % 60} seconds',
            onChanged: (value) => setState(() => elapsed = value.toInt().clamp(0, duration - 1).toInt())),
          Padding(padding: const EdgeInsets.symmetric(horizontal: 24), child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text(_time(elapsed), style: tt.labelMedium), Text(_time(duration), style: tt.labelMedium),
          ])),
          const SizedBox(height: 20),
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            IconButton(onPressed: () => _skip(-10), tooltip: 'Back 10 seconds', icon: const Icon(Icons.replay_10_rounded, size: 28)),
            const SizedBox(width: 28),
            IconButton.filled(onPressed: () { HapticFeedback.lightImpact(); setState(() => playing = !playing); }, tooltip: playing ? 'Pause practice' : 'Start practice',
              style: IconButton.styleFrom(backgroundColor: cs.inverseSurface, foregroundColor: cs.onInverseSurface, minimumSize: const Size(76, 76)),
              icon: Icon(playing ? Icons.pause_rounded : Icons.play_arrow_rounded, size: 38)),
            const SizedBox(width: 28),
            IconButton(onPressed: () => _skip(10), tooltip: 'Forward 10 seconds', icon: const Icon(Icons.forward_10_rounded, size: 28)),
          ]),
          const SizedBox(height: 28),
          Text(s.description, textAlign: TextAlign.center, style: tt.bodyMedium?.copyWith(height: 1.7)),
        ] else ...[
          Center(child: Icon(Icons.check_circle_outline_rounded, color: cs.primary, size: 48)),
          const SizedBox(height: 28),
          FilledButton(onPressed: () => Navigator.pop(context), child: const Text('Return to your day')),
        ],
      ]),
    ))));
  }
}
