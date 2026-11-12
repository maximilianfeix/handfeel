import 'package:flutter/material.dart';
Widget card() => BackdropFilter(filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10), child: const Text('x'));
Widget c2() => BackdropFilter(filter: ImageFilter.blur(sigmaX: 4, sigmaY: 4), child: const Text('y'));
