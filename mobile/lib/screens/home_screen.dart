import 'package:flutter/material.dart';
import 'package:vocare/widgets/custom_button.dart';
import 'package:vocare/widgets/nav_bar_button.dart';
import 'package:vocare/widgets/theme_toggle_button.dart';
import 'package:vocare/widgets/vocare_hanging_tag.dart';
import 'package:vocare/screens/fill_profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              const SizedBox(height: 30),

              // Główny tekst
              const Center(
                child: Text(
                  'UNLOCK \nYOUR \nGROWTH',
                  style: TextStyle(fontSize: 42, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
              ),

              const SizedBox(height: 20),

              // 🎨 Hanging Tag z wymuszonym kolorami
              VocareHangingTag(
                width: 240,
                height: 280,
                bandColor: const Color(0xFF915EFF), // 🔥 WYMUSZONY kolor paska
                cardColor:
                    isDark
                        ? const Color(0xFF1E1E1E) // 🔥 CIEMNY dla dark mode
                        : const Color(0xFFFFFFFF), // 🔥 BIAŁY dla light mode
              ),

              const SizedBox(height: 15),

              // Subtle subtitle
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Text(
                  'Discover your ideal career path with AI-powered recommendations tailored just for you.',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey.shade600,
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),

              const SizedBox(height: 30),

              // Call to action button
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: CustomButton(
                  text: 'Try it out',
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const FillProfileScreen(),
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
      bottomNavigationBar: Container(
        height: 60,
        decoration: BoxDecoration(
          color: Colors.black87,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(16),
            topRight: Radius.circular(16),
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: const [
                ThemeToggleButton(),
                NavBarButtons(
                  destinations: [
                    NavDestination.home,
                    NavDestination.profile,
                    NavDestination.logout,
                    NavDestination.assistent,
                    NavDestination.marketAnalysis,
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
