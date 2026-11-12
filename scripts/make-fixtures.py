"""Writes test/fixtures/<rule>/<platform>/{bad,good}/... from the table below.
Run once after editing; the files are committed so contributors can read them."""
import json, os, shutil, sys

ROOT = os.path.join(os.path.dirname(__file__), '..', 'test', 'fixtures')
RN_PKG = json.dumps({"name": "fixture", "dependencies": {"expo": "~54.0.0", "react-native": "0.81.0"}})

def rn(code, extra=None):
    files = {"package.json": RN_PKG, "App.tsx": "import React from 'react';\n" + code}
    files.update(extra or {})
    return files
def fl(code, extra=None):
    files = {"pubspec.yaml": "name: fixture\n", "lib/main.dart": "import 'package:flutter/material.dart';\n" + code}
    files.update(extra or {})
    return files
def sw(code):
    return {"Sources/App/ContentView.swift": "import SwiftUI\n" + code}
def kt(code, extra=None):
    files = {"app/src/main/java/app/MainScreen.kt": "package app\nimport androidx.compose.runtime.Composable\n" + code}
    files.update(extra or {})
    return files

F = {}
def add(rule, platform, bad, good):
    F[(rule, platform)] = (bad, good)

# ---------------------------------------------------------------- common
add('emoji-as-icon', 'rn',
    rn("import { Text } from 'react-native';\nexport default () => <Text>🔥</Text>;\n"),
    rn("import { Text } from 'react-native';\nimport { SymbolView } from 'expo-symbols';\nconst REACTIONS = ['👍', '❤️', '😂', '😮', '😢'];\nexport default () => <><SymbolView name=\"flame\" /><Text>Streak 🔥 kept</Text></>;\n"))
add('emoji-as-icon', 'flutter',
    fl("Widget badge() => const Text('💪');\n"),
    fl("Widget badge() => const Icon(Icons.fitness_center);\n"))
add('emoji-as-icon', 'swiftui',
    sw('struct V: View { var body: some View { Text("🍳") } }\n'),
    sw('struct V: View { var body: some View { Image(systemName: "frying.pan") } }\n'))

add('hardcoded-color', 'rn',
    rn("import { View } from 'react-native';\nexport default () => <View style={{ backgroundColor: '#F4F4F8' }} />;\n"),
    rn("import { View } from 'react-native';\nimport { colors } from './theme';\nexport default () => <View style={{ backgroundColor: colors.surface }} />;\n",
       {"theme.ts": "export const colors = { surface: '#F4F4F8' };\n"}))
add('hardcoded-color', 'flutter',
    fl("Widget box() => Container(color: const Color(0xFF1E1E2E));\n"),
    fl("Widget box(BuildContext c) => Container(color: Theme.of(c).colorScheme.surface);\n",
       {"lib/theme.dart": "import 'package:flutter/material.dart';\nconst seed = Color(0xFF2F6F5E);\n"}))
add('hardcoded-color', 'swiftui',
    sw('struct V: View { var body: some View { Text("Hi").foregroundStyle(Color(red: 0.2, green: 0.2, blue: 0.3)) } }\n'),
    sw('struct V: View { var body: some View { Text("Hi").foregroundStyle(.secondary) } }\n'))
add('hardcoded-color', 'compose',
    kt("@Composable fun T() { Text(\"Hi\", color = Color(0xFF222233)) }\n"),
    kt("@Composable fun T() { Text(\"Hi\", color = MaterialTheme.colorScheme.onSurface) }\n"))

add('default-ai-accent', 'rn',
    rn("export {};\n", {"theme.ts": "export const colors = { primary: '#6366F1' };\n"}),
    rn("export {};\n", {"theme.ts": "export const colors = { primary: '#2F6F5E' };\n"}))

add('purple-gradient', 'rn',
    rn("import { LinearGradient } from 'expo-linear-gradient';\nexport default () => <LinearGradient colors={['#4F5BD5', '#8E5CF0']} />;\n"),
    rn("import { LinearGradient } from 'expo-linear-gradient';\nexport default () => <LinearGradient colors={['#0F3D3E', '#1F6F5C']} />;\n"))
