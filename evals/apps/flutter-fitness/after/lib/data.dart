import 'package:flutter/material.dart';

import 'models.dart';

const sampleWorkouts = <Workout>[
  Workout(
    id: 'push',
    title: 'Push Day',
    category: 'Strength',
    level: 'Intermediate',
    minutes: 52,
    kcal: 420,
    tone: WorkoutTone.orange,
    icon: Icons.fitness_center,
    exercises: [
      Exercise(name: 'Bench Press', muscle: 'Chest', sets: 4, reps: '8', icon: Icons.fitness_center),
      Exercise(name: 'Overhead Press', muscle: 'Shoulders', sets: 3, reps: '10', icon: Icons.keyboard_double_arrow_up),
      Exercise(name: 'Incline Dumbbell Press', muscle: 'Upper chest', sets: 3, reps: '10', icon: Icons.trending_up),
      Exercise(name: 'Lateral Raise', muscle: 'Shoulders', sets: 3, reps: '15', icon: Icons.open_in_full),
      Exercise(name: 'Triceps Pushdown', muscle: 'Triceps', sets: 3, reps: '12', icon: Icons.arrow_downward),
    ],
  ),
  Workout(
    id: 'hiit',
    title: 'HIIT Burn',
    category: 'Cardio',
    level: 'Advanced',
    minutes: 28,
    kcal: 360,
    tone: WorkoutTone.coral,
    icon: Icons.local_fire_department,
    exercises: [
      Exercise(name: 'Burpees', muscle: 'Full body', sets: 5, reps: '40s', icon: Icons.bolt),
      Exercise(name: 'Jump Squats', muscle: 'Legs', sets: 5, reps: '40s', icon: Icons.sports_gymnastics),
      Exercise(name: 'Mountain Climbers', muscle: 'Core', sets: 5, reps: '40s', icon: Icons.terrain),
      Exercise(name: 'High Knees', muscle: 'Cardio', sets: 5, reps: '40s', icon: Icons.directions_run),
    ],
  ),
  Workout(
    id: 'legs',
    title: 'Leg Day',
    category: 'Strength',
    level: 'Intermediate',
    minutes: 60,
    kcal: 480,
    tone: WorkoutTone.sky,
    icon: Icons.directions_walk,
    exercises: [
      Exercise(name: 'Back Squat', muscle: 'Quads', sets: 5, reps: '5', icon: Icons.fitness_center),
      Exercise(name: 'Romanian Deadlift', muscle: 'Hamstrings', sets: 4, reps: '8', icon: Icons.south),
      Exercise(name: 'Walking Lunges', muscle: 'Glutes', sets: 3, reps: '12', icon: Icons.directions_walk),
      Exercise(name: 'Calf Raise', muscle: 'Calves', sets: 4, reps: '15', icon: Icons.north),
    ],
  ),
  Workout(
    id: 'yoga',
    title: 'Morning Flow',
    category: 'Mobility',
    level: 'Beginner',
    minutes: 20,
    kcal: 110,
    tone: WorkoutTone.mint,
    icon: Icons.self_improvement,
    exercises: [
      Exercise(name: 'Cat-Cow', muscle: 'Spine', sets: 2, reps: '10', icon: Icons.waves),
      Exercise(name: 'Downward Dog', muscle: 'Posterior chain', sets: 3, reps: '45s', icon: Icons.change_history),
      Exercise(name: 'Pigeon Pose', muscle: 'Hips', sets: 2, reps: '60s', icon: Icons.self_improvement),
    ],
  ),
  Workout(
    id: 'core',
    title: 'Core Crusher',
    category: 'Core',
    level: 'Beginner',
    minutes: 18,
    kcal: 150,
    tone: WorkoutTone.amber,
    icon: Icons.bolt,
    exercises: [
      Exercise(name: 'Plank', muscle: 'Core', sets: 3, reps: '60s', icon: Icons.horizontal_rule),
      Exercise(name: 'Russian Twist', muscle: 'Obliques', sets: 3, reps: '20', icon: Icons.sync),
      Exercise(name: 'Leg Raises', muscle: 'Lower abs', sets: 3, reps: '15', icon: Icons.vertical_align_top),
    ],
  ),
];

const weeklyMinutes = <double>[45, 0, 60, 28, 52, 20, 35];
const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
