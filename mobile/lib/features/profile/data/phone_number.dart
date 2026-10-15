/// Profile phone numbers, stored the way the web profile stores them:
/// exactly 9 digits. Input may contain spaces, dashes, dots or brackets and a
/// `+48` / `0048` country prefix — the web schema accepts the same.
abstract final class PhoneNumber {
  static final _separators = RegExp(r'[\s\-().]');
  static final _polishPrefix = RegExp(r'^(\+48|0048)');
  static final _nineDigits = RegExp(r'^\d{9}$');

  /// The 9-digit number, or `null` when the input is not a valid one.
  static String? normalize(String input) {
    final digits = input
        .replaceAll(_separators, '')
        .replaceFirst(_polishPrefix, '');
    return _nineDigits.hasMatch(digits) ? digits : null;
  }

  /// Form validator with the web's wording.
  static String? validate(String input) {
    if (input.trim().isEmpty) return 'Numer telefonu jest wymagany';
    return normalize(input) == null
        ? 'Numer telefonu musi mieć 9 cyfr (możesz dodać +48)'
        : null;
  }
}