add('purple-gradient', 'flutter',
    fl("const g = LinearGradient(colors: [AppColors.violet, AppColors.pink]);\n",
       {"lib/theme.dart": "import 'package:flutter/material.dart';\nclass AppColors {\n  static const violet = Color(0xFF7C5CFF);\n  static const pink = Color(0xFFFF5C93);\n}\n"}),
    fl("const g = LinearGradient(colors: [Color(0xFF0F3D3E), Color(0xFF1F6F5C)]);\n"))
add('purple-gradient', 'swiftui',
    sw('struct V: View { var body: some View { LinearGradient(colors: [Color(hex: "#8B5CF6"), Color(hex: "#EC4899")], startPoint: .top, endPoint: .bottom) } }\n'),
    sw('struct V: View { var body: some View { Color(.systemBackground) } }\n'))
add('purple-gradient', 'compose',
    kt("val b = Brush.linearGradient(listOf(Color(0xFF7C3AED), Color(0xFF4F46E5)))\n"),
    kt("val b = Brush.linearGradient(listOf(Color(0xFF0F3D3E), Color(0xFF1F6F5C)))\n"))

lg = "import { LinearGradient } from 'expo-linear-gradient';\n"
add('gradient-overuse', 'rn',
    rn(lg + "export default () => <><LinearGradient colors={['#000', '#111']} /><LinearGradient colors={['#000', '#111']} /><LinearGradient colors={['#000', '#111']} /></>;\n"),
    rn(lg + "export default () => <><LinearGradient colors={['#000', '#111']} /><LinearGradient colors={['#000', '#111']} /></>;\n"))

add('glassmorphism', 'rn',
    rn("import { BlurView } from 'expo-blur';\nimport { View } from 'react-native';\nexport default () => <><BlurView intensity={40} /><View style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} /></>;\n"),
    rn("import { View } from 'react-native';\nexport default () => <View style={{ backgroundColor: '#FFFFFF' }} />;\n"))
add('glassmorphism', 'flutter',
    fl("Widget g() => BackdropFilter(filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10), child: Container(color: Colors.white.withOpacity(0.1)));\n"),
    fl("Widget g(BuildContext c) => Card(child: Text('x'));\n"))

add('off-grid-spacing', 'rn',
    rn("import { StyleSheet } from 'react-native';\nexport const s = StyleSheet.create({ a: { padding: 10, marginTop: 14, gap: 15, paddingHorizontal: 18 } });\n"),
    rn("import { StyleSheet } from 'react-native';\nexport const s = StyleSheet.create({ a: { padding: 16, marginTop: 8, gap: 12, paddingHorizontal: 24 } });\n"))
add('off-grid-spacing', 'flutter',
    fl("const a = EdgeInsets.symmetric(horizontal: 18, vertical: 10);\nconst b = EdgeInsets.all(14);\nconst c = SizedBox(height: 22);\n"),
    fl("const a = EdgeInsets.symmetric(horizontal: 16, vertical: 8);\nconst b = EdgeInsets.all(12);\n"))

add('type-scale-sprawl', 'rn',
    rn("import { StyleSheet } from 'react-native';\nexport const s = StyleSheet.create({ a: { fontSize: 10 }, b: { fontSize: 11 }, c: { fontSize: 12 }, d: { fontSize: 13 }, e: { fontSize: 14 }, f: { fontSize: 15 }, g: { fontSize: 17 }, h: { fontSize: 22 }, i: { fontSize: 28 }, j: { fontSize: 42 } });\n"),
    rn("import { StyleSheet } from 'react-native';\nexport const s = StyleSheet.create({ a: { fontSize: 13 }, b: { fontSize: 15 }, c: { fontSize: 17 }, d: { fontSize: 22 }, e: { fontSize: 34 } });\n"))

# ---------------------------------------------------------------- react native
P = "import { Pressable, View, Text } from 'react-native';\nimport { Ionicons } from '@expo/vector-icons';\n"
add('touch-target-too-small', 'rn',
    rn(P + "import { StyleSheet } from 'react-native';\nconst s = StyleSheet.create({ btn: { width: 32, height: 32 } });\nexport default () => <><Pressable style={s.btn} onPress={() => {}} /><Ionicons name=\"close\" size={20} onPress={() => {}} /></>;\n"),
    rn(P + "import { StyleSheet } from 'react-native';\nconst s = StyleSheet.create({ btn: { width: 44, height: 44 }, dot: { width: 24, height: 24 } });\nexport default () => <><Pressable style={s.btn} onPress={() => {}} /><Pressable style={s.dot} hitSlop={10} onPress={() => {}} /></>;\n"))
