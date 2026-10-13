import 'package:flutter/painting.dart';

/// Design tokens taken 1:1 from the Figma "Mobile App design" page.
///
/// The app ships dark-only for now; every surface goes through these tokens so
/// a light palette can be added later without touching widgets.
abstract final class AppColors {
  static const background = Color(0xFF16171B);
  static const surface = Color(0xFF1C1E26);
  static const surfaceRaised = Color(0xFF20232D);

  static const textPrimary = Color(0xFFFFFFFF);
  static const textSecondary = Color(0xFFEAE5E5);
  static const textMuted = Color(0xCCFFFFFF);
  static const textSubtle = Color(0x80FFFFFF);
  static const iconMuted = Color(0xBFFFFFFF);

  static const outline = Color(0x80FFFFFF);
  static const divider = Color(0x26FFFFFF);
  static const hairline = Color(0x14FFFFFF);

  static const gradientStart = Color(0xFF9296FD);
  static const gradientMid = Color(0xFF8491FE);
  static const gradientSoft = Color(0xFF9D9BFF);
  static const gradientEnd = Color(0xFFC7A9FE);

  /// Accent used for text highlights; matches the web dashboard primary.
  static const accent = gradientSoft;

  static const danger = Color(0xFFFF7A8A);
  static const success = Color(0xFF6EE7B7);
  static const warning = Color(0xFFFFD27A);

  /// Lane colours of the roadmap step graph (Git-graph style), in lane order.
  /// Lane 0 is the brand line; the rest stay distinct from status colours.
  static const graphLanes = [
    gradientSoft,
    Color(0xFFE9C46A),
    Color(0xFFF28CA8),
    Color(0xFF6FD3E8),
    Color(0xFFF5A15C),
  ];

  static const brandGradient = LinearGradient(
    colors: [gradientStart, gradientMid, gradientSoft, gradientEnd],
    stops: [0, 0.5, 0.77, 1],
  );

  /// Shadow under gradient buttons: `0 5 5.65 rgba(255,255,255,.1)` in Figma.
  static const buttonGlow = [
    BoxShadow(color: Color(0x1AFFFFFF), offset: Offset(0, 5), blurRadius: 11.3),
  ];
}
