import 'package:flutter/material.dart';
import 'hanging_tag_animation.dart';

class VocareHangingTag extends StatelessWidget {
  final double? width;
  final double? height;
  final Color? bandColor;
  final Color? cardColor;

  const VocareHangingTag({
    super.key,
    this.width,
    this.height,
    this.bandColor,
    this.cardColor,
  });

  @override
  Widget build(BuildContext context) {
    // 🔧 Debug: sprawdźmy czy kolory są przekazywane
    final actualBandColor = bandColor ?? const Color(0xFF915EFF);
    final actualCardColor =
        cardColor ??
        (Theme.of(context).brightness == Brightness.dark
            ? const Color(0xFF1E1E1E) // 🎨 Ciemniejszy w dark mode
            : Colors.white);

    print('🎨 VocareHangingTag colors:');
    print('   Band: $actualBandColor');
    print('   Card: $actualCardColor');

    return Container(
      width: width ?? 280,
      height: height ?? 350,
      child: HangingTagAnimation(
        width: width ?? 280,
        height: height ?? 350,
        bandColor:
            actualBandColor, // 🔧 Używamy zmiennych zamiast bezpośrednich wartości
        cardColor: actualCardColor,
      ),
    );
  }
}
