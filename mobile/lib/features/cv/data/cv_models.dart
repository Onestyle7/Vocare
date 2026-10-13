/// Mirrors the CvGenerator DTOs (`/api/cvs/*`); see `frontend/lib/types/cv.ts`.
/// All models are immutable — the editor replaces them through `copyWith`.
class CvBasics {
  const CvBasics({
    this.firstName = '',
    this.lastName = '',
    this.phone = '',
    this.email = '',
    this.summary = '',
    this.city = '',
    this.country = '',
  });

  final String firstName;
  final String lastName;
  final String phone;
  final String email;
  final String summary;
  final String city;
  final String country;

  String get fullName => '$firstName $lastName'.trim();

  String get location => [city, country].where((s) => s.isNotEmpty).join(', ');

  bool get isEmpty =>
      fullName.isEmpty &&
      phone.isEmpty &&
      email.isEmpty &&
      city.isEmpty &&
      country.isEmpty;

  factory CvBasics.fromJson(Map json) {
    final location = json['location'] is Map
        ? json['location'] as Map
        : const {};
    return CvBasics(
      firstName: _s(json['firstName']),
      lastName: _s(json['lastName']),
      phone: _s(json['phoneNumber']),
      email: _s(json['email']),
      summary: _s(json['summary']),
      city: _s(location['city']),
      country: _s(location['country']),
    );
  }

  Map<String, Object?> toJson() => {
    'firstName': firstName,
    'lastName': lastName,
    'phoneNumber': phone,
    'email': email,
    'summary': summary,
    'location': {'city': city, 'country': country},
  };

  CvBasics copyWith({
    String? firstName,
    String? lastName,
    String? phone,
    String? email,
    String? summary,
    String? city,
    String? country,
  }) => CvBasics(
    firstName: firstName ?? this.firstName,
    lastName: lastName ?? this.lastName,
    phone: phone ?? this.phone,
    email: email ?? this.email,
    summary: summary ?? this.summary,
    city: city ?? this.city,
    country: country ?? this.country,
  );
}

class CvWork {
  const CvWork({
    this.company = '',
    this.position = '',
    this.startDate = '',
    this.endDate = '',
    this.responsibilities = const [],
    this.description,
  });

  final String company;
  final String position;

  /// `yyyy-MM-dd`; [endDate] may be `Present`.
  final String startDate;
  final String endDate;
  final List<String> responsibilities;

  /// Kept round-trip; the web editor does not expose it.
  final String? description;

  factory CvWork.fromJson(Map json) => CvWork(
    company: _s(json['company']),
    position: _s(json['position']),
    startDate: _s(json['startDate']),
    endDate: _s(json['endDate']),
    responsibilities: _strings(json['responsibilities']),
    description: json['description'] as String?,
  );

  Map<String, Object?> toJson() => {
    'company': company,
    'position': position,
    'startDate': startDate,
    'endDate': endDate,
    'responsibilities': responsibilities,
    'description': ?description,
  };
}

class CvEducation {
  const CvEducation({
    this.institution = '',
    this.degree = '',
    this.field = '',
    this.startDate = '',
    this.endDate = '',
    this.description = '',
  });

  final String institution;
  final String degree;
  final String field;
  final String startDate;
  final String endDate;
  final String description;

  factory CvEducation.fromJson(Map json) => CvEducation(
    institution: _s(json['institution']),
    degree: _s(json['degree']),
    field: _s(json['field']),
    startDate: _s(json['startDate']),
    endDate: _s(json['endDate']),
    description: _s(json['description']),
  );

  Map<String, Object?> toJson() => {
    'institution': institution,
    'degree': degree,
    'field': field,
    'startDate': startDate,
    'endDate': endDate,
    'description': description,
  };
}

class CvCertificate {
  const CvCertificate({this.name = '', this.date = ''});

  final String name;
  final String date;

  factory CvCertificate.fromJson(Map json) =>
      CvCertificate(name: _s(json['name']), date: _s(json['date']));

  Map<String, Object?> toJson() => {'name': name, 'date': date};
}

