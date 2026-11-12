import 'package:flutter/material.dart';

import '../data.dart';
import '../theme.dart';
import '../widgets/progress_ring.dart';
import '../widgets/stat_chip.dart';
import '../widgets/weekly_chart.dart';
import '../widgets/workout_card.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final today = sampleWorkouts.first;
    final todayIndex = DateTime.now().weekday - 1;
    const goal = 60.0;
    const done = 42.0;

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_greeting(),
                        style: const TextStyle(
                            color: AppColors.textDim, fontSize: 15)),
                    const SizedBox(height: 2),
                    const Text('Alex',
                        style: TextStyle(
                            fontSize: 30,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.8)),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.local_fire_department,
                        color: AppColors.coral, size: 18),
                    SizedBox(width: 4),
                    Text('12 day streak',
                        style: TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 13)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: Row(
              children: [
                ProgressRing(
                  progress: done / goal,
                  size: 130,
                  child: const Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('70%',
                          style: TextStyle(
                              fontSize: 28, fontWeight: FontWeight.w800)),
                      Text('of goal',
                          style: TextStyle(
                              fontSize: 12, color: AppColors.textDim)),
                    ],
                  ),
                ),
                const SizedBox(width: 22),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("Today's progress",
                          style: TextStyle(
                              fontSize: 18, fontWeight: FontWeight.w800)),
                      SizedBox(height: 8),
                      Text('42 of 60 active minutes.\nOne more session to close your ring.',
                          style: TextStyle(
                              color: AppColors.textDim, height: 1.4)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Row(
            children: [
              Expanded(
                  child: StatChip(
                      icon: Icons.bolt,
                      value: '1,240',
                      label: 'kcal burned')),
              SizedBox(width: 12),
              Expanded(
                  child: StatChip(
                      icon: Icons.timer_outlined,
                      value: '42 min',
                      label: 'active',
                      color: AppColors.sky)),
              SizedBox(width: 12),
              Expanded(
                  child: StatChip(
                      icon: Icons.directions_walk,
                      value: '8.4k',
                      label: 'steps',
                      color: AppColors.violet)),
            ],
          ),
          const SizedBox(height: 28),
          const Text("Today's workout",
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          const SizedBox(height: 14),
          WorkoutCard(workout: today, large: true),
          const SizedBox(height: 28),
          const Text('This week',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(24),
            ),
            child: WeeklyChart(todayIndex: todayIndex),
          ),
        ],
      ),
    );
  }
}
