// lib/screens/register_screen.dart
import 'package:flutter/material.dart';
import 'package:vocare/repositories/auth_repository.dart';
import 'package:vocare/screens/aI_asistent_screen.dart';
import 'package:vocare/widgets/custom_button.dart';
import 'package:vocare/widgets/custom_input.dart';
import 'package:vocare/widgets/nav_bar_button.dart';
import 'package:vocare/widgets/theme_toggle_button.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  final AuthRepository _authRepository = AuthRepository();

  void _handleRegister() async {
    final email = _emailController.text;
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (email.isNotEmpty && password == confirmPassword) {
      final success = await _authRepository.register(
        email,
        password,
        confirmPassword,
      );
      if (success) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => AIAsistentPageScreen()),
        );
      } else {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text("Niepoprawne dane")));
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Uzupełnij dane lub popraw hasło")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        padding: const EdgeInsets.all(8.0),
        child: Column(
          children: [
            const SizedBox(height: 72),
            Center(
              child: Image.asset(
                'assets/img/vocare.png',
                height: 80,
                fit: BoxFit.contain,
              ),
            ),
            SizedBox(height: 25),
            CustomInput(
              label: "Full name",
              hintText: "Type your full name",
              controller: _fullNameController,
              prefixIcon: Icon(Icons.person),
            ),

            CustomInput(
              label: "Email",
              hintText: "Type your email",
              controller: _emailController,
              prefixIcon: Icon(Icons.email),
            ),

            CustomInput(
              label: "Password",
              hintText: "Type your password",
              controller: _passwordController,
              prefixIcon: Icon(Icons.security),
            ),

            CustomInput(
              label: "Confirm password",
              hintText: "Type your password",
              controller: _confirmPasswordController,
              prefixIcon: Icon(Icons.security),
            ),

            CustomButton(text: "Register", onPressed: _handleRegister),
          ],
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
                NavBarButtons(destinations: [NavDestination.logout]),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
