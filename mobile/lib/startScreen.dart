import 'package:flutter/material.dart';
import 'package:vocare/RegisterScreen.dart' show RegisterScreen;
import 'package:vocare/homePageScreen.dart';

class StartScreen extends StatefulWidget {
  const StartScreen({super.key});

  @override
  State<StartScreen> createState() => _StartScreenState();
}

class _StartScreenState extends State<StartScreen> {
  // Kontrolery dla pól tekstowych
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  
  @override
  void dispose() {
    // Zwalniamy kontrolery gdy nie są już potrzebne
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(context) {
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
                controller: emailController,
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
                controller: passwordController,
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
              TextButton(
                onPressed: () {
                  String email = emailController.text;
                  String password = passwordController.text;

                  print("Email: $email");
                  print("Hasło: $password");

                  // Tu możesz dodać sprawdzenie loginu, np. porównanie z testowymi danymi
                  if (email.isNotEmpty && password.isNotEmpty) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => HomePageScreen()),
                    );
                  } else {
                    // Pokaż alert, snackbar albo print
                    print("Uzupełnij pola logowania!");
                  }
                },
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
