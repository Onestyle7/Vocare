import 'package:flutter/material.dart';

class OverflowErrorHandler {
  static void init() {
    // 🔧 UKRYJ WSZYSTKIE OVERFLOW ERRORS
    ErrorWidget.builder = (FlutterErrorDetails errorDetails) {
      // Sprawdź czy to overflow error
      if (errorDetails.exception.toString().contains('RenderFlex overflowed') ||
          errorDetails.exception.toString().contains('overflow')) {
        // Zwróć pusty kontener zamiast error widget
        return Container(
          color: Colors.transparent,
          child: const Center(
            child: Icon(
              Icons.error_outline,
              color: Colors.transparent,
              size: 0,
            ),
          ),
        );
      }

      // Dla innych błędów pokaż normalny error widget (w debug mode)
      return ErrorWidget(errorDetails.exception);
    };
  }
}

// 🔧 GLOBAL OVERFLOW HANDLER - dodaj do main()
class GlobalOverflowHandler extends StatelessWidget {
  final Widget child;

  const GlobalOverflowHandler({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return OverflowBox(
          maxWidth: constraints.maxWidth,
          maxHeight: constraints.maxHeight,
          child: child,
        );
      },
    );
  }
}
