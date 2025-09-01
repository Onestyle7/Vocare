import 'package:flutter/material.dart';
import 'package:vocare/widgets/custom_button.dart';
import 'package:vocare/widgets/theme_toggle_button.dart'; // 🆕 DODANE
import 'package:vocare/screens/fill_profile_screen.dart';
import 'package:vocare/screens/home_screen.dart'; // 🆕 DODANE

class CreateFutureView extends StatelessWidget {
  const CreateFutureView({super.key});

  @override
  Widget build(BuildContext context) {
    // 🎨 RESPONSIVE KOLORY dla theme toggle
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      // 🎨 RESPONSIVE TŁO - zmienia się z theme toggle
      backgroundColor:
          isDark ? const Color(0xFF0F0F0F) : const Color(0xFFF8F9FA),

      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              // 🔄 ZAKTUALIZOWANY Top navigation bar
              Row(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      color:
                          isDark ? Colors.grey.shade800 : Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.arrow_back, size: 24),
                      // 🏠 ZMIENIONA NAWIGACJA - do home zamiast pop
                      onPressed:
                          () => Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const HomeScreen(),
                            ),
                          ),
                      color: isDark ? Colors.white : Colors.grey.shade700,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Text(
                    "AI Assistant",
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      // 🎨 RESPONSIVE KOLOR TEKSTU
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),

                  // 🆕 THEME TOGGLE BUTTON w headerze
                  const Spacer(),
                  const ThemeToggleButton(),
                ],
              ),

              const Spacer(),

              // "Create" text z gradientem - RESPONSIVE GRADIENT
              ShaderMask(
                shaderCallback:
                    (bounds) => LinearGradient(
                      colors:
                          isDark
                              ? [Colors.white, const Color(0xFF915EFF)]
                              : [
                                Colors.black87,
                                const Color(0xFF915EFF),
                              ], // 🎨 RESPONSIVE GRADIENT
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ).createShader(bounds),
                child: Text(
                  'Create',
                  style: TextStyle(
                    fontSize: 72,
                    fontWeight: FontWeight.bold,
                    color:
                        isDark ? Colors.white : Colors.black87, // 🎨 RESPONSIVE
                    height: 0.9,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),

              // "future" z ikoną
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF00D4FF), Color(0xFF915EFF)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.psychology,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Text(
                    'future',
                    style: TextStyle(
                      fontSize: 72,
                      fontWeight: FontWeight.bold,
                      height: 0.9,
                      // 🎨 RESPONSIVE KOLOR
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 32),

              // Subtitle - RESPONSIVE KOLORY
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  border: Border.all(
                    // 🎨 RESPONSIVE BORDER
                    color: isDark ? Colors.grey.shade600 : Colors.grey.shade300,
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  'You have to fill the profile form first',
                  style: TextStyle(
                    fontSize: 14,
                    // 🎨 RESPONSIVE TEXT COLOR
                    color: isDark ? Colors.grey.shade300 : Colors.grey.shade600,
                    letterSpacing: 0.5,
                  ),
                ),
              ),

              const Spacer(),

              // Profile button - BEZ ZMIAN
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    Expanded(
                      child: CustomButton(
                        text: "Profile →",
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const FillProfileScreen(),
                            ),
                          );
                        },
                        backgroundColor: const Color(0xFF915EFF),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}
