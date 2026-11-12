import 'package:flutter/material.dart';
class Workout { const Workout(this.name, {required this.tone}); final String name; final Color tone; }
const push = Workout('Push Day', tone: Color(0xFFE07A2A));
const palette = [Color(0xFF7C5CFF), Color(0xFFE07A2A), Color(0xFF2F6F5E), Color(0xFF1F6F8C)];
