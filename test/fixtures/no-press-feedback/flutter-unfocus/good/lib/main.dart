import 'package:flutter/material.dart';
Widget b(BuildContext c) => GestureDetector(onTap: FocusManager.instance.primaryFocus?.unfocus, child: const Text('x'));
