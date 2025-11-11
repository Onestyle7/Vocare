// mobile/lib/screens/register_screen.dart
import 'package:flutter/material.dart';
import 'package:vocare/repositories/auth_repository.dart';
import 'package:vocare/screens/home_screen.dart';
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
  bool _isLoading = false;
  bool _isGoogleLoading = false;

  /// Rejestracja email/hasło
  void _handleRegister() async {
    final email = _emailController.text;
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Uzupełnij wszystkie pola')));
      return;
    }

    if (password != confirmPassword) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Hasła nie są identyczne')));
      return;
    }

    setState(() => _isLoading = true);

    final success = await _authRepository.register(
      email,
      password,
      confirmPassword,
    );

    setState(() => _isLoading = false);

    if (success && mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const HomeScreen()),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Rejestracja nie powiodła się")),
      );
    }
  }

  /// 🆕 Rejestracja/Logowanie przez Google
  Future<void> _handleGoogleSignIn() async {
    setState(() => _isGoogleLoading = true);

    try {
      final success = await _authRepository.signInWithGoogle();

      if (mounted) {
        setState(() => _isGoogleLoading = false);

        if (success) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => const HomeScreen()),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Logowanie przez Google nie powiodło się'),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isGoogleLoading = false);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Błąd: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              const SizedBox(height: 60),
              // Logo
              Center(
                child: Image.asset(
                  'assets/img/vocare.png',
                  height: 80,
                  fit: BoxFit.contain,
                ),
              ),
              const SizedBox(height: 40),

              // Full name input
              CustomInput(
                label: "Full name",
                hintText: "Type your full name",
                controller: _fullNameController,
                prefixIcon: const Icon(Icons.person),
              ),

              // Email input
              CustomInput(
                label: "Email",
                hintText: "Type your email",
                controller: _emailController,
                prefixIcon: const Icon(Icons.email),
                keyboardType: TextInputType.emailAddress,
              ),

              // Password input
              CustomInput(
                label: "Password",
                obscureText: true,
                hintText: "Type your password",
                controller: _passwordController,
                prefixIcon: const Icon(Icons.security),
              ),

              // Confirm password input
              CustomInput(
                label: "Confirm password",
                obscureText: true,
                hintText: "Confirm your password",
                controller: _confirmPasswordController,
                prefixIcon: const Icon(Icons.security),
              ),

              const SizedBox(height: 16),

              // Register button
              _isLoading
                  ? const CircularProgressIndicator()
                  : CustomButton(text: "Register", onPressed: _handleRegister),

              const SizedBox(height: 20),

              // 🆕 Divider z tekstem "OR"
              Row(
                children: [
                  Expanded(child: Divider(color: Colors.grey.shade600)),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      "OR",
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Expanded(child: Divider(color: Colors.grey.shade600)),
                ],
              ),

              const SizedBox(height: 20),

              // 🆕 Google Sign-In button
              _isGoogleLoading
                  ? const CircularProgressIndicator()
                  : _buildGoogleSignInButton(),

              const SizedBox(height: 30),

              // Back to login link
              RichText(
                text: TextSpan(
                  style: const TextStyle(fontSize: 16),
                  children: [
                    TextSpan(
                      text: "Already have an account? ",
                      style: TextStyle(
                        color: Theme.of(context).textTheme.bodyMedium?.color,
                        fontSize: 16,
                      ),
                    ),
                    WidgetSpan(
                      child: GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: const Text(
                          "Log in",
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
      ),
      bottomNavigationBar: Container(
        height: 60,
        decoration: const BoxDecoration(
          color: Colors.black87,
          borderRadius: BorderRadius.only(
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

  /// 🆕 Stylowy przycisk Google Sign-In
  Widget _buildGoogleSignInButton() {
    return InkWell(
      onTap: _handleGoogleSignIn,
      borderRadius: BorderRadius.circular(25),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
        margin: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(25),
          border: Border.all(color: Colors.grey.shade300, width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Google logo
            Image.network(
              'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
              height: 24,
              width: 24,
              errorBuilder: (context, error, stackTrace) {
                return const Icon(Icons.g_mobiledata, size: 24);
              },
            ),
            const SizedBox(width: 12),
            const Text(
              "Continue with Google",
              style: TextStyle(
                color: Colors.black87,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }
}
