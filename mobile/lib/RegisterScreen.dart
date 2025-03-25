import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:vocare/homePageScreen.dart';
import 'package:vocare/startScreen.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

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

  Future<void> registerUser(String mail, String password) async {
    final url = Uri.parse('https://localhost:5001/register');

    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({"email": mail, "password": password}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final accessToken = data['accessToken'];
        print('Zalogowano! Token: $accessToken');
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => HomePageScreen()),
        );
      } else {
        print('Błąd rejestracji: ${response.statusCode}');
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text("Niepoprawne dane")));
      }
    } catch (e) {
      print('Błąd połączenia: $e');
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Nie można połączyć z serwerem')));
    }
  }

    void _handleRegister() {
      final name = _nameController.text;
      final surname = _surnameController.text;
      final email = _emailController.text;
      final password = _passwordController.text;
      final confirmPassword = _confirmPasswordController.text;

      print("Name: $name");
      print("Surname: $surname");
      print("Email: $email");
      print("Password: $password");
      print("Confirm Password: $confirmPassword");

      if (email.isNotEmpty && password.isNotEmpty) {
       registerUser(email, password);
      } else {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text("Uzupełnij dane rejestracji")));
      }
    }

    @override
    Widget build(BuildContext context) {
      return Scaffold(
        appBar: AppBar(
          title: Text('Rejestracja'), // Nagłówek ekranu
        ),

        body: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.black26, Colors.blue],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: Column(
              children: [
                TextField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    hintText: "Your name",
                    labelText: "Name",
                    prefix: Icon(Icons.person),
                  ),
                ),
                SizedBox(height: 30),
                TextField(
                  controller: _surnameController,
                  decoration: InputDecoration(
                    hintText: "Your surname",
                    labelText: "Surname",
                    prefix: Icon(Icons.person),
                  ),
                ),
                SizedBox(height: 30),
                TextField(
                  controller: _emailController,
                  decoration: InputDecoration(
                    hintText: "Your email",
                    labelText: "email",
                    prefix: Icon(Icons.email),
                  ),
                  keyboardType: TextInputType.emailAddress,
                ),
                SizedBox(height: 30),
                TextField(
                  controller: _passwordController,
                  decoration: InputDecoration(
                    hintText: "Password",
                    labelText: "Password",
                    prefix: Icon(Icons.security),
                  ),
                ),
                SizedBox(height: 30),
                TextField(
                  controller: _confirmPasswordController,
                  decoration: InputDecoration(
                    hintText: "Confirm password",
                    labelText: "Confirm password",
                    prefix: Icon(Icons.security),
                  ),
                ),
                ElevatedButton(
                  onPressed: _handleRegister,
                  child: Text("Zarejestruj się"),
                ),
              ],
            ),
          ), // Możesz dodać inputy
        ),
      );
    }
  }

