// lib/screens/register_screen.dart
import 'package:flutter/material.dart';
import 'package:vocare/repositories/auth_repository.dart';
import 'package:vocare/screens/aI_asistent_screen.dart';
import 'package:vocare/widgets/theme_toggle_button.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _surnameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  final AuthRepository _authRepository = AuthRepository();

  void _handleRegister() async {
    final email = _emailController.text;
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (email.isNotEmpty && password == confirmPassword) {
      final success = await _authRepository.register(email, password);
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
      appBar: AppBar(actions: [ThemeToggleButton()]),
      body: Container(
        padding: const EdgeInsets.all(8.0),
        child: Column(
          children: [
            Positioned(
              left: 100,
              top: 928,
              child: Text("Vocare", style: TextStyle(fontSize: 55)),
            ),
            SizedBox(height: 55),
            TextField(
              controller: _surnameController,
              decoration: InputDecoration(
                labelText: "Full name",
                hintText: "type your full name",
                prefix: Icon(Icons.person),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(25),
                ),
              ),
            ),
            SizedBox(height: 16),
            TextField(
              controller: _emailController,
              decoration: InputDecoration(
                labelText: "Email",
                hintText: "type your email",
                prefix: Icon(Icons.email),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(25),
                ),
              ),
              keyboardType: TextInputType.emailAddress,
            ),
            SizedBox(height: 16),
            TextField(
              controller: _passwordController,
              decoration: InputDecoration(
                labelText: "Password",
                hintText: "Type your password",
                prefix: Icon(Icons.security),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(25),
                ),
              ),
              obscureText: true,
            ),
            SizedBox(height: 16),
            TextField(
              controller: _confirmPasswordController,
              decoration: InputDecoration(
                labelText: "Confirm Password",
                hintText: "Confirm your password",
                prefix: Icon(Icons.security),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(25),
                ),
              ),
              obscureText: true,
            ),
            SizedBox(height: 26),
            ElevatedButton(
              onPressed: _handleRegister,
              child: Text("Zarejestruj się"),
            ),
          ],
        ),
      ),
    );
  }
}