class CvProject {
  const CvProject({this.name = '', this.description = '', this.link = ''});

  final String name;
  final String description;
  final String link;

  factory CvProject.fromJson(Map json) => CvProject(
    name: _s(json['name']),
    description: _s(json['description']),
    link: _s(json['link']),
  );

  Map<String, Object?> toJson() => {
    'name': name,
    'description': description,
    'link': link,
  };
}

/// Social / portfolio link (`CvSocialDto`).
class CvLink {
  const CvLink({this.label = '', this.url = ''});

  final String label;
  final String url;

  factory CvLink.fromJson(Map json) =>
      CvLink(label: _s(json['social']), url: _s(json['link']));

  Map<String, Object?> toJson() => {'social': label, 'link': url};
}

class CvLanguage {
  const CvLanguage({this.language = '', this.fluency = 'Beginner'});

  final String language;

  /// One of [Fluency] values (web `FLUENCY_OPTIONS`).
  final String fluency;

  factory CvLanguage.fromJson(Map json) => CvLanguage(
    language: _s(json['language']),
    fluency: Fluency.normalize(_s(json['fluency'])).value,
  );

  Map<String, Object?> toJson() => {'language': language, 'fluency': fluency};
}

class CvData {
  const CvData({
    this.basics = const CvBasics(),
    this.work = const [],
    this.education = const [],
    this.certificates = const [],
    this.projects = const [],
    this.links = const [],
    this.skills = const [],
    this.languages = const [],
    this.hobbies = const [],
  });

  final CvBasics basics;
  final List<CvWork> work;
  final List<CvEducation> education;
  final List<CvCertificate> certificates;
  final List<CvProject> projects;
  final List<CvLink> links;
  final List<String> skills;
  final List<CvLanguage> languages;
  final List<String> hobbies;

  bool get isEmpty =>
      basics.isEmpty &&
      basics.summary.isEmpty &&
      work.isEmpty &&
      education.isEmpty &&
      certificates.isEmpty &&
      projects.isEmpty &&
      links.isEmpty &&
      skills.isEmpty &&
      languages.isEmpty &&
      hobbies.isEmpty;

  factory CvData.fromJson(Map json) => CvData(
    basics: json['basics'] is Map
        ? CvBasics.fromJson(json['basics'] as Map)
        : const CvBasics(),
    work: _list(json['work'], CvWork.fromJson),
    education: _list(json['education'], CvEducation.fromJson),
    certificates: _list(json['certificates'], CvCertificate.fromJson),
    projects: _list(json['projects'], CvProject.fromJson),
    links: _list(json['social'], CvLink.fromJson),
    skills: _strings(json['skills']),
    languages: _list(json['languages'], CvLanguage.fromJson),
    hobbies: _strings(json['hobbies']),
  );

  Map<String, Object?> toJson() => {
    'basics': basics.toJson(),
    'work': work.map((e) => e.toJson()).toList(),
    'education': education.map((e) => e.toJson()).toList(),
    'certificates': certificates.map((e) => e.toJson()).toList(),
    'projects': projects.map((e) => e.toJson()).toList(),
    'social': links.map((e) => e.toJson()).toList(),
    'skills': skills,
    'languages': languages.map((e) => e.toJson()).toList(),
    'hobbies': hobbies,
  };

  CvData copyWith({
    CvBasics? basics,
    List<CvWork>? work,
    List<CvEducation>? education,
    List<CvCertificate>? certificates,
    List<CvProject>? projects,
    List<CvLink>? links,
    List<String>? skills,
    List<CvLanguage>? languages,
    List<String>? hobbies,
  }) => CvData(
    basics: basics ?? this.basics,
    work: work ?? this.work,
    education: education ?? this.education,
    certificates: certificates ?? this.certificates,
    projects: projects ?? this.projects,
    links: links ?? this.links,
    skills: skills ?? this.skills,
    languages: languages ?? this.languages,
    hobbies: hobbies ?? this.hobbies,
  );
}

