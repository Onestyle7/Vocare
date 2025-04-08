import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vocare/screens/fill_profile_screen.dart';
import 'package:vocare/screens/login_screen.dart';
import 'package:vocare/services/them_service.dart';


void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final themeService = ThemeService();
  await themeService.loadTheme();

  runApp(
    ChangeNotifierProvider(
      create: (_) => themeService,
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeService = Provider.of<ThemeService>(context);
    return MaterialApp(
      title: 'Vocare',
      theme: ThemeData.light(),
      darkTheme: ThemeData.dark(),
      themeMode: themeService.isDarkMode ? ThemeMode.dark : ThemeMode.light,
      home: FillProfileScreen(),
    );
  }
}