add('no-press-feedback', 'rn',
    rn(P + "export default () => <Pressable onPress={() => {}}><Text>Save</Text></Pressable>;\n"),
    rn(P + "export default () => <Pressable onPress={() => {}} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })} android_ripple={{ color: '#0002' }}><Text>Save</Text></Pressable>;\n"))
add('icon-button-no-label', 'rn',
    rn(P + "export default () => <Pressable onPress={() => {}}><Ionicons name=\"settings\" size={24} /></Pressable>;\n"),
    rn(P + "export default () => <Pressable accessibilityLabel=\"Settings\" onPress={() => {}}><Ionicons name=\"settings\" size={24} /></Pressable>;\n"))
add('rn-safe-area-view', 'rn',
    rn("import { SafeAreaView, Text } from 'react-native';\nexport default () => <SafeAreaView><Text>Hi</Text></SafeAreaView>;\n"),
    rn("import { Text } from 'react-native';\nimport { SafeAreaView } from 'react-native-safe-area-context';\nexport default () => <SafeAreaView><Text>Hi</Text></SafeAreaView>;\n"))
add('font-scaling-disabled', 'rn',
    rn("import { Text } from 'react-native';\nexport default () => <Text allowFontScaling={false}>Total</Text>;\n"),
    rn("import { Text } from 'react-native';\nexport default () => <Text maxFontSizeMultiplier={1.6}>Total</Text>;\n"))
add('modal-instead-of-sheet', 'rn',
    rn("import { Modal, View } from 'react-native';\nexport default () => <Modal transparent animationType=\"fade\"><View /></Modal>;\n"),
    rn("import { Modal, View } from 'react-native';\nexport default () => <Modal presentationStyle=\"pageSheet\" animationType=\"slide\"><View /></Modal>;\n"))
add('keyboard-covers-input', 'rn',
    rn("import { TextInput, View } from 'react-native';\nexport default () => <View><TextInput placeholder=\"Name\" /></View>;\n"),
    rn("import { TextInput, KeyboardAvoidingView, Platform } from 'react-native';\nexport default () => <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}><TextInput placeholder=\"Name\" /></KeyboardAvoidingView>;\n"))
add('hamburger-navigation', 'rn',
    rn("import { Drawer } from 'expo-router/drawer';\nexport default () => <Drawer />;\n"),
    rn("import { Tabs } from 'expo-router';\nexport default () => <Tabs />;\n"))
add('ios-only-shadow', 'rn',
    rn("import { StyleSheet } from 'react-native';\nexport const s = StyleSheet.create({ card: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 } });\n"),
    rn("import { StyleSheet, Platform } from 'react-native';\nexport const s = StyleSheet.create({ card: { ...Platform.select({ ios: { shadowColor: '#000', shadowRadius: 8 }, android: { elevation: 2 } }) }, b: { shadowColor: '#000', elevation: 2 } });\n"))
add('no-android-ripple', 'rn',
    rn("import { TouchableOpacity, Text } from 'react-native';\nexport default () => <TouchableOpacity onPress={() => {}}><Text>Go</Text></TouchableOpacity>;\n"),
    rn("import { Pressable, Text } from 'react-native';\nexport default () => <Pressable android_ripple={{ color: '#0002' }} onPress={() => {}}><Text>Go</Text></Pressable>;\n"))
add('no-haptics', 'rn',
    rn("export default () => null;\n"),
    rn("import * as Haptics from 'expo-haptics';\nexport const tap = () => Haptics.selectionAsync();\n"))
add('no-dark-mode', 'rn',
    rn("export default () => null;\n", {"app.json": json.dumps({"expo": {"name": "x", "userInterfaceStyle": "light"}})}),
    rn("import { useColorScheme } from 'react-native';\nexport default () => { useColorScheme(); return null; };\n", {"app.json": json.dumps({"expo": {"name": "x", "userInterfaceStyle": "automatic"}})}))
