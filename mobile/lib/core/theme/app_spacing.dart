/// Spacing and sizing tokens measured on the 402pt-wide Figma frames.
abstract final class AppSpacing {
  static const xxs = 4.0;
  static const xs = 8.0;
  static const sm = 12.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const xl = 32.0;
  static const xxl = 48.0;

  /// Horizontal page gutter: (402 - 370) / 2.
  static const gutter = 16.0;

  /// Height of inputs and pill buttons.
  static const control = 61.0;

  /// Gap between stacked form controls.
  static const fieldGap = 16.0;

  /// Home header circles and the logo badge.
  static const headerButton = 69.0;

  /// Glass back/close buttons on pushed screens.
  static const navButton = 52.0;
  static const logo = 99.0;

  static const cardRadius = 28.0;
  static const sheetRadius = 36.0;

  /// Space reserved under scrollable content for the floating tab bar.
  static const tabBarClearance = 120.0;
}
