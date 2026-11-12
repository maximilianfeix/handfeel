import 'package:flutter/material.dart';
void a(BuildContext c) => showModalBottomSheet(context: c, builder: (_) => const TextField());
void b(BuildContext c) => showDialog(context: c, builder: (_) => const AlertDialog(content: Text('Delete?')));