class CvDetails {
  const CvDetails({
    required this.id,
    required this.name,
    required this.data,
    this.targetPosition = '',
    this.isDefault = false,
    this.lastModifiedAt,
    this.version = 1,
    this.notes,
  });

  final String id;
  final String name;

  /// Shown under the name on the CV ("profession" in the web editor).
  final String targetPosition;
  final CvData data;
  final bool isDefault;
  final DateTime? lastModifiedAt;
  final int version;
  final String? notes;

  factory CvDetails.fromJson(Map json) => CvDetails(
    id: _s(json['id']),
    name: _s(json['name']),
    targetPosition: _s(json['targetPosition']),
    data: json['cvData'] is Map
        ? CvData.fromJson(json['cvData'] as Map)
        : const CvData(),
    isDefault: json['isDefault'] == true,
    lastModifiedAt: DateTime.tryParse(_s(json['lastModifiedAt']))?.toLocal(),
    version: (json['version'] as num?)?.toInt() ?? 1,
    notes: json['notes'] as String?,
  );

  /// `UpdateCvDto` — name and position are `[StringLength(100)]` there, and
  /// a rejected autosave would fail on every retry, so they are clamped.
  Map<String, Object?> toUpdateJson() => {
    'id': id,
    'name': name.trim().isEmpty ? 'Moje CV' : _clamp100(name.trim()),
    'targetPosition': targetPosition.trim().isEmpty
        ? null
        : _clamp100(targetPosition.trim()),
    'cvData': data.toJson(),
    'notes': ?notes,
  };

  static String _clamp100(String v) =>
      v.length <= 100 ? v : v.substring(0, 100);

  CvDetails copyWith({
    String? name,
    String? targetPosition,
    CvData? data,
    bool? isDefault,
  }) => CvDetails(
    id: id,
    name: name ?? this.name,
    targetPosition: targetPosition ?? this.targetPosition,
    data: data ?? this.data,
    isDefault: isDefault ?? this.isDefault,
    lastModifiedAt: lastModifiedAt,
    version: version,
    notes: notes,
  );
}

class CvListItem {
  const CvListItem({
    required this.id,
    required this.name,
    required this.targetPosition,
    required this.isDefault,
    required this.lastModifiedAt,
  });

  final String id;
  final String name;
  final String targetPosition;
  final bool isDefault;
  final DateTime? lastModifiedAt;

  factory CvListItem.fromJson(Map json) => CvListItem(
    id: _s(json['id']),
    name: _s(json['name']),
    targetPosition: _s(json['targetPosition']),
    isDefault: json['isDefault'] == true,
    lastModifiedAt: DateTime.tryParse(_s(json['lastModifiedAt']))?.toLocal(),
  );
}

class CvLimits {
  const CvLimits({
    required this.canCreateNew,
    required this.currentCount,
    required this.maxLimit,
  });

  final bool canCreateNew;
  final int currentCount;
  final int maxLimit;

  factory CvLimits.fromJson(Map json) => CvLimits(
    canCreateNew: json['canCreateNew'] == true,
    currentCount: (json['currentCount'] as num?)?.toInt() ?? 0,
    maxLimit: (json['maxLimit'] as num?)?.toInt() ?? 0,
  );
}

/// The 8 canonical audit sections (`.agents/instructions/cv-quality-audit-design.md`).
enum CvSection {
  basics('Basics', 'Dane podstawowe'),
  work('Work', 'Doświadczenie'),
  education('Education', 'Wykształcenie'),
  certificates('Certificates', 'Certyfikaty'),
  skills('Skills', 'Umiejętności'),
  languages('Languages', 'Języki'),
  projects('Projects', 'Projekty'),
  social('Social', 'Linki i portfolio');

  const CvSection(this.apiName, this.label);
  final String apiName;
  final String label;

  static CvSection? parse(String raw) {
    final key = raw.trim().toLowerCase();
    for (final s in values) {
      if (s.apiName.toLowerCase() == key) return s;
    }
    return null;
  }
}