add('no-platform-adaptation', 'rn',
    rn("export default () => null;\n"),
    rn("import { Platform } from 'react-native';\nexport const ios = Platform.OS === 'ios';\n"))

# ---------------------------------------------------------------- flutter
add('no-press-feedback', 'flutter',
    fl("Widget b() => GestureDetector(onTap: () {}, child: const Text('Start'));\n"),
    fl("Widget b() => InkWell(onTap: () {}, child: const Text('Start'));\nWidget d() => GestureDetector(onTap: () {}, onPanUpdate: (_) {}, child: const SizedBox());\n"))
add('touch-target-too-small', 'flutter',
    fl("Widget b() => GestureDetector(onTap: () {}, child: Container(width: 28, height: 28, child: const Icon(Icons.close)));\nWidget c() => IconButton(onPressed: () {}, constraints: const BoxConstraints(), icon: const Icon(Icons.add), tooltip: 'Add');\n"),
    fl("Widget b() => InkWell(onTap: () {}, child: Container(width: 48, height: 48, child: const Icon(Icons.close)));\n"))
add('icon-button-no-label', 'flutter',
    fl("Widget b() => IconButton(onPressed: () {}, icon: const Icon(Icons.settings));\n"),
    fl("Widget b() => IconButton(onPressed: () {}, tooltip: 'Settings', icon: const Icon(Icons.settings));\n"))
add('font-scaling-disabled', 'flutter',
    fl("Widget b(BuildContext c) => MediaQuery(data: MediaQuery.of(c).copyWith(textScaler: TextScaler.noScaling), child: const Text('x'));\n"),
    fl("Widget b(BuildContext c) => MediaQuery(data: MediaQuery.of(c).copyWith(textScaler: MediaQuery.textScalerOf(c).clamp(maxScaleFactor: 2)), child: const Text('x'));\n"))
add('material-2-theme', 'flutter',
    fl("final t = ThemeData(useMaterial3: false);\n"),
    fl("final t = ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: Colors.teal));\n"))
add('missing-safe-area', 'flutter',
    fl("Widget s() => Scaffold(body: Column(children: const [Text('Hi')]));\n"),
    fl("Widget s() => Scaffold(body: SafeArea(child: Column(children: const [Text('Hi')])));\nWidget t() => Scaffold(appBar: AppBar(), body: const Text('x'));\n"))
add('modal-instead-of-sheet', 'flutter',
    fl("void a(BuildContext c) => showDialog(context: c, builder: (_) => const AlertDialog(content: TextField()));\n"),
    fl("void a(BuildContext c) => showModalBottomSheet(context: c, builder: (_) => const TextField());\nvoid b(BuildContext c) => showDialog(context: c, builder: (_) => const AlertDialog(content: Text('Delete?')));\n"))
add('hamburger-navigation', 'flutter',
    fl("Widget s() => Scaffold(drawer: Drawer(child: ListView()), body: const SizedBox());\n"),
    fl("Widget s() => Scaffold(bottomNavigationBar: NavigationBar(destinations: const []), body: const SizedBox());\n"))
add('type-outside-scale', 'flutter',
    fl("Widget t() => const Text('x', style: TextStyle(fontSize: 22));\n"),
    fl("Widget t(BuildContext c) => Text('x', style: Theme.of(c).textTheme.titleLarge);\n"))
add('no-haptics', 'flutter',
    fl("void f() {}\n"),
    fl("import 'package:flutter/services.dart';\nvoid f() => HapticFeedback.selectionClick();\n"))
add('no-dark-mode', 'flutter',
    fl("Widget app() => MaterialApp(theme: ThemeData());\n"),
    fl("Widget app() => MaterialApp(theme: ThemeData(), darkTheme: ThemeData(brightness: Brightness.dark));\n"))
add('no-dark-mode', 'flutter-dark-only',
    fl("Widget app() => MaterialApp(theme: ThemeData(brightness: Brightness.dark));\n"),
    fl("Widget app() => MaterialApp(theme: ThemeData(), darkTheme: ThemeData(brightness: Brightness.dark), themeMode: ThemeMode.system);\n"))
add('no-dark-mode', 'flutter-forced-mode',
    fl("Widget app() => MaterialApp(theme: ThemeData(), darkTheme: ThemeData(brightness: Brightness.dark), themeMode: ThemeMode.dark);\n"),
    fl("Widget app() => MaterialApp(theme: ThemeData(), darkTheme: ThemeData(brightness: Brightness.dark));\n"))
