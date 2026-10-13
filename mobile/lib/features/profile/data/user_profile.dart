import 'profile_dates.dart';

/// Mirrors `UserProfileDto` in the backend. Enums travel as strings
/// (`JsonStringEnumConverter`).
class UserProfile {
  const UserProfile({
    this.firstName = '',
    this.lastName = '',
    this.email = '',
    this.country = '',
    this.address,
    this.phoneNumber,
    this.aboutMe,
    this.additionalInformation,
    this.skills = const [],
    this.softSkills = const [],
    this.education = const [],
    this.workExperience = const [],
    this.certificates = const [],
    this.languages = const [],
    this.personalityType,
    this.willingToRebrand = false,
    this.financialSurvey,
  });

  final String firstName;
  final String lastName;
  final String email;
  final String country;
  final String? address;
  final String? phoneNumber;
  final String? aboutMe;
  final String? additionalInformation;
  final List<String> skills;
  final List<String> softSkills;
  final List<EducationEntry> education;
  final List<WorkEntry> workExperience;
  final List<CertificateEntry> certificates;
  final List<LanguageEntry> languages;
  final PersonalityType? personalityType;
  final bool willingToRebrand;
  final FinancialSurvey? financialSurvey;

  String get fullName => '$firstName $lastName'.trim();

  String get initials {
    final parts = [
      firstName,
      lastName,
    ].where((p) => p.isNotEmpty).map((p) => p[0]);
    return parts.join().toUpperCase();
  }

  /// Fields the backend requires before it accepts a save.
  bool get hasRequiredFields =>
      firstName.isNotEmpty &&
      lastName.isNotEmpty &&
      country.isNotEmpty &&
      personalityType != null;

  factory UserProfile.fromJson(Map json) => UserProfile(
    firstName: _s(json['firstName']),
    lastName: _s(json['lastName']),
    email: _s(json['email']),
    country: _s(json['country']),
    address: json['address'] as String?,
    phoneNumber: json['phoneNumber'] as String?,
    aboutMe: json['aboutMe'] as String?,
    additionalInformation: json['additionalInformation'] as String?,
    skills: _strings(json['skills']),
    softSkills: _strings(json['softSkills']),
    education: _list(json['education'], EducationEntry.fromJson),
    workExperience: _list(json['workExperience'], WorkEntry.fromJson),
    certificates: _list(json['certificates'], CertificateEntry.fromJson),
    languages: _list(json['languages'], LanguageEntry.fromJson),
    personalityType: PersonalityType.parse(json['personalityType']),
    willingToRebrand: json['willingToRebrand'] == true,
    financialSurvey: json['financialSurvey'] is Map
        ? FinancialSurvey.fromJson(json['financialSurvey'] as Map)
        : null,
  );

  Map<String, Object?> toJson() => {
    'firstName': firstName,
    'lastName': lastName,
    'email': email,
    'country': country,
    'address': _nullIfEmpty(address),
    'phoneNumber': _nullIfEmpty(phoneNumber),
    'aboutMe': _nullIfEmpty(aboutMe),
    'additionalInformation': _nullIfEmpty(additionalInformation),
    'skills': skills,
    'softSkills': softSkills,
    'education': education.map((e) => e.toJson()).toList(),
    'workExperience': workExperience.map((e) => e.toJson()).toList(),
    'certificates': certificates.map((e) => e.toJson()).toList(),
    'languages': languages.map((e) => e.toJson()).toList(),
    'personalityType': personalityType?.apiName,
    'willingToRebrand': willingToRebrand,
    'financialSurvey': financialSurvey?.toJson(),
  };

