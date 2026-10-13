import 'package:flutter/painting.dart';

import 'app_colors.dart';

/// Poppins scale used across the Figma screens.
abstract final class AppTypography {
  static const family = 'Poppins';

  static const _base = TextStyle(
    fontFamily: family,
    color: AppColors.textPrimary,
    letterSpacing: 0,
  );

  /// "Zaloguj się" on auth screens — 32 / Regular.
  static final display = _base.copyWith(fontSize: 32, height: 1.2);

  /// Onboarding headline — 28 / Medium / 37 line height.
  static final headline = _base.copyWith(
    fontSize: 28,
    fontWeight: FontWeight.w500,
    height: 37 / 28,
  );

  /// Header greeting — 22 / Regular.
  static final title = _base.copyWith(fontSize: 22, height: 1.27);

  /// Card titles inside the app.
  static final titleSmall = _base.copyWith(
    fontSize: 17,
    fontWeight: FontWeight.w500,
    height: 1.4,
  );

  static final body = _base.copyWith(fontSize: 16, height: 28 / 16);

  /// Auth subtitles and input text — 16 / ExtraLight.
  static final bodyLight = _base.copyWith(
    fontSize: 16,
    fontWeight: FontWeight.w200,
    height: 28 / 16,
  );

  static final button = _base.copyWith(
    fontSize: 16,
    fontWeight: FontWeight.w500,
    height: 28 / 16,
  );

  /// Secondary links — 14 / Light.
  static final caption = _base.copyWith(
    fontSize: 14,
    fontWeight: FontWeight.w300,
    height: 2,
  );

  static final label = _base.copyWith(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    height: 1.4,
    color: AppColors.textSubtle,
  );

  static final metric = _base.copyWith(
    fontSize: 26,
    fontWeight: FontWeight.w600,
    height: 1.15,
  );
}
