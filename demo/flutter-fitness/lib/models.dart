import 'package:flutter/material.dart';

class Exercise {
  final String name;
  final String muscle;
  final int sets;
  final String reps;
  final IconData icon;

  const Exercise({
    required this.name,
    required this.muscle,
    required this.sets,
    required this.reps,
    required this.icon,
  });
}

class Workout {
  final String id;
  final String title;
  final String category;
  final String level;
  final int minutes;
  final int kcal;
  final List<Color> colors;
  final IconData icon;
  final List<Exercise> exercises;

  const Workout({
    required this.id,
    required this.title,
    required this.category,
    required this.level,
    required this.minutes,
    required this.kcal,
    required this.colors,
    required this.icon,
    required this.exercises,
  });
}
