import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vocare/screens/aI_asistent_screen.dart';
import 'package:vocare/screens/home_screen.dart';
import 'package:vocare/screens/register_screen.dart';
import 'package:vocare/services/them_service.dart';
import 'package:vocare/widgets/custom_button.dart';
import 'package:vocare/widgets/custom_input.dart';
import 'package:vocare/widgets/nav_bar_button.dart'
    show NavBarButtons, NavDestination;
import 'package:vocare/widgets/theme_toggle_button.dart';
import '../repositories/auth_repository.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final AuthRepository authRepository = AuthRepository();

  void _handleLogin() async {
    final email = _emailController.text;
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Uzupełnij dane logowania')));
      return;
    }

    final isLoggedIn = await authRepository.login(email, password);

    if (isLoggedIn) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const HomeScreen()),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Niepoprawny login lub hasło')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeService = Provider.of<ThemeService>(
      context,
    ); // <- dostęp do przełącznika

    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const SizedBox(height: 92),
            Center(
              child: Image.asset(
                'assets/img/vocare.png',
                height: 80,
                fit: BoxFit.contain,
              ),
            ),

            SizedBox(height: 70),
            CustomInput(
              label: "Email",
              hintText: "Type your email",
              controller: _emailController,
              prefixIcon: Icon(Icons.email),
            ),

            CustomInput(
              label: "Password",
              hintText: "Type your passsword",
              controller: _passwordController,
              prefixIcon: Icon(Icons.password),
              obscureText: true,
            ),

            const SizedBox(height: 16),

            CustomButton(text: "Log In", onPressed: _handleLogin),
            const SizedBox(height: 12),

            RichText(
              text: TextSpan(
                style: TextStyle(fontSize: 16),
                children: [
                  TextSpan(
                    text: "Don't have an account? ",
                    style: TextStyle(
                      color: Theme.of(context).textTheme.bodyMedium?.color,
                      fontSize: 16,
                    ),
                  ),
                  WidgetSpan(
                    child: GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const RegisterScreen(),
                          ),
                        );
                      },
                      child: Text(
                        "Sign up",
                        style: TextStyle(
                          color: Color(0xFF915EFF),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        height: 60,
        decoration: BoxDecoration(
          color: const Color.fromARGB(222, 16, 14, 14),
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
