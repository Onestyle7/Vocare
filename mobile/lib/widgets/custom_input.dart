import 'package:flutter/material.dart';

class CustomInput extends StatelessWidget {
  final String label;
  final String hintText;
  final TextEditingController controller;
  final Widget? prefixIcon;
  final Widget? suffixIcon; // 🆕 Dodane dla przycisku show/hide
  final Color borderColor;
  final double borderRadius;
  final EdgeInsetsGeometry padding;
  final Color fillColor;
  final Color textColor;
  final TextInputType? keyboardType;
  final bool obscureText; // 🆕 Dodane dla ukrywania hasła

  const CustomInput({
    super.key,
    required this.label,
    required this.hintText,
    required this.controller,
    this.prefixIcon,
    this.suffixIcon, // 🆕
    this.borderColor = const Color(0xFF915EFF),
    this.borderRadius = 25,
    this.padding = const EdgeInsets.all(16),
    this.fillColor = const Color(0xFF191A23),
    this.textColor = Colors.white,
    this.keyboardType,
    this.obscureText = false, // 🆕 Domyślnie false
  });

  @override
  Widget build(BuildContext context) {
    // 🔍 DEBUG: Sprawdź czy obscureText działa
    print('CustomInput obscureText: $obscureText for label: $label');

    return Padding(
      padding: padding,
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        obscureText: obscureText, // 🆕 Ukrywa tekst jeśli true
        style: TextStyle(color: textColor),
        decoration: InputDecoration(
          labelText: label,
          hintText: hintText,
          hintStyle: TextStyle(color: textColor.withOpacity(0.6)),
          labelStyle: TextStyle(color: textColor),
          prefixIcon: prefixIcon,
          suffixIcon: suffixIcon, // 🆕 Dodane
          filled: true,
          fillColor: fillColor,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(borderRadius),
            borderSide: BorderSide(color: borderColor, width: 2),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(borderRadius),
            borderSide: BorderSide(color: borderColor, width: 2),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(borderRadius),
            borderSide: BorderSide(color: borderColor, width: 2),
          ),
        ),
      ),
    );
  }
}
