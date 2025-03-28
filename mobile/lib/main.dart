import 'package:flutter/material.dart';
import 'package:vocare/startScreen.dart';

void main() {
  runApp(
    MaterialApp(
      home: Scaffold( // Główny kontener aplikacji, który dostarcza strukturę ekranu (np. AppBar, Body)
        body: Container( // Widget używany do organizowania elementów i nadawania tła, marginesów, paddingów itp.
          decoration: const BoxDecoration(
            gradient: LinearGradient( // Tworzy gradient tła z dwóch kolorów
              colors: [Color.fromARGB(255, 12, 12, 14), Color.fromARGB(255, 203, 200, 200),],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: StartScreen(), // Ekran startowy aplikacji
        ),
      ),
    ),
  );
}
