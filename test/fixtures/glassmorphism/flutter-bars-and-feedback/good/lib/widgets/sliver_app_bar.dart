import 'package:flutter/material.dart';
Widget bar() => BackdropFilter(filter: ImageFilter.blur(sigmaX: 2, sigmaY: 2), child: const SizedBox());
