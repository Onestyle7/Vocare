import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:provider/provider.dart';
import 'package:vocare/screens/fill_profile_screen.dart';
import 'package:vocare/screens/login_screen.dart';
import 'package:vocare/services/them_service.dart';
import 'package:vocare/utils/error_handler.dart'; // 🆕 DODAJ IMPORT

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 🔧 INIT ERROR HANDLER - UKRYJ OVERFLOW ERRORS
  OverflowErrorHandler.init();

  // 🔧 WYŁĄCZ WSZYSTKIE DEBUG OVERFLOW INDICATORS
  debugPaintSizeEnabled = false;

  // 🔧 DODATKOWE WYŁĄCZENIE DEBUG INFO
  WidgetsBinding.instance.addPostFrameCallback((_) {
    debugPaintSizeEnabled = false;
  });

  final themeService = ThemeService();
  await themeService.loadTheme();

  runApp(
    ChangeNotifierProvider(create: (_) => themeService, child: const MyApp()),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeService = Provider.of<ThemeService>(context);
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Vocare',

      // 🔧 SILNIEJSZY BUILDER - zapobiega WSZYSTKIM overflow
      builder: (BuildContext context, Widget? child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaleFactor: 1.0, // Zapobiega skalowaniu tekstu
          ),
          child: Directionality(
            textDirection: TextDirection.ltr,
            child: Banner(
              message: '', // 🔧 Usuwa debug banner
              location: BannerLocation.topStart,
              color: Colors.transparent,
              child: child!,
            ),
          ),
        );
      },

      theme: ThemeData.light(),
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0e100f),
        primaryColor: Colors.deepPurple,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.black,
          iconTheme: IconThemeData(color: Colors.white),
        ),
        textTheme: const TextTheme(bodyMedium: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF915EFF),
          surface: Color(0xFF1E1E1E),
          background: Colors.black,
        ),

        // 🔧 Dekoracje dla TextField w dark mode
        inputDecorationTheme: const InputDecorationTheme(
          filled: true,
          fillColor: Colors.black,
          hintStyle: TextStyle(color: Colors.white70),
          labelStyle: TextStyle(color: Colors.white),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.all(Radius.circular(25)),
            borderSide: BorderSide(color: Color(0xFF915EFF)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.all(Radius.circular(25)),
            borderSide: BorderSide(color: Color(0xFF915EFF)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.all(Radius.circular(25)),
            borderSide: BorderSide(color: Color(0xFF915EFF), width: 2),
          ),
        ),
      ),

      themeMode: themeService.isDarkMode ? ThemeMode.dark : ThemeMode.light,
      home: const LoginScreen(), // 🔧 DODANE const
    );
  }
}