add('no-platform-adaptation', 'flutter',
    fl("Widget s() => Switch(value: true, onChanged: (_) {});\n"),
    fl("Widget s() => Switch.adaptive(value: true, onChanged: (_) {});\n"))

# ---------------------------------------------------------------- swiftui
add('no-press-feedback', 'swiftui',
    sw('struct V: View { var body: some View { Text("Save").onTapGesture { } } }\n'),
    sw('struct V: View { var body: some View { Button("Save") { }; Text("x").onTapGesture(count: 2) { } } }\n'))
add('fixed-font-size', 'swiftui',
    sw('struct V: View { var body: some View { Text("Hi").font(.system(size: 28, weight: .bold)) } }\n'),
    sw('struct V: View { var body: some View { Text("Hi").font(.title.bold()); Text("x").font(.custom("Inter", size: 17, relativeTo: .body)) } }\n'))
add('deprecated-navigation-view', 'swiftui',
    sw('struct V: View { var body: some View { NavigationView { Text("Hi") } } }\n'),
    sw('struct V: View { var body: some View { NavigationStack { Text("Hi") } } }\n'))
add('modal-instead-of-sheet', 'swiftui',
    sw('struct V: View { @State var on = false\n var body: some View { Text("Hi").fullScreenCover(isPresented: $on) { Text("Form") } } }\n'),
    sw('struct V: View { @State var on = false\n var body: some View { Text("Hi").sheet(isPresented: $on) { Text("Form").presentationDetents([.medium]) } } }\n'))
add('forced-color-scheme', 'swiftui',
    sw('struct V: View { var body: some View { Text("Hi").preferredColorScheme(.dark) } }\n'),
    sw('struct V: View { var scheme: ColorScheme?\n var body: some View { Text("Hi").preferredColorScheme(scheme) } }\n'))
add('touch-target-too-small', 'swiftui',
    sw('struct V: View { var body: some View {\n  Circle()\n    .frame(width: 28, height: 28)\n    .onTapGesture { }\n} }\n'),
    sw('struct V: View { var body: some View {\n  Circle()\n    .frame(width: 28, height: 28)\n    .frame(minWidth: 44, minHeight: 44)\n    .contentShape(Rectangle())\n    .onTapGesture { }\n} }\n'))
add('no-haptics', 'swiftui',
    sw('struct V: View { var body: some View { Text("Hi") } }\n'),
    sw('struct V: View { @State var n = 0\n var body: some View { Button("Hi") { n += 1 }.sensoryFeedback(.success, trigger: n) } }\n'))

# ---------------------------------------------------------------- compose
add('no-press-feedback', 'compose',
    kt("@Composable fun B() { Box(Modifier.clickable(interactionSource = remember { MutableInteractionSource() }, indication = null) { }) }\n"),
    kt("@Composable fun B() { Box(Modifier.clickable { }) }\n"))
add('touch-target-too-small', 'compose',
    kt("@Composable fun B() { Box(Modifier.size(24.dp).clickable { }) }\n"),
    kt("@Composable fun B() { Box(Modifier.size(48.dp).clickable { }); Box(Modifier.size(24.dp).minimumInteractiveComponentSize().clickable { }) }\n"))
add('icon-button-no-label', 'compose',
    kt("@Composable fun B() { IconButton(onClick = {}) { Icon(Icons.Default.Settings, contentDescription = null) } }\n"),
    kt("@Composable fun B() { IconButton(onClick = {}) { Icon(Icons.Default.Settings, contentDescription = \"Settings\") } }\n"))
add('type-outside-scale', 'compose',
    kt("@Composable fun T() { Text(\"Hi\", fontSize = 22.sp) }\n"),
    kt("@Composable fun T() { Text(\"Hi\", style = MaterialTheme.typography.titleLarge) }\n"))
add('hamburger-navigation', 'compose',
    kt("@Composable fun N() { ModalNavigationDrawer(drawerContent = {}) { } }\n"),
    kt("@Composable fun N() { NavigationBar { } }\n"))
add('no-haptics', 'compose',
    kt("@Composable fun N() { }\n"),
    kt("@Composable fun N() { val h = LocalHapticFeedback.current }\n"))
