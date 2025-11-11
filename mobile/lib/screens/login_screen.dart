// mobile/lib/screens/login_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
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
  bool _isLoading = false;
  bool _isGoogleLoading = false;

  @override
  void initState() {
    super.initState();
    _attemptSilentSignIn();
  }

  /// 🆕 Próba automatycznego logowania przy starcie
  Future<void> _attemptSilentSignIn() async {
    final success = await authRepository.attemptSilentSignIn();
    if (success && mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const HomeScreen()),
      );
    }
  }

  /// Logowanie email/hasło
  void _handleLogin() async {
    final email = _emailController.text;
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Uzupełnij dane logowania')));
      return;
    }

    setState(() => _isLoading = true);

    final isLoggedIn = await authRepository.login(email, password);

    setState(() => _isLoading = false);

    if (isLoggedIn && mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const HomeScreen()),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Niepoprawny login lub hasło')),
      );
    }
  }

  /// 🆕 Logowanie przez Google
  Future<void> _handleGoogleSignIn() async {
    setState(() => _isGoogleLoading = true);

    try {
      final success = await authRepository.signInWithGoogle();

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
    final themeService = Provider.of<ThemeService>(context);

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
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
              const SizedBox(height: 50),

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
                hintText: "Type your password",
                controller: _passwordController,
                prefixIcon: const Icon(Icons.password),
                obscureText: true,
              ),

              const SizedBox(height: 16),

              // Login button
              _isLoading
                  ? const CircularProgressIndicator()
                  : CustomButton(text: "Log In", onPressed: _handleLogin),

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

              // Sign up link
              RichText(
                text: TextSpan(
                  style: const TextStyle(fontSize: 16),
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
                        child: const Text(
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
      ),
      bottomNavigationBar: Container(
        height: 60,
        decoration: const BoxDecoration(
          color: Color.fromARGB(222, 16, 14, 14),
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
            // Google logo (można użyć ikony lub obrazka)
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
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
