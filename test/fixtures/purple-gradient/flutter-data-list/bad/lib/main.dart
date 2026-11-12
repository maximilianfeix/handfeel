import 'package:flutter/material.dart';
class Workout { const Workout(this.name, {required this.colors}); final String name; final List<Color> colors; }
const push = Workout('Push Day', colors: [Color(0xFF7C5CFF), Color(0xFFB04CFF)]);
Widget card(Workout w) => Container(decoration: BoxDecoration(gradient: LinearGradient(colors: w.colors)));
