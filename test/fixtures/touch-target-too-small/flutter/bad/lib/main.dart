import 'package:flutter/material.dart';
Widget b() => GestureDetector(onTap: () {}, child: Container(width: 28, height: 28, child: const Icon(Icons.close)));
Widget c() => IconButton(onPressed: () {}, constraints: const BoxConstraints(), icon: const Icon(Icons.add), tooltip: 'Add');
