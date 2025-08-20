import 'package:flutter/material.dart';
import 'package:vocare/widgets/custom_button.dart';
import 'package:vocare/screens/fill_profile_screen.dart';

class CreateFutureView extends StatelessWidget {
  const CreateFutureView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              // Top navigation bar
              Row(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      color:
                          Theme.of(context).brightness == Brightness.dark
                              ? Colors.grey.shade800
                              : Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.arrow_back, size: 24),
                      onPressed: () => Navigator.pop(context),
                      color:
                          Theme.of(context).brightness == Brightness.dark
                              ? Colors.white
                              : Colors.grey.shade700,
                    ),
                  ),
                  const SizedBox(width: 16),
                  const Text(
                    "AI Assistant",
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                  ),
                ],
              ),

              const Spacer(),

              // "Create" text z gradientem
              ShaderMask(
                shaderCallback:
                    (bounds) => const LinearGradient(
                      colors: [Colors.white, Color(0xFF915EFF)],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ).createShader(bounds),
                child: const Text(
                  'Create',
                  style: TextStyle(
                    fontSize: 72,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
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
                  const Text(
                    'future',
                    style: TextStyle(
                      fontSize: 72,
                      fontWeight: FontWeight.bold,
                      height: 0.9,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 32),

              // Subtitle
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'You have to fill the profile form first',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey,
                    letterSpacing: 0.5,
                  ),
                ),
              ),

              const Spacer(),

              // Profile button
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
