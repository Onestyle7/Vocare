import 'package:flutter/material.dart';
import 'package:vocare/RegisterScreen.dart' show RegisterScreen;
import 'package:vocare/homePageScreen.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class StartScreen extends StatefulWidget {
  const StartScreen({super.key});

  @override
  State<StartScreen> createState() => _StartScreenState();
}

class _StartScreenState extends State<StartScreen> {
  // Kontrolery dla pól tekstowych
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  Future<void> loginUser(String email, String password) async {
    final url = Uri.parse('https://localhost:5001/login');

    try {
      
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
          'twoFactorCode': '',
          'twoFactorRecoveryCode': '',
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final accessToken = data['accessToken'];

        // ZAPISZ token do pamięci urządzenia
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('accessToken', accessToken);
        print('TOKEN ZOSTAŁ ZAPISANY: $accessToken');

        // Przejdź dalej
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => HomePageScreen()),
        );
      } else {
        print('Błąd logowania: ${response.statusCode}');
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Niepoprawny login lub hasło')));
      }
    } catch (e) {
      print('Błąd połączenia: $e');
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Nie można połączyć z serwerem')));
    }
  }

  void _handleSingIn() {
    final mail = _emailController.text;
    final password = _passwordController.text;

    if (mail.isNotEmpty && password.isNotEmpty) {
      loginUser(mail, password);
    } else if (mail.isEmpty && password.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Uzupełnij dane logowania")));
    } else if (mail.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Uzupełnij mail")));
    } else if (password.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Uzupelnij hasło")));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(height: 50),
              Image.asset('assets/img/simba.png', height: 200, width: 200),

              const Text(
                "Vocare",
                style: TextStyle(
                  fontSize: 40,
                  fontWeight: FontWeight.bold,
                  fontStyle: FontStyle.italic,
                ),
              ),

              SizedBox(height: 30),

              // Email input
              TextField(
                controller: _emailController,
                decoration: InputDecoration(
                  hintText: "Your email",
                  labelText: "Email",
                  labelStyle: TextStyle(color: Colors.black, fontSize: 24),
                  fillColor: Colors.white,
                  filled: true,
                  prefix: Icon(Icons.email),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
                keyboardType: TextInputType.emailAddress,
              ),

              SizedBox(height: 20),

              // Password input
              TextField(
                controller: _passwordController,
                decoration: InputDecoration(
                  hintText: "Your password",
                  labelText: "Password",
                  labelStyle: TextStyle(color: Colors.black, fontSize: 24),
                  fillColor: Colors.white,
                  filled: true,
                  prefix: Icon(Icons.security),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
                obscureText: true,
              ),

              SizedBox(height: 20),

              // Login button
              ElevatedButton(
                onPressed: _handleSingIn,
                child: Text("Zaloguj się"),
              ),

              // Forgot password
              TextButton(
                onPressed: () {
                  print("Kliknięto 'Przypomnij hasło'");
                },
                child: Text("Przypomnij hasło"),
              ),

              // Register
              TextButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => RegisterScreen()),
                  );
                },
                child: Text("Sign Up"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
