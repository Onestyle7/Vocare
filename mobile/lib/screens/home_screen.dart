import 'package:flutter/material.dart';
import 'package:vocare/widgets/custom_button.dart';
import 'package:vocare/widgets/nav_bar_button.dart';
import 'package:vocare/widgets/theme_toggle_button.dart';
import 'package:vocare/widgets/vocare_hanging_tag.dart';
import 'package:vocare/widgets/profile_status_indicator.dart';
import 'package:vocare/screens/fill_profile_screen.dart';
import 'package:vocare/screens/aI_asistent_screen.dart';
import 'package:vocare/services/profile_api.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _isCheckingProfile = true;
  bool _hasProfile = false;

  @override
  void initState() {
    super.initState();
    _checkUserProfile();
  }

  Future<void> _checkUserProfile() async {
    final profile = await ProfileApi.getUserProfile();
    final hasProfile =
        profile != null &&
        profile['firstName'] != null &&
        profile['firstName'].toString().trim().isNotEmpty;

    setState(() {
      _hasProfile = hasProfile;
      _isCheckingProfile = false;
    });
  }

  void _handleTryItOut() async {
    if (_isCheckingProfile) {
      // Jeszcze sprawdzamy profil
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Sprawdzanie profilu...')));
      return;
    }

    if (_hasProfile) {
      // Użytkownik ma profil - przejdź do AI Assistant
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const AIAsistentPageScreen()),
      );
    } else {
      // Użytkownik nie ma profilu - przejdź do formularza profilu
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const FillProfileScreen()),
      );
    }
  }

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

              // Hanging Tag z wymuszonym kolorami
              VocareHangingTag(
                width: 240,
                height: 280,
                bandColor: const Color(0xFF915EFF),
                cardColor:
                    isDark ? const Color(0xFF1E1E1E) : const Color(0xFFFFFFFF),
              ),

              const SizedBox(height: 15),

              // Subtitle z dynamicznym tekstem
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Text(
                  _isCheckingProfile
                      ? 'Checking your profile...'
                      : _hasProfile
                      ? 'Continue your career journey with AI-powered insights.'
                      : 'Discover your ideal career path with AI-powered recommendations tailored just for you.',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey.shade600,
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),

              const SizedBox(height: 30),

              // Dynamiczny przycisk Call to action
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child:
                    _isCheckingProfile
                        ? const CircularProgressIndicator()
                        : CustomButton(
                          text:
                              _hasProfile
                                  ? 'Continue to AI Assistant'
                                  : 'Try it out',
                          onPressed: _handleTryItOut,
                        ),
              ),

              // Dodatkowy przycisk dla użytkowników z profilem
              if (!_isCheckingProfile && _hasProfile) ...[
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 40),
                  child: TextButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const FillProfileScreen(),
                        ),
                      );
                    },
                    child: const Text(
                      'Edit Profile',
                      style: TextStyle(color: Color(0xFF915EFF), fontSize: 16),
                    ),
                  ),
                ),
              ],

              const SizedBox(height: 40),

              // Status indicator dla debugowania
              ProfileStatusIndicator(
                isLoading: _isCheckingProfile,
                hasProfile: _hasProfile,
              ),
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