add('no-dark-mode', 'compose',
    kt("@Composable fun AppTheme(c: @Composable () -> Unit) { MaterialTheme(colorScheme = lightColorScheme(), content = c) }\n"),
    kt("@Composable fun AppTheme(c: @Composable () -> Unit) { MaterialTheme(colorScheme = if (isSystemInDarkTheme()) darkColorScheme() else lightColorScheme(), content = c) }\n"))
add('no-dark-mode', 'compose-toggle-only',
    kt("import androidx.compose.foundation.isSystemInDarkTheme\nclass Store { var dark = false }\n@Composable fun AppTheme(s: Store, c: @Composable () -> Unit) { MaterialTheme(colorScheme = if (s.dark) darkColorScheme() else lightColorScheme(), content = c) }\n"),
    kt("class Store { var dark: Boolean? = null }\n@Composable fun AppTheme(s: Store, c: @Composable () -> Unit) { val d = s.dark ?: isSystemInDarkTheme(); MaterialTheme(colorScheme = if (d) darkColorScheme() else lightColorScheme(), content = c) }\n"))
add('missing-safe-area', 'compose',
    kt("class Main : ComponentActivity() { override fun onCreate(b: Bundle?) { super.onCreate(b); setContent { Scaffold(topBar = {}) { _ -> Text(\"x\") } } } }\n"),
    kt("class Main : ComponentActivity() { override fun onCreate(b: Bundle?) { super.onCreate(b); enableEdgeToEdge(); setContent { Scaffold { p -> Text(\"x\", Modifier.padding(p)) } } } }\n"))

# ---------------------------------------------------------------- calibration on real apps (docs/real-apps.md)
# Each pair reproduces a false positive seen in a well-made open-source app; bad/ keeps the case the rule is for.
add('hardcoded-color', 'rn-web-and-fixtures',
    rn("export {};\n", {"Banner.native.tsx": "import { View } from 'react-native';\nexport default () => <View style={{ backgroundColor: '#F4F4F8' }} />;\n"}),
    rn("export {};\n", {"Banner.web.tsx": "import { View } from 'react-native';\nexport default () => <View style={{ backgroundColor: '#F4F4F8' }} />;\n",
                        "src/__fixtures__/post.tsx": "import { View } from 'react-native';\nexport default () => <View style={{ backgroundColor: '#F4F4F8' }} />;\n"}))
add('hardcoded-color', 'rn-scheme-scrim',
    rn("import { View } from 'react-native';\nexport default () => <View style={{ backgroundColor: '#10161F' }} />;\n"),
    rn("import { View, useColorScheme } from 'react-native';\nexport default () => {\n  const isDark = useColorScheme() === 'dark';\n  const bg = isDark\n    ? '#10161F'\n    : '#FFFFFF';\n  return <View style={{ backgroundColor: bg, borderColor: 'rgba(0, 0, 0, 0.5)', shadowColor: 'rgba(0,0,0,0)' }} />;\n};\n"))
add('hardcoded-color', 'rn-named-palette',
    rn("import { StyleSheet } from 'react-native';\nexport const s = StyleSheet.create({ box: { backgroundColor: '#F3F3F8' } });\n"),
    rn("import { StyleSheet } from 'react-native';\nexport const colors = { gray1: '#F3F3F8', blue3: '#0085ff' };\nexport const s = StyleSheet.create({ box: { backgroundColor: colors.gray1 } });\n"))
add('hardcoded-color', 'rn-svg-artwork',
    rn("import { View } from 'react-native';\nexport default () => <View style={{ borderColor: '#0078D4' }} />;\n"),
    rn("import Svg, { Path } from 'react-native-svg';\nexport default () => <Svg viewBox=\"0 0 24 24\"><Path d=\"M0 0h24v24H0z\" fill=\"#0078D4\" /></Svg>;\n"))
add('hardcoded-color', 'swiftui-system-colors',
    sw('struct V: View { var body: some View { Text("Hi").foregroundStyle(Color.white) } }\n'),
    sw('struct V: View { var body: some View { Label("Boost", systemImage: "arrow.2.squarepath").foregroundStyle(Color.teal); Text("x").foregroundStyle(Color.red) } }\n'))
