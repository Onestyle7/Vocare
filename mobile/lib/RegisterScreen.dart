import 'package:flutter/material.dart';

class RegisterScreen extends StatelessWidget {
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
          padding: const EdgeInsets.all(8.e0),
          child: Column(
            children: [
             TextField( decoration: InputDecoration(
                  hintText: "Your name",
                  labelText: "Name",
                  prefix: Icon(Icons.person)
             ),),
             SizedBox(height: 30),
             TextField(decoration: InputDecoration(
                  hintText: "Your surname",
                  labelText: "Surname",
                  prefix: Icon(Icons.person)
             ),),
             SizedBox(height: 30),
             TextField(decoration: InputDecoration(
                  hintText: "Your email",
                  labelText: "email",
                  prefix: Icon(Icons.email)
             ),
                  keyboardType: TextInputType.emailAddress),
                  SizedBox(height: 30),
             TextField(decoration: InputDecoration(
                  hintText: "Password",
                  labelText: "Password",
                  prefix: Icon(Icons.security)
          
             ),),
             SizedBox(height: 30),
             TextField(decoration: InputDecoration(
                hintText: "Confirm password",
                labelText: "Confirm password",
                prefix: Icon(Icons.security)
             ),),
            ],
          ),
        ), // Możesz dodać inputy
      ),
    );
  }
}
