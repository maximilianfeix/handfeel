import 'package:flutter/material.dart';
Widget b(BuildContext c) => MediaQuery(data: MediaQuery.of(c).copyWith(textScaler: TextScaler.noScaling), child: const Text('x'));
