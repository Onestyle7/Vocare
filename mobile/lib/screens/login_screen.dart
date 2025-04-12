import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vocare/screens/aI_asistent_screen.dart';
import 'package:vocare/screens/register_screen.dart';
import 'package:vocare/services/them_service.dart';
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
        MaterialPageRoute(builder: (_) => const AIAsistentPageScreen()),
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
      appBar: AppBar(
        backgroundColor: Colors.black87,
        automaticallyImplyLeading: false, // usuwa strzałkę "wstecz"
        toolbarHeight: 60,

        flexibleSpace: SafeArea(
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
                  ],
                ),
              ],
            ),
          ),
        ),
      ),

      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Positioned(
              left: 100,
              top: 928,
              child: Text("Vocare", style: TextStyle(fontSize: 55)),
            ),

            SizedBox(height: 150),
            TextFormField(
              controller: _emailController,
              decoration: InputDecoration(
                labelText: "Email",
                hintText: "Type your email",
                prefixIcon: const Icon(Icons.email),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(25),
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _passwordController,
              decoration: InputDecoration(
                labelText: "Password",
                hintText: "Type your password",
                prefixIcon: const Icon(Icons.security),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(25),
                ),
              ),
              obscureText: true,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _handleLogin,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color.fromARGB(255, 82, 164, 232),
              ),
              child: const Text("Zaloguj się"),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const RegisterScreen()),
                );
              },
              style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
              child: const Text("Nie masz konta? Zarejestruj się"),
            ),
          ],
        ),
      ),
    );
  }
}
