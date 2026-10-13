import 'dart:convert';

import 'package:flutter/painting.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';

/// Language of the generated document (web: preview language PL / EN).
enum CvLocale {
  pl('PL', 'Polski'),
  en('EN', 'English');

  const CvLocale(this.code, this.label);
  final String code;
  final String label;
}

/// Web: "Miesiąc i rok" / "Tylko rok".
enum CvDateStyle {
  monthYear('Miesiąc i rok'),
  year('Tylko rok');

  const CvDateStyle(this.label);
  final String label;
}

/// Colour themes of the template. `classic` reproduces the web preview.
enum CvAccent {
  classic(
    'Klasyczny',
    title: Color(0xFF1F2937),
    link: Color(0xFF915EFF),
    skillBg: Color(0xFFDBEAFE),
    skillFg: Color(0xFF1E40AF),
    languageBg: Color(0xFFF3E8FF),
    languageFg: Color(0xFF6B21A8),
    hobbyBg: Color(0xFFDCFCE7),
    hobbyFg: Color(0xFF166534),
  ),
  violet(
    'Fiolet',
    title: Color(0xFF6D28D9),
    link: Color(0xFF7C3AED),
    skillBg: Color(0xFFEDE9FE),
    skillFg: Color(0xFF5B21B6),
    languageBg: Color(0xFFEDE9FE),
    languageFg: Color(0xFF5B21B6),
    hobbyBg: Color(0xFFEDE9FE),
    hobbyFg: Color(0xFF5B21B6),
  ),
  navy(
    'Granat',
    title: Color(0xFF1E3A8A),
    link: Color(0xFF1D4ED8),
    skillBg: Color(0xFFE0E7FF),
    skillFg: Color(0xFF1E3A8A),
    languageBg: Color(0xFFE0E7FF),
    languageFg: Color(0xFF1E3A8A),
    hobbyBg: Color(0xFFE0E7FF),
    hobbyFg: Color(0xFF1E3A8A),
  ),
  graphite(
    'Grafit',
    title: Color(0xFF111827),
    link: Color(0xFF111827),
    skillBg: Color(0xFFF3F4F6),
    skillFg: Color(0xFF374151),
    languageBg: Color(0xFFF3F4F6),
    languageFg: Color(0xFF374151),
    hobbyBg: Color(0xFFF3F4F6),
    hobbyFg: Color(0xFF374151),
  );

  const CvAccent(
    this.label, {
    required this.title,
    required this.link,
    required this.skillBg,
    required this.skillFg,
    required this.languageBg,
    required this.languageFg,
    required this.hobbyBg,
    required this.hobbyFg,
  });

  final String label;
  final Color title;
  final Color link;
  final Color skillBg;
  final Color skillFg;
  final Color languageBg;
  final Color languageFg;
  final Color hobbyBg;
  final Color hobbyFg;
}

class CvDocumentOptions {
  const CvDocumentOptions({
    this.locale = CvLocale.pl,
    this.dateStyle = CvDateStyle.monthYear,
    this.accent = CvAccent.classic,
    this.privacyClause = true,
  });

  final CvLocale locale;
  final CvDateStyle dateStyle;
  final CvAccent accent;

  /// GDPR recruitment consent at the end — expected on Polish CVs.
  final bool privacyClause;

  CvDocumentOptions copyWith({
    CvLocale? locale,
    CvDateStyle? dateStyle,
    CvAccent? accent,
    bool? privacyClause,
  }) => CvDocumentOptions(
    locale: locale ?? this.locale,
    dateStyle: dateStyle ?? this.dateStyle,
    accent: accent ?? this.accent,
    privacyClause: privacyClause ?? this.privacyClause,
  );

  Map<String, Object> toJson() => {
    'locale': locale.name,
    'dateStyle': dateStyle.name,
    'accent': accent.name,
    'privacyClause': privacyClause,
  };

  static CvDocumentOptions fromJson(Map json) {
    T pick<T extends Enum>(List<T> values, Object? raw, T fallback) =>
        values.firstWhere((v) => v.name == raw, orElse: () => fallback);
    return CvDocumentOptions(
      locale: pick(CvLocale.values, json['locale'], CvLocale.pl),
      dateStyle: pick(
        CvDateStyle.values,
        json['dateStyle'],
        CvDateStyle.monthYear,
      ),
      accent: pick(CvAccent.values, json['accent'], CvAccent.classic),
      privacyClause: json['privacyClause'] != false,
    );
  }
}

/// Layout preferences are per CV and per device — like the web, which keeps
/// them outside the CV payload (in `localStorage`).
final cvOptionsProvider =
    NotifierProvider.family<CvOptionsController, CvDocumentOptions, String>(
      CvOptionsController.new,
    );

class CvOptionsController extends Notifier<CvDocumentOptions> {
  CvOptionsController(this.cvId);

  final String cvId;

  String get _key => 'cv.options.$cvId';

  @override
  CvDocumentOptions build() {
    final raw = ref.read(preferencesProvider).getString(_key);
    if (raw == null) return const CvDocumentOptions();
    try {
      return CvDocumentOptions.fromJson(jsonDecode(raw) as Map);
    } on FormatException {
      return const CvDocumentOptions();
    }
  }

  void update(CvDocumentOptions Function(CvDocumentOptions) change) {
    state = change(state);
    ref.read(preferencesProvider).setString(_key, jsonEncode(state.toJson()));
  }
}

/// Section titles of the document — `RESUME_PREVIEW_LABELS` on the web.
class CvLabels {
  const CvLabels._({
    required this.current,
    required this.profile,
    required this.experience,
    required this.projects,
    required this.education,
    required this.certificates,
    required this.skills,
    required this.languages,
    required this.hobbies,
    required this.privacyClause,
  });

  final String current;
  final String profile;
  final String experience;
  final String projects;
  final String education;
  final String certificates;
  final String skills;
  final String languages;
  final String hobbies;
  final String privacyClause;

  static CvLabels of(CvLocale locale) => switch (locale) {
    CvLocale.pl => const CvLabels._(
      current: 'obecnie',
      profile: 'Profil osobisty',
      experience: 'Doświadczenie zawodowe',
      projects: 'Projekty',
      education: 'Edukacja',
      certificates: 'Certyfikaty',
      skills: 'Umiejętności',
      languages: 'Języki',
      hobbies: 'Zainteresowania',
      privacyClause:
          'Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych i w sprawie swobodnego przepływu takich danych oraz uchylenia dyrektywy 95/46/WE (RODO).',
    ),
    CvLocale.en => const CvLabels._(
      current: 'present',
      profile: 'Personal profile',
      experience: 'Work experience',
      projects: 'Projects',
      education: 'Education',
      certificates: 'Certificates',
      skills: 'Skills',
      languages: 'Languages',
      hobbies: 'Hobby',
      privacyClause:
          'I hereby give consent for my personal data included in this application to be processed for the purposes of the recruitment process under the Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 on the protection of natural persons with regard to the processing of personal data and on the free movement of such data (GDPR).',
    ),
  };
}
