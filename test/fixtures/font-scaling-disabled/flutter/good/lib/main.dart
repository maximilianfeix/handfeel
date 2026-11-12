import 'package:flutter/material.dart';
Widget b(BuildContext c) => MediaQuery(data: MediaQuery.of(c).copyWith(textScaler: MediaQuery.textScalerOf(c).clamp(maxScaleFactor: 2)), child: const Text('x'));
