import 'package:flutter/material.dart';

class CustomInput extends StatelessWidget {
  final String label;
  final String hintText;
  final TextEditingController controller;
  final Widget? prefixIcon;
  final Color borderColor;
  final double borderRadius;
  final EdgeInsetsGeometry padding;
  final Color fillColor; // 🆕 kolor tła inputa
  final Color textColor; // 🆕 kolor tekstu

  const CustomInput({
    super.key,
    required this.label,
    required this.hintText,
    required this.controller,
    this.prefixIcon,
    this.borderColor = const Color(0xFF915EFF),
    this.borderRadius = 25,
    this.padding = const EdgeInsets.all(16),
    this.fillColor = const Color(0xFF191A23), // domyślny kolor tła
    this.textColor = Colors.white, // domyślny kolor tekstu
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding,
      child: TextField(
        controller: controller,
        style: TextStyle(color: textColor), // kolor tekstu
        decoration: InputDecoration(
          labelText: label,
          hintText: hintText,
          hintStyle: TextStyle(
            color: textColor.withOpacity(0.6),
          ), // kolor podpowiedzi
          labelStyle: TextStyle(color: textColor), // kolor etykiety
          prefixIcon: prefixIcon,
          filled: true,
          fillColor: fillColor, // 🎨 kolor środka inputa
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
