import 'package:intl/intl.dart';

/// Profile dates are free-form strings in the backend DTOs. The web writes
/// `yyyy-mm-dd` and `Present` for ongoing entries; CV imports may contain
/// `yyyy-MM` or a bare year. This reads all of them and writes the web format.
abstract final class ProfileDates {
  /// Stored value for "until now" — same as the web form.
  static const present = 'Present';

  static final _iso = DateFormat('yyyy-MM-dd');
  static final _long = DateFormat('d MMMM yyyy', 'pl');
  static final _short = DateFormat('LLL yyyy', 'pl');

  static bool isPresent(String? value) => switch (value?.trim().toLowerCase()) {
    'present' || 'obecnie' || 'current' || 'now' || 'teraz' || 'nadal' => true,
    _ => false,
  };

  static DateTime? parse(String? value) {
    var v = value?.trim() ?? '';
    if (v.isEmpty || isPresent(v)) return null;
    final full = DateTime.tryParse(v);
    if (full != null) return full;
    // The API turns stored dates into strings with `DateTime.ToString()`, so
    // they carry a time and follow the server culture: `10.01.2022 00:00:00`
    // (pl-PL) or `01/10/2022 00:00:00` (invariant, month first).
    v = v.replaceFirst(RegExp(r'\s+\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?$'), '');
    final ym = RegExp(r'^(\d{4})[-./](\d{1,2})$').firstMatch(v);
    if (ym != null) return DateTime(int.parse(ym[1]!), int.parse(ym[2]!));
    final mdy = RegExp(r'^(\d{1,2})/(\d{1,2})/(\d{4})$').firstMatch(v);
    if (mdy != null) {
      return DateTime(
        int.parse(mdy[3]!),
        int.parse(mdy[1]!),
        int.parse(mdy[2]!),
      );
    }
    final dmy = RegExp(r'^(\d{1,2})[-.](\d{1,2})[-.](\d{4})$').firstMatch(v);
    if (dmy != null) {
      return DateTime(
        int.parse(dmy[3]!),
        int.parse(dmy[2]!),
        int.parse(dmy[1]!),
      );
    }
    final year = RegExp(r'^(\d{4})$').firstMatch(v);
    if (year != null) return DateTime(int.parse(year[1]!));
    return null;
  }

  static String store(DateTime date) => _iso.format(date);

  /// "12 marca 2024" — inside the form field.
  static String long(String? value) {
    if (isPresent(value)) return 'obecnie';
    final date = parse(value);
    return date == null ? (value ?? '') : _long.format(date);
  }

  /// "mar 2024" — in compact list ranges; a bare year stays a year.
  static String short(String? value) {
    if (isPresent(value)) return 'obecnie';
    final v = value?.trim() ?? '';
    if (RegExp(r'^\d{4}$').hasMatch(v)) return v;
    final date = parse(v);
    return date == null ? v : _short.format(date);
  }

  static String range(String? from, String? to) {
    final a = (from ?? '').trim(), b = (to ?? '').trim();
    if (a.isEmpty && b.isEmpty) return '';
    return '${a.isEmpty ? '?' : short(a)} – ${b.isEmpty ? 'obecnie' : short(b)}';
  }
}
