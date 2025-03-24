import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:vocare/startScreen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  State<RegisterScreen> createState() => _RegisterScreenState();

 
}

class _RegisterScreenState extends State<RegisterScreen>{
    
    final _nameController = TextEditingController();
    final _surnameController = TextEditingController();
    final _emailController = TextEditingController();
    final _passwordController = TextEditingController();
    final _confirmPasswordController = TextEditingController();
    

    void _handleRegister(){

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


      if (name.isNotEmpty && surname.isNotEmpty && email.isNotEmpty && password.isNotEmpty && confirmPassword.isNotEmpty){
              Navigator.push(context, MaterialPageRoute(builder:(context)=> StartScreen()),);
             }else{ ScaffoldMessenger.of(context).showSnackBar(
             SnackBar(content: Text("Uzupełnij dane rejestracji"),)
      );}

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
            colors:[Colors.black26,Colors.blue],
              begin : Alignment.topLeft,
                end: Alignment.bottomRight,),
              
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
                  prefix: Icon(Icons.person)
             ),),
             SizedBox(height: 30),
             TextField(
              controller: _surnameController,
              decoration: InputDecoration(
                  hintText: "Your surname",
                  labelText: "Surname",
                  prefix: Icon(Icons.person)
             ),),
             SizedBox(height: 30),
             TextField(
              controller: _emailController,
              decoration: InputDecoration(
                  hintText: "Your email",
                  labelText: "email",
                  prefix: Icon(Icons.email)
             ),
                  keyboardType: TextInputType.emailAddress),
                  SizedBox(height: 30),
             TextField(
              controller: _passwordController,
              decoration: InputDecoration(
                  hintText: "Password",
                  labelText: "Password",
                  prefix: Icon(Icons.security)
          
             ),),
             SizedBox(height: 30),
             TextField(
              controller: _confirmPasswordController,
              decoration: InputDecoration(
                hintText: "Confirm password",
                labelText: "Confirm password",
                prefix: Icon(Icons.security)
             ),),
             ElevatedButton(onPressed: _handleRegister, child: Text("Zarejestruj się")
             
             )
            ],
          ),
        ), // Możesz dodać inputy
      ),
    );
  }
}
