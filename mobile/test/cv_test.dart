import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:vocare/features/cv/data/cv_document.dart';
import 'package:vocare/features/cv/data/cv_models.dart';
import 'package:vocare/features/cv/data/cv_profile_import.dart';
import 'package:vocare/features/cv/pdf/cv_pdf.dart';
import 'package:vocare/features/profile/data/user_profile.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() async {
    await initializeDateFormatting('pl');
    await initializeDateFormatting('en_US');
  });

  const backendCv = {
    'id': 'cv-1',
    'name': 'Analityk',
    'targetPosition': 'Junior Data Analyst',
    'isDefault': true,
    'version': 3,
    'lastModifiedAt': '2026-10-01T10:00:00Z',
    'cvData': {
      'basics': {
        'firstName': 'Anna',
        'lastName': 'Łęcka',
        'phoneNumber': '+48 600 100 200',
        'email': 'anna@example.com',
        'summary': 'Analityczka danych.',
        'location': {'city': 'Kraków', 'country': 'Polska'},
      },
      'work': [
        {
          'company': 'Firma',
          'position': 'Stażystka',
          'startDate': '2025-03-01',
          'endDate': 'Present',
          'responsibilities': ['Raporty w **Power BI**'],
          'description': 'kept',
        },
      ],
      'social': [
        {'social': 'GitHub', 'link': 'https://github.com/anna'},
      ],
      'languages': [
        {'language': 'Angielski', 'fluency': 'C1'},
      ],
      'skills': ['SQL', 'Python'],
      'hobbies': ['Bieganie'],
    },
  };

  group('CvDetails', () {
    test('reads the backend DTO and writes UpdateCvDto back', () {
      final cv = CvDetails.fromJson(backendCv);
      expect(cv.data.basics.phone, '+48 600 100 200');
      expect(cv.data.basics.location, 'Kraków, Polska');
      expect(cv.data.links.single.label, 'GitHub');
      expect(cv.data.work.single.endDate, 'Present');

      final json = cv.toUpdateJson();
      final data = json['cvData']! as Map<String, Object?>;
      final basics = data['basics']! as Map<String, Object?>;
      expect(basics['phoneNumber'], '+48 600 100 200');
      expect(basics['location'], {'city': 'Kraków', 'country': 'Polska'});
      expect(data['social'], [
        {'social': 'GitHub', 'link': 'https://github.com/anna'},
      ]);
      // Fields the mobile editor does not expose survive a round trip.
      expect(
        (data['work']! as List).single,
        containsPair('description', 'kept'),
      );
    });

    test('an empty name or target position is normalised for the API', () {
      final cv = CvDetails.fromJson(
        backendCv,
      ).copyWith(name: ' ', targetPosition: '  ');
      final json = cv.toUpdateJson();
      expect(json['name'], 'Moje CV');
      expect(json['targetPosition'], isNull);
    });

    test('name and position respect the backend 100-character limit', () {
      final long = 'x' * 140;
      final json = CvDetails.fromJson(
        backendCv,
      ).copyWith(name: long, targetPosition: long).toUpdateJson();
      expect((json['name']! as String).length, 100);
      expect((json['targetPosition']! as String).length, 100);
    });
  });

  group('Fluency', () {
    test('normalises CEFR levels and Polish names like the web', () {
      expect(Fluency.normalize('C1'), Fluency.proficient);
      expect(Fluency.normalize('b2'), Fluency.advanced);
      expect(Fluency.normalize('Język ojczysty'), Fluency.native);
      expect(Fluency.normalize('Native speaker'), Fluency.native);
      expect(Fluency.normalize('???'), Fluency.beginner);
    });
  });

  group('CvAnalysis', () {
    test('clamps scores, keeps unknown sections and sorts by priority', () {
      final analysis = CvAnalysis.fromJson({
        'overallScore': 140,
        'targetPositionScore': -5,
        'sectionScores': [
          {
            'sectionName': 'Work',
            'score': 80,
            'insights': ['ok'],
          },
          {'sectionName': 'Social', 'score': 0, 'insights': []},
          {'sectionName': 'Mystery', 'score': 50},
        ],
        'topImprovements': ['a', 'b', 'c', 'd'],
      });
      expect(analysis.overallScore, 100);
      expect(analysis.targetPositionScore, 0);
      expect(analysis.topImprovements, ['a', 'b', 'c']);
      expect(analysis.sectionsByPriority.map((s) => s.score), [0, 50, 80]);
      expect(analysis.sectionsByPriority.first.label, 'Linki i portfolio');
      expect(analysis.sectionsByPriority[1].section, isNull);
      expect(analysis.sectionsByPriority[1].label, 'Inna sekcja');
    });
  });

  group('cvDataFromProfile', () {
    const profile = UserProfile(
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'jan@example.com',
      country: 'Polska',
      address: 'Gdańsk',
      aboutMe: 'O mnie',
      skills: ['Excel'],
      workExperience: [
        WorkEntry(
          company: 'ACME',
          position: 'Analityk',
          description: 'Opis stanowiska',
          startDate: '2024-02-01',
        ),
      ],
      education: [EducationEntry(institution: 'UG', startDate: '2019')],
      languages: [LanguageEntry(language: 'Angielski', level: 'B2')],
    );

    test('maps like the backend and keeps profile-less sections', () {
      final current = CvDetails.fromJson(backendCv).data;
      final data = cvDataFromProfile(profile, current: current);

      expect(data.basics.fullName, 'Jan Kowalski');
      expect(data.basics.city, 'Gdańsk');
      expect(data.basics.summary, 'O mnie');
      // No responsibilities → the description becomes the only bullet.
      expect(data.work.single.responsibilities, ['Opis stanowiska']);
      // A started job without an end date is ongoing.
      expect(data.work.single.endDate, 'Present');
      // A bare year stays a year.
      expect(data.education.single.startDate, '2019');
      expect(data.languages.single.fluency, 'Advanced');
      expect(data.skills, ['Excel']);
      // Not part of the profile → untouched.
      expect(data.links, current.links);
      expect(data.hobbies, ['Bieganie']);
    });

    test('profileHasCvData', () {
      expect(profileHasCvData(profile), isTrue);
      expect(profileHasCvData(const UserProfile()), isFalse);
    });
  });

  group('PDF', () {
    test('file name is ASCII-safe', () {
      final cv = CvDetails.fromJson(backendCv);
      expect(cvPdfFileName(cv), 'Anna_Lecka_CV.pdf');
      expect(
        cvPdfFileName(const CvDetails(id: 'x', name: 'x', data: CvData())),
        'Moje_CV.pdf',
      );
    });

    test('renders a valid A4 document for every option set', () async {
      final cv = CvDetails.fromJson(backendCv);
      for (final options in const [
        CvDocumentOptions(),
        CvDocumentOptions(
          locale: CvLocale.en,
          dateStyle: CvDateStyle.year,
          accent: CvAccent.navy,
          privacyClause: false,
        ),
      ]) {
        final bytes = await buildCvPdf(cv, options);
        expect(String.fromCharCodes(bytes.take(5)), '%PDF-');
        expect(bytes.length, greaterThan(10000));
      }
    });

    test('an empty CV still renders', () async {
      final bytes = await buildCvPdf(
        const CvDetails(id: 'x', name: 'Puste', data: CvData()),
        const CvDocumentOptions(),
      );
      expect(String.fromCharCodes(bytes.take(5)), '%PDF-');
    });
  });
}
