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
  final  _emailController = TextEditingController();
  final  _passwordController = TextEditingController();

  void _handleSingIn(){
    final mail = _emailController.text;
    final password = _passwordController.text;

    if(mail.isNotEmpty && password.isNotEmpty){
      Navigator.push(context, MaterialPageRoute(builder:(context)=>HomePageScreen()));
    } 
    else if(mail.isEmpty && password.isEmpty){
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content :Text("Uzupełnij dane logowania")));
    }
    else if(mail.isEmpty){ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Uzupełnij mail"),));}
    else if(password.isEmpty){ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Uzupelnij hasło"),));}

  }

  
  @override
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
