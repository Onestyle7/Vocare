/// Same rules and copy as `frontend/features/auth/dal/schemas.ts`.
abstract final class AuthValidators {
  static final _email = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$');

  static String? email(String value) {
    if (value.isEmpty) return 'Podaj adres e-mail';
    if (!_email.hasMatch(value)) return 'Niepoprawny adres e-mail';
    return null;
  }

  static String? requiredPassword(String value) =>
      value.isEmpty ? 'Hasło jest wymagane' : null;

  static String? newPassword(String value) {
    for (final rule in PasswordRule.values) {
      if (!rule.test(value)) return rule.error;
    }
    return null;
  }

  static String? Function(String) confirm(String Function() password) =>
      (value) => value != password() ? 'Hasła nie są takie same' : null;
}

enum PasswordRule {
  length('6+ znaków', 'Hasło musi mieć co najmniej 6 znaków'),
  lower('mała litera', 'Hasło musi zawierać co najmniej jedną małą literę'),
  upper('wielka litera', 'Hasło musi zawierać co najmniej jedną wielką literę'),
  digit('cyfra', 'Hasło musi zawierać co najmniej jedną cyfrę'),
  special(
    'znak specjalny',
    'Hasło musi zawierać przynajmniej jeden znak specjalny',
  );

  const PasswordRule(this.label, this.error);
  final String label;
  final String error;

  static final _special = RegExp(r'''[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]''');

  bool test(String value) => switch (this) {
    length => value.length >= 6,
    lower => value.contains(RegExp('[a-z]')),
    upper => value.contains(RegExp('[A-Z]')),
    digit => value.contains(RegExp(r'\d')),
    special => value.contains(_special),
  };
}
