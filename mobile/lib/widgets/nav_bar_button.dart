import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vocare/screens/home_page_screen.dart';
import 'package:vocare/screens/fill_profile_screen.dart';
import 'package:vocare/screens/login_screen.dart';

enum NavDestination { home, profile, logout }

class NavBarButtons extends StatelessWidget {
  final List<NavDestination> destinations;

  const NavBarButtons({super.key, required this.destinations});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: destinations.map((dest) {
        switch (dest) {
          case NavDestination.home:
            return IconButton(
              icon: const Icon(Icons.home),
              tooltip: 'Strona główna',
              onPressed: () => Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => const HomePageScreen()),
              ),
            );
          case NavDestination.profile:
            return IconButton(
              icon: const Icon(Icons.person),
              tooltip: 'Profil',
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const FillProfileScreen()),
              ),
            );
          case NavDestination.logout:
            return IconButton(
              icon: const Icon(Icons.logout),
              tooltip: 'Wyloguj się',
              onPressed: () async {
                final prefs = await SharedPreferences.getInstance();
                await prefs.remove('accessToken');
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              },
            );
        }
      }).toList(),
    );
  }
}