add('hardcoded-color', 'flutter-enum-palette',
    fl("Widget box() => Container(color: const Color(0xFF3B82F6));\n"),
    fl("enum AvatarColor { blue, green }\nextension AvatarColorX on AvatarColor {\n  Color get color => switch (this) {\n    AvatarColor.blue => const Color(0xFF3B82F6),\n    AvatarColor.green => const Color(0xFF16A34A),\n  };\n}\nWidget scrim() => Container(color: Colors.black.withValues(alpha: 0.4));\n"))

add('type-scale-sprawl', 'compose-theme-scale',
    kt("@Composable fun T() { Text(\"a\", fontSize = 10.sp); Text(\"b\", fontSize = 11.sp); Text(\"c\", fontSize = 12.sp); Text(\"d\", fontSize = 13.sp); Text(\"e\", fontSize = 15.sp); Text(\"f\", fontSize = 17.sp); Text(\"g\", fontSize = 19.sp); Text(\"h\", fontSize = 21.sp); Text(\"i\", fontSize = 27.sp); Text(\"j\", fontSize = 41.sp) }\n"),
    kt("@Composable fun T() { Text(\"a\", style = MaterialTheme.typography.bodyLarge) }\n",
       {"app/src/main/java/app/ui/theme/Type.kt": "package app.ui.theme\nval Typography = Typography(\n" + "".join(f"  s{n} = TextStyle(fontSize = {n}.sp),\n" for n in (57, 45, 36, 32, 28, 24, 22, 16, 14, 12, 11)) + ")\n"}))

add('hamburger-navigation', 'compose-adaptive',
    kt("@Composable fun N() { ModalNavigationDrawer(drawerContent = {}) { } }\n"),
    kt("@Composable fun N(compact: Boolean) { if (compact) NavigationBar { } else ModalNavigationDrawer(drawerContent = {}) { } }\n"))

M = "import { Modal, View } from 'react-native';\n"
add('modal-instead-of-sheet', 'rn-conditional-sheet',
    rn(M + "export default () => <Modal transparent animationType=\"fade\"><View /></Modal>;\n"),
    rn(M + "const IS_IPAD = false;\nexport default () => <Modal presentationStyle={IS_IPAD ? 'formSheet' : 'pageSheet'}><View /></Modal>;\n",
       {"EmojiPopup.android.tsx": M + "export default () => <Modal animationType=\"slide\" transparent><View /></Modal>;\n"}))
add('modal-instead-of-sheet', 'swiftui-immersive',
    sw('struct V: View { @State var on = false\n var body: some View { Text("Hi").fullScreenCover(isPresented: $on) { Form { Text("Name") } } } }\n'),
    sw('struct V: View { @State var isCameraPickerPresented = false\n var body: some View { Text("Hi").fullScreenCover(isPresented: $isCameraPickerPresented) { CameraPicker() } } }\n'))

add('emoji-as-icon', 'rn-text-symbols',
    rn("import { Text } from 'react-native';\nexport default () => <Text>⚠️</Text>;\n"),
    rn("import { Text } from 'react-native';\nexport const escape = (tag: string) => tag.replaceAll('\\\\:', '☢');\nexport default () => <Text>⚠︎</Text>;\n"))

add('touch-target-too-small', 'flutter-nested-child',
    fl("Widget box(bool v) => InkResponse(onTap: () {}, child: DecoratedBox(decoration: const BoxDecoration(), child: Material(child: SizedBox(width: 24, height: 24))));\n"),
    fl("Widget banner() => InkWell(onTap: () {}, child: Column(children: const [SizedBox(width: 32, height: 32), Text('Uploading')]));\n"
       "Widget play() => IconButton(tooltip: 'Play', iconSize: 32, padding: const EdgeInsets.all(12), constraints: const BoxConstraints(), onPressed: () {}, icon: const Icon(Icons.play_arrow));\n"))

