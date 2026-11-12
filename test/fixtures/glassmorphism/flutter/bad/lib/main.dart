import 'package:flutter/material.dart';
Widget g() => BackdropFilter(filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10), child: Container(color: Colors.white.withOpacity(0.1)));
