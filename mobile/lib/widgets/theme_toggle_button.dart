import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vocare/services/them_service.dart';


class ThemeToggleButton extends StatelessWidget {
  const ThemeToggleButton({super.key});

  @override
  Widget build(BuildContext context) {
    final themeService = Provider.of<ThemeService>(context);

    return IconButton(
      icon: Icon(
        themeService.isDarkMode ? Icons.dark_mode: Icons.light_mode,
      ),
      onPressed: () => themeService.toggleTheme(),
    );
  }
}