add('glassmorphism', 'flutter-bars-and-feedback',
    fl("Widget card() => BackdropFilter(filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10), child: const Text('x'));\nWidget c2() => BackdropFilter(filter: ImageFilter.blur(sigmaX: 4, sigmaY: 4), child: const Text('y'));\n"),
    fl("Widget tile() => InkWell(overlayColor: WidgetStateProperty.all(Colors.white.withValues(alpha: 0.1)), onTap: () {});\n",
       {"lib/widgets/sliver_app_bar.dart": "import 'package:flutter/material.dart';\nWidget bar() => BackdropFilter(filter: ImageFilter.blur(sigmaX: 2, sigmaY: 2), child: const SizedBox());\n"}))

add('no-press-feedback', 'rn-backdrop-and-keyboard',
    rn(P + "export default () => <Pressable onPress={() => {}}><Text>Leave chat</Text></Pressable>;\n"),
    rn("import { Pressable, StyleSheet, TouchableWithoutFeedback, Keyboard, View } from 'react-native';\nexport default ({ close }: { close: () => void }) => <><Pressable style={StyleSheet.absoluteFill} accessibilityLabel=\"Close\" onPress={close} /><TouchableWithoutFeedback onPress={Keyboard.dismiss}><View /></TouchableWithoutFeedback></>;\n"))
add('no-press-feedback', 'flutter-unfocus',
    fl("Widget b() => GestureDetector(onTap: () => open(), child: const Text('Open'));\n"),
    fl("Widget b(BuildContext c) => GestureDetector(onTap: FocusManager.instance.primaryFocus?.unfocus, child: const Text('x'));\n"))

add('missing-safe-area', 'flutter-custom-body',
    fl("Widget s() => Scaffold(body: Stack(children: const [Text('Map')]));\n"),
    fl("Widget s() => const Scaffold(body: ChangePasswordForm());\nWidget t(Widget child) => Scaffold(body: child, bottomNavigationBar: NavigationBar(destinations: const []));\n"))

add('keyboard-covers-input', 'rn-wrapper',
    rn("export {};\n", {"src/NameField.tsx": "import { TextInput } from 'react-native';\nexport default () => <TextInput placeholder=\"Name\" />;\n",
                        "src/ProfileScreen.tsx": "import { View } from 'react-native';\nimport NameField from './NameField';\nexport default () => <View><NameField /></View>;\n"}),
    rn("export {};\n", {"src/NameField.tsx": "import { TextInput } from 'react-native';\nexport default () => <TextInput placeholder=\"Name\" />;\n",
                        "src/ScreenWrapper/index.tsx": "import { KeyboardAvoidingView } from 'react-native';\nexport default ({ children }: { children: React.ReactNode }) => <KeyboardAvoidingView behavior=\"padding\">{children}</KeyboardAvoidingView>;\n",
                        "src/ProfileScreen.tsx": "import ScreenWrapper from './ScreenWrapper';\nimport NameField from './NameField';\nexport default () => <ScreenWrapper><NameField /></ScreenWrapper>;\n"}))

add('gradient-overuse', 'rn-scrim-and-svg',
    rn(lg + "export default () => <><LinearGradient colors={['#FF8A00', '#E52E71']} /><LinearGradient colors={['#FF8A00', '#E52E71']} /><LinearGradient colors={['#FF8A00', '#E52E71']} /></>;\n"),
    rn(lg + "import Svg, { Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';\n"
       "export default () => <><LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']} /><LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']} /><LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']} />"
       "<Svg><Defs><SvgGradient id=\"a\"><Stop offset=\"0\" stopColor=\"#FF8A00\" /></SvgGradient><SvgGradient id=\"b\" /><SvgGradient id=\"c\" /></Defs></Svg></>;\n"))

add('font-scaling-disabled', 'rn-icon-glyph',
    rn("import { Text } from 'react-native';\nexport default () => <Text maxFontSizeMultiplier={1}>3</Text>;\n"),
    rn("import { GlyphIcon } from './glyphs';\nexport default () => <GlyphIcon name=\"bell\" allowFontScaling={false} />;\n"))

if __name__ == '__main__':
    if os.path.isdir(ROOT):
        shutil.rmtree(ROOT)
    for (rule, platform), (bad, good) in F.items():
        for kind, files in (('bad', bad), ('good', good)):
            for rel, content in files.items():
                p = os.path.join(ROOT, rule, platform, kind, rel)
                os.makedirs(os.path.dirname(p), exist_ok=True)
                with open(p, 'w') as fh:
                    fh.write(content)
    print(f'{len(F)} rule/platform pairs written')