  UserProfile copyWith({
    String? firstName,
    String? lastName,
    String? country,
    String? address,
    String? phoneNumber,
    String? aboutMe,
    String? additionalInformation,
    List<String>? skills,
    List<String>? softSkills,
    List<EducationEntry>? education,
    List<WorkEntry>? workExperience,
    List<CertificateEntry>? certificates,
    List<LanguageEntry>? languages,
    PersonalityType? personalityType,
    bool? willingToRebrand,
    FinancialSurvey? financialSurvey,
  }) => UserProfile(
    firstName: firstName ?? this.firstName,
    lastName: lastName ?? this.lastName,
    email: email,
    country: country ?? this.country,
    address: address ?? this.address,
    phoneNumber: phoneNumber ?? this.phoneNumber,
    aboutMe: aboutMe ?? this.aboutMe,
    additionalInformation: additionalInformation ?? this.additionalInformation,
    skills: skills ?? this.skills,
    softSkills: softSkills ?? this.softSkills,
    education: education ?? this.education,
    workExperience: workExperience ?? this.workExperience,
    certificates: certificates ?? this.certificates,
    languages: languages ?? this.languages,
    personalityType: personalityType ?? this.personalityType,
    willingToRebrand: willingToRebrand ?? this.willingToRebrand,
    financialSurvey: financialSurvey ?? this.financialSurvey,
  );
}

class EducationEntry {
  const EducationEntry({
    required this.institution,
    this.degree = '',
    this.field = '',
    this.startDate = '',
    this.endDate = '',
  });

  final String institution;
  final String degree;
  final String field;
  final String startDate;
  final String endDate;

  factory EducationEntry.fromJson(Map json) => EducationEntry(
    institution: _s(json['institution']),
    degree: _s(json['degree']),
    field: _s(json['field']),
    startDate: _s(json['startDate']),
    endDate: _s(json['endDate']),
  );

  Map<String, Object?> toJson() => {
    'institution': institution,
    'degree': degree,
    'field': field,
    'startDate': _apiDate(startDate),
    'endDate': _apiDate(endDate),
  };
}

class WorkEntry {
  const WorkEntry({
    required this.company,
    required this.position,
    this.description = '',
    this.responsibilities = const [],
    this.startDate,
    this.endDate,
  });

  final String company;
  final String position;
  final String description;
  final List<String> responsibilities;
  final String? startDate;
  final String? endDate;

  factory WorkEntry.fromJson(Map json) => WorkEntry(
    company: _s(json['company']),
    position: _s(json['position']),
    description: _s(json['description']),
    responsibilities: _strings(json['responsibilities']),
    startDate: json['startDate'] as String?,
    endDate: json['endDate'] as String?,
  );

  Map<String, Object?> toJson() => {
    'company': company,
    'position': position,
    'description': description,
    'responsibilities': responsibilities,
    'startDate': _apiDate(startDate),
    'endDate': _apiDate(endDate),
  };
}

class CertificateEntry {
  const CertificateEntry({required this.name, this.date, this.issuer});

  final String name;
  final String? date;
  final String? issuer;

  factory CertificateEntry.fromJson(Map json) => CertificateEntry(
    name: _s(json['name']),
    date: json['date'] as String?,
    issuer: json['issuer'] as String?,
  );

  Map<String, Object?> toJson() => {
    'name': name,
    'date': _apiDate(date),
    'issuer': _nullIfEmpty(issuer),
  };
}

class LanguageEntry {
  const LanguageEntry({required this.language, this.level});

  final String language;
  final String? level;

  factory LanguageEntry.fromJson(Map json) => LanguageEntry(
    language: _s(json['language']),
    level: json['level'] as String?,
  );

  Map<String, Object?> toJson() => {
    'language': language,
    'level': _nullIfEmpty(level),
  };
}

enum RiskAppetite {
  low('Niska'),
  medium('Średnia'),
  high('Wysoka'),
  critical('Bardzo wysoka'),
  unknown('Nie wiem');

  const RiskAppetite(this.label);
  final String label;

  String get apiName => '${name[0].toUpperCase()}${name.substring(1)}';

