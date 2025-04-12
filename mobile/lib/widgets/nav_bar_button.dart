import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vocare/screens/aI_asistent_screen.dart';
import 'package:vocare/screens/fill_profile_screen.dart';
import 'package:vocare/screens/home_screen.dart';
import 'package:vocare/screens/login_screen.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

enum NavDestination { home, profile, logout, assistent }

class NavBarButtons extends StatelessWidget {
  final List<NavDestination> destinations;

  const NavBarButtons({super.key, required this.destinations});

  @override
  Widget build(BuildContext context) {
    return Row(
      children:
          destinations.map((dest) {
            switch (dest) {
              case NavDestination.home:
                return IconButton(
                  icon: SvgPicture.asset(
                    'assets/icons/home.svg',
                    height: 40.11,
                    width: 35.77,
                    colorFilter: const ColorFilter.mode(
                       Colors.blue,
                      BlendMode.srcIn,
                    ),
                  ),
                  tooltip: 'Strona główna',
                  onPressed:
                      () => Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(builder: (_) => const HomeScreen()),
                      ),
                );

              case NavDestination.profile:
                return IconButton(
                  icon: SvgPicture.asset('assets/icons/profile.svg',
                  height: 40.11,
                  width: 35.77,
                   colorFilter: const ColorFilter.mode(
                      Colors.blue,
                      BlendMode.srcIn,
                    ),),
                  tooltip: 'Profil',
                  onPressed:
                      () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const FillProfileScreen(),
                        ),
                      ),
                );
              case NavDestination.logout:
                return IconButton(
                  icon: const Icon(Icons.logout, color: Colors.blue,
                  weight: 35.77,
                  size: 40.11,
                  ),
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
              case NavDestination.assistent:
                return IconButton(
                  icon: const Icon(PhosphorIcons.messengerLogo, color: Colors.blue,
                  weight: 35.77,
                  size: 40.11,),
                  tooltip: 'Strona główna',
                  onPressed:
                      () => Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const AIAsistentPageScreen(),
                        ),
                      ),
                );
            }
          }).toList(),
    );
  }
}
