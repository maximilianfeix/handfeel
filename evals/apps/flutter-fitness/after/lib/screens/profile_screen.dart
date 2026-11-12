import 'package:flutter/material.dart';

import '../theme.dart';
import '../widgets/stat_chip.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _reminders = true;
  bool _metric = true;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        children: [
          Center(
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                      shape: BoxShape.circle, gradient: accentGradient),
                  child: const CircleAvatar(
                    radius: 48,
                    backgroundColor: AppColors.surfaceHigh,
                    child: Text('A',
                        style: TextStyle(
                            fontSize: 40, fontWeight: FontWeight.w800)),
                  ),
                ),
                const SizedBox(height: 14),
                const Text('Alex Morgan',
                    style:
                        TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                const Text('Member since March 2025',
                    style: TextStyle(color: AppColors.textDim)),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Row(
            children: [
              Expanded(
                  child: StatChip(
                      icon: Icons.fitness_center,
                      value: '148',
                      label: 'workouts')),
              SizedBox(width: 12),
              Expanded(
                  child: StatChip(
                      icon: Icons.local_fire_department,
                      value: '12',
                      label: 'day streak',
                      color: AppColors.coral)),
              SizedBox(width: 12),
              Expanded(
                  child: StatChip(
                      icon: Icons.emoji_events,
                      value: '9',
                      label: 'badges',
                      color: AppColors.violet)),
            ],
          ),
          const SizedBox(height: 24),
          const Text('Goals',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          const _GoalBar(label: 'Weekly workouts', value: 4, max: 5),
          const _GoalBar(label: 'Active minutes / day', value: 42, max: 60),
          const _GoalBar(label: 'Weight target', value: 78, max: 75, invert: true),
          const SizedBox(height: 16),
          const Text('Settings',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(22),
            ),
            child: Column(
              children: [
                SwitchListTile(
                  value: _reminders,
                  onChanged: (v) => setState(() => _reminders = v),
                  activeColor: AppColors.lime,
                  title: const Text('Workout reminders'),
                  secondary: const Icon(Icons.notifications_none),
                ),
                SwitchListTile(
                  value: _metric,
                  onChanged: (v) => setState(() => _metric = v),
                  activeColor: AppColors.lime,
                  title: const Text('Metric units'),
                  secondary: const Icon(Icons.straighten),
                ),
                const ListTile(
                  leading: Icon(Icons.lock_outline),
                  title: Text('Privacy'),
                  trailing: Icon(Icons.chevron_right),
                ),
                const ListTile(
                  leading: Icon(Icons.logout, color: AppColors.coral),
                  title: Text('Sign out',
                      style: TextStyle(color: AppColors.coral)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _GoalBar extends StatelessWidget {
  final String label;
  final double value;
  final double max;
  final bool invert;
  const _GoalBar(
      {required this.label,
      required this.value,
      required this.max,
      this.invert = false});

  @override
  Widget build(BuildContext context) {
    final ratio = invert ? (max / value) : (value / max);
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                  child: Text(label,
                      style: const TextStyle(fontWeight: FontWeight.w600))),
              Text('${value.toStringAsFixed(0)} / ${max.toStringAsFixed(0)}',
                  style: const TextStyle(color: AppColors.textDim)),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: ratio.clamp(0.0, 1.0)),
              duration: const Duration(milliseconds: 900),
              curve: Curves.easeOutCubic,
              builder: (_, t, __) => LinearProgressIndicator(
                value: t,
                minHeight: 10,
                backgroundColor: Colors.white.withOpacity(0.08),
                valueColor: const AlwaysStoppedAnimation(AppColors.lime),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