  static RiskAppetite parse(Object? raw) {
    final value = '$raw'.toLowerCase();
    return RiskAppetite.values.firstWhere(
      (r) => r.name == value || '${r.index + 1}' == value,
      orElse: () => RiskAppetite.unknown,
    );
  }
}

class FinancialSurvey {
  const FinancialSurvey({
    this.currentSalary,
    this.desiredSalary,
    this.hasLoans = false,
    this.loanDetails,
    this.riskAppetite = RiskAppetite.unknown,
    this.willingToRelocate = false,
  });

  final double? currentSalary;
  final double? desiredSalary;
  final bool hasLoans;
  final String? loanDetails;
  final RiskAppetite riskAppetite;
  final bool willingToRelocate;

  factory FinancialSurvey.fromJson(Map json) => FinancialSurvey(
    currentSalary: (json['currentSalary'] as num?)?.toDouble(),
    desiredSalary: (json['desiredSalary'] as num?)?.toDouble(),
    hasLoans: json['hasLoans'] == true,
    loanDetails: json['loanDetails'] as String?,
    riskAppetite: RiskAppetite.parse(json['riskAppetite']),
    willingToRelocate: json['willingToRelocate'] == true,
  );

  Map<String, Object?> toJson() => {
    'currentSalary': currentSalary,
    'desiredSalary': desiredSalary,
    'hasLoans': hasLoans,
    'loanDetails': _nullIfEmpty(loanDetails),
    'riskAppetite': riskAppetite.apiName,
    'willingToRelocate': willingToRelocate,
  };
}

/// 16 MBTI-style types + "Nie wiem"; labels from `frontend/lib/types/personalityTypes.ts`.
enum PersonalityType {
  mediator('Pośrednik'),
  advocate('Rzecznik'),
  logician('Logik'),
  architect('Architekt'),
  campaigner('Działacz'),
  protagonist('Protagonista'),
  debater('Dyskutant'),
  commander('Dowódca'),
  adventurer('Poszukiwacz przygód'),
  defender('Obrońca'),
  virtuoso('Wirtuoz'),
  logistician('Logistyk'),
  entertainer('Animator'),
  consul('Konsul'),
  entrepreneur('Przedsiębiorca'),
  executive('Wykonawca'),
  unknown('Nie wiem');

  const PersonalityType(this.label);
  final String label;

  /// The backend enum name, e.g. `Mediator`.
  String get apiName => '${name[0].toUpperCase()}${name.substring(1)}';

  static PersonalityType? parse(Object? raw) {
    if (raw == null) return null;
    final value = '$raw'.toLowerCase();
    for (final type in PersonalityType.values) {
      if (type.name == value || '${type.index + 1}' == value) return type;
    }
    return null;
  }
}

String _s(Object? v) => v == null ? '' : '$v';

/// The backend parses profile dates with `DateTime.Parse` and accepts
/// `Present` only for work experience; one unparsable entry fails the whole
/// profile save (HTTP 500). "Until now" is therefore sent as `null` — the web
/// form does the same — and other values are normalised to `yyyy-MM-dd`
/// (CV imports may hold `2019`; the API itself returns `10.01.2022 00:00:00`).
/// Anything unrecognised is sent unchanged rather than silently dropped.
String? _apiDate(String? value) {
  final v = value?.trim() ?? '';
  if (v.isEmpty || ProfileDates.isPresent(v)) return null;
  final parsed = ProfileDates.parse(v);
  return parsed == null ? v : ProfileDates.store(parsed);
}

String? _nullIfEmpty(String? v) =>
    (v == null || v.trim().isEmpty) ? null : v.trim();

List<String> _strings(Object? v) => v is List
    ? v.map((e) => '$e').where((e) => e.isNotEmpty).toList()
    : const [];

List<T> _list<T>(Object? v, T Function(Map) fromJson) =>
    v is List ? v.whereType<Map>().map(fromJson).toList() : <T>[];