class CvSectionScore {
  const CvSectionScore({
    required this.rawName,
    required this.score,
    required this.insights,
  });

  /// Unknown names are kept and shown with a neutral label instead of crashing.
  final String rawName;
  final int score;
  final List<String> insights;

  CvSection? get section => CvSection.parse(rawName);

  String get label => section?.label ?? 'Inna sekcja';

  factory CvSectionScore.fromJson(Map json) => CvSectionScore(
    rawName: _s(json['sectionName']),
    score: _clamp(json['score']),
    insights: _strings(json['insights']),
  );
}

class CvAnalysis {
  const CvAnalysis({
    required this.overallScore,
    required this.targetPositionScore,
    required this.sections,
    required this.topImprovements,
  });

  final int overallScore;
  final int targetPositionScore;
  final List<CvSectionScore> sections;
  final List<String> topImprovements;

  /// Lowest scores first — the spec's ordering for the section list.
  List<CvSectionScore> get sectionsByPriority =>
      [...sections]..sort((a, b) => a.score.compareTo(b.score));

  factory CvAnalysis.fromJson(Map json) => CvAnalysis(
    overallScore: _clamp(json['overallScore']),
    targetPositionScore: _clamp(json['targetPositionScore']),
    sections: _list(json['sectionScores'], CvSectionScore.fromJson),
    topImprovements: _strings(json['topImprovements']).take(3).toList(),
  );
}

/// Web `FLUENCY_OPTIONS` with Polish / English labels.
enum Fluency {
  beginner('Beginner', 'Początkujący', 'Beginner'),
  conversational('Conversational', 'Średnio zaawansowany', 'Conversational'),
  advanced('Advanced', 'Zaawansowany', 'Advanced'),
  proficient('Proficient', 'Biegły', 'Proficient'),
  native('Native speaker', 'Język ojczysty', 'Native speaker');

  const Fluency(this.value, this.labelPl, this.labelEn);
  final String value;
  final String labelPl;
  final String labelEn;

  static const _aliases = {
    'basic': beginner,
    'elementary': beginner,
    'a1': beginner,
    'a2': beginner,
    'początkujący': beginner,
    'podstawowy': beginner,
    'intermediate': conversational,
    'b1': conversational,
    'średnio zaawansowany': conversational,
    'komunikatywny': conversational,
    'b2': advanced,
    'upper-intermediate': advanced,
    'zaawansowany': advanced,
    'fluent': proficient,
    'c1': proficient,
    'c2': proficient,
    'biegły': proficient,
    'native': native,
    'mother tongue': native,
    'ojczysty': native,
    'język ojczysty': native,
  };

  /// Same rules as `normalizeFluency` on the web.
  static Fluency normalize(String raw) {
    final lower = raw.trim().toLowerCase();
    for (final f in values) {
      if (f.value.toLowerCase() == lower) return f;
    }
    return _aliases[lower] ?? beginner;
  }
}

/// Web `educationDegreeLabels`.
const cvDegreeOptions = [
  ('Bachelor', 'Inżynier/Licencjat', 'Bachelor'),
  ('Master', 'Magister', 'Master'),
  ('PhD', 'Doktor', 'PhD'),
  ('Associate', 'Studia podyplomowe', 'Postgraduate'),
  ('High School', 'Wykształcenie średnie', 'High School'),
  ('Other', 'Inne', 'Other'),
];

String degreeLabel(String degree, {bool english = false}) {
  for (final (value, pl, en) in cvDegreeOptions) {
    if (value == degree) return english ? en : pl;
  }
  return degree;
}

String _s(Object? v) => v == null ? '' : '$v'.trim();

int _clamp(Object? v) => ((v as num?)?.round() ?? 0).clamp(0, 100);

List<String> _strings(Object? v) => v is List
    ? v.map((e) => '$e'.trim()).where((e) => e.isNotEmpty).toList()
    : const [];

List<T> _list<T>(Object? v, T Function(Map) fromJson) =>
    v is List ? v.whereType<Map>().map(fromJson).toList() : <T>[];
