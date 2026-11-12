import 'package:flutter/material.dart';
import 'theme.dart';

class Session {
  final String id, title, category, description, guide;
  final int minutes, landscape;
  final Color color;
  const Session(this.id, this.title, this.category, this.minutes, this.description,
      this.guide, this.color, this.landscape);
}

const sessions = <Session>[
  Session('daily', 'A little more present', 'Mindfulness', 10,
      'Let the rush of the day soften. Find a comfortable seat and come back to what’s here, one breath at a time.',
      'Notice your breath. There is nothing to change.', SessionTints.lavender, 0),
  Session('morning', 'An unhurried morning', 'Mindfulness', 8,
      'Make a little space before the day begins. Settle into your breath and choose an intention to carry with you.',
      'Let this breath be a fresh beginning.', SessionTints.sand, 1),
  Session('sleep', 'Drift into stillness', 'Sleep', 15,
      'Release the day and ease into rest. Allow your shoulders to soften and your body to feel supported.',
      'With each exhale, let the day fall away.', SessionTints.dusk, 2),
  Session('breathe', 'Room to breathe', 'Breathwork', 5,
      'A simple pause to find your balance. Breathe gently in for four counts and out for six, at your own pace.',
      'Breathe in gently. Breathe out a little longer.', SessionTints.sage, 3),
  Session('focus', 'One thing at a time', 'Focus', 12,
      'Gather your attention and gently return to the present. You can always begin again.',
      'Notice where your mind wanders. Gently return.', SessionTints.rose, 1),
  Session('reset', 'The afternoon reset', 'Mindfulness', 6,
      'Step away from doing for a moment. Notice your body, relax your jaw, and make room for a softer afternoon.',
      'Feel your feet on the ground. You are here.', SessionTints.lavender, 0),
];

class PracticeState extends ChangeNotifier {
  final Set<String> saved = {'sleep'};
  final List<DateTime> completions = [];
  int totalMinutes = 0;
  String? mood;

  void toggleSaved(String id) {
    saved.contains(id) ? saved.remove(id) : saved.add(id);
    notifyListeners();
  }

  void checkIn(String value) {
    mood = value;
    notifyListeners();
  }

  void complete(Session session) {
    completions.add(DateTime.now());
    totalMinutes += session.minutes;
    notifyListeners();
  }

  bool practicedOn(DateTime date) => completions.any((d) =>
      d.year == date.year && d.month == date.month && d.day == date.day);

  int get streak {
    final now = DateTime.now();
    var day = DateTime(now.year, now.month, now.day);
    if (!practicedOn(day)) day = day.subtract(const Duration(days: 1));
    var count = 0;
    while (practicedOn(day)) {
      count++;
      day = day.subtract(const Duration(days: 1));
    }
    return count;
  }
}
