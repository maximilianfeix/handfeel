import 'package:flutter/material.dart';
Widget banner() => InkWell(onTap: () {}, child: Column(children: const [SizedBox(width: 32, height: 32), Text('Uploading')]));
Widget play() => IconButton(tooltip: 'Play', iconSize: 32, padding: const EdgeInsets.all(12), constraints: const BoxConstraints(), onPressed: () {}, icon: const Icon(Icons.play_arrow));
