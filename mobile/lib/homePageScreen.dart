import 'package:flutter/material.dart';
import 'package:vocare/fillProfile.dart';
class HomePageScreen extends StatelessWidget {
 const HomePageScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Strona główna"),
      ),
      body: Column(
        children: [
              Text("To jest strona Home"),
               TextButton(onPressed: (){
                Navigator.push(context, MaterialPageRoute(builder: (context)=> FillProfile()));
               }, child: Text("Profil"))
              
          ,
        ],
      ),
    );
  }
}
