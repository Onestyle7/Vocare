// Walks through every MVP screen against canned backend responses and saves
// screenshots (build/screenshots/) for design review:
//
//   flutter drive --driver=test_driver/integration_test.dart \
//     --target=integration_test/screenshot_tour_test.dart -d <simulator>
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:liquid_glass_widgets/liquid_glass_widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vocare/app.dart';
import 'package:vocare/core/network/api_client.dart';
import 'package:vocare/core/network/api_error.dart';
import 'package:vocare/core/network/result.dart';
import 'package:vocare/core/providers.dart';
import 'package:vocare/core/router/app_router.dart';
import 'package:vocare/core/storage/token_store.dart';

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  Future<void> shot(WidgetTester tester, String name) async {
    await tester.pump(const Duration(milliseconds: 50));
    await binding.takeScreenshot(name);
  }

  /// Pumps frames for [ms]; pumpAndSettle never returns while the onboarding
  /// art floats or skeletons pulse.
  Future<void> wait(WidgetTester tester, [int ms = 900]) async {
    for (var t = 0; t < ms; t += 50) {
      await tester.pump(const Duration(milliseconds: 50));
    }
  }

  /// Brings [finder] into the middle of the screen, clear of the floating
  /// glass header and bottom bar, so a tap lands on it.
  Future<void> reveal(WidgetTester tester, Finder finder) async {
    await tester.ensureVisible(finder);
    await wait(tester, 300);
    await tester.drag(find.byType(ListView).first, const Offset(0, 320));
    await wait(tester, 700);
  }

  testWidgets('screenshot tour', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    await initializeDateFormatting('pl');
    await LiquidGlassWidgets.initialize(enablePerformanceMonitor: false);
    final tokens = _MemoryTokenStore();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          tokenStoreProvider.overrideWithValue(tokens),
          preferencesProvider.overrideWithValue(prefs),
          apiClientProvider.overrideWith((ref) => _FakeApi(tokens)),
        ],
        child: LiquidGlassWidgets.wrap(
          brightnessResolver: Theme.maybeBrightnessOf,
          child: const VocareApp(),
        ),
      ),
    );

    await wait(tester, 1600);
    await shot(tester, '01_onboarding_1');
    await tester.tap(find.text('Kontynuuj'));
    await wait(tester);
    await shot(tester, '02_onboarding_2');
    await tester.tap(find.text('Kontynuuj'));
    await wait(tester);
    await shot(tester, '03_onboarding_3');
    await tester.tap(find.text('Kontynuuj'));
    await wait(tester);
    await shot(tester, '04_sign_in');

    await tester.tap(find.text('Zaloguj się').last);
    await wait(tester, 400);
    await shot(tester, '05_sign_in_validation');

    await tester.tap(
      find.text('Nie masz konta? Zarejestruj się', findRichText: true),
    );
    await wait(tester);
    await tester.enterText(find.byType(TextField).at(1), 'Vocare1');
    await wait(tester, 300);
    FocusManager.instance.primaryFocus?.unfocus();
    await wait(tester, 500);
    await shot(tester, '06_sign_up');
    await tester.tap(find.bySemanticsLabel('Wstecz').first);
    await wait(tester);

    await tester.tap(find.text('Zapomniałeś hasła?'));
    await wait(tester);
    await shot(tester, '07_forgot_password');
    await tester.enterText(find.byType(TextField).first, 'kacper@vocare.pl');
    await tester.tap(find.text('Kontynuuj'));
    await wait(tester);
    FocusManager.instance.primaryFocus?.unfocus();
    await wait(tester, 400);
    await shot(tester, '08_forgot_password_sent');
    await tester.tap(find.text('Wróć do logowania'));
    await wait(tester);

    await tester.enterText(find.byType(TextField).at(0), 'kacper@vocare.pl');
    await tester.enterText(find.byType(TextField).at(1), 'Vocare1!');
    FocusManager.instance.primaryFocus?.unfocus();
    await tester.tap(find.text('Zaloguj się').last);
    await wait(tester, 1200);
    await shot(tester, '09_consents');

    await tester.tap(find.textContaining('Oświadczam'));
    await wait(tester, 300);
    await tester.tap(find.text('Akceptuję i przechodzę dalej'));
    await wait(tester, 1800);
    // First landing: explicit consent before any data goes to OpenAI.
    await shot(tester, '10_ai_consent');
    await tester.tap(find.text('Zgadzam się'));
    await wait(tester, 900);
    await shot(tester, '10_dashboard');

    await tester.drag(find.byType(ListView).first, const Offset(0, -520));
    await wait(tester, 900);
    await shot(tester, '11_dashboard_scrolled');

    await tester.tap(find.bySemanticsLabel(RegExp('^Profil')));
    await wait(tester, 1200);
    await shot(tester, '13_profile');
    await tester.drag(find.byType(ListView).first, const Offset(0, -700));
    await wait(tester, 700);
    await shot(tester, '14_profile_scrolled');

    await tester.tap(find.text('Umiejętności'));
    await wait(tester, 900);
    await shot(tester, '15_profile_sheet');
    await tester.tapAt(const Offset(200, 60));
    await wait(tester, 700);

    await tester.tap(find.text('Frontend Developer'));
    await wait(tester, 900);
    await shot(tester, '15b_work_entry_sheet');
    await tester.tap(find.text('1 marca 2024'));
    await wait(tester, 1200);
    await shot(tester, '15c_native_calendar');
    await tester.tap(find.text('Gotowe'));
    await wait(tester, 700);
    await tester.tap(find.bySemanticsLabel('Obecnie').last);
    await wait(tester, 900);
    await shot(tester, '15d_end_date_off');
    await tester.tapAt(const Offset(200, 60));
    await wait(tester, 700);

    await tester.dragUntilVisible(
      find.text('Finanse i preferencje'),
      find.byType(ListView).first,
      const Offset(0, -300),
    );
    await reveal(tester, find.text('Finanse i preferencje'));
    await tester.tap(find.text('Finanse i preferencje'));
    await wait(tester, 1000);
    await shot(tester, '15e_finance_sheet');
    await tester.tap(find.bySemanticsLabel('Nie wiem').last);
    await wait(tester, 700);
    await shot(tester, '15f_finance_risk_unknown');
    await tester.tapAt(const Offset(200, 40));
    await wait(tester, 700);

    await tester.dragUntilVisible(
      find.text('Prywatność i dokumenty'),
      find.byType(ListView).first,
      const Offset(0, -300),
    );
    // The section closes the profile: scroll to the very end.
    await tester.drag(find.byType(ListView).first, const Offset(0, -1500));
    await wait(tester, 900);
    await shot(tester, '15g_profile_privacy');
    await tester.tap(find.bySemanticsLabel('Wstecz').first);
    await wait(tester);

    await tester.tap(find.bySemanticsLabel(RegExp('Powiadomienia')));
    await wait(tester, 1200);
    await shot(tester, '16_notifications');
    await tester.tap(find.bySemanticsLabel('Wstecz').first);
    await wait(tester);

    await tester.tap(find.bySemanticsLabel('Asystent'));
    await wait(tester, 1200);
    await shot(tester, '17_assistant');
    await tester.drag(find.byType(ListView).first, const Offset(0, -620));
    await wait(tester, 700);
    await shot(tester, '18_assistant_paths');

    await tester.tap(find.text('Data Analyst'));
    await wait(tester, 1000);
    await shot(tester, '19_career_path');
    await tester.drag(find.byType(ListView).first, const Offset(0, -900));
    await wait(tester, 700);
    await shot(tester, '20_career_path_swot');
    await tester.drag(find.byType(ListView).first, const Offset(0, -700));
    await wait(tester, 700);
    await shot(tester, '21_career_path_offers');
    await tester.tap(find.bySemanticsLabel('Wstecz').first);
    await wait(tester);

    // The action sits at the very end of the list, above the tab bar.
    await tester.drag(find.byType(ListView).first, const Offset(0, -3000));
    await wait(tester, 900);
    await tester.tap(find.text('Wygeneruj nową rekomendację'));
    await wait(tester, 1000);
    await shot(tester, '22_cost_sheet');
    await tester.tap(find.text('Generuj'));
    await wait(tester, 1500);
    await shot(tester, '23_generating');
    await wait(tester, 3500);

    await tester.tap(find.bySemanticsLabel('Analiza rynku'));
    await wait(tester, 1400);
    await shot(tester, '24_market');
    await tester.drag(find.byType(ListView).first, const Offset(0, -560));
    await wait(tester, 1200);
    await shot(tester, '25_market_charts');
    await tester.drag(find.byType(ListView).first, const Offset(0, -760));
    await wait(tester, 900);
    await shot(tester, '26_market_difficulty');
    await tester.drag(find.byType(ListView).first, const Offset(0, -2400));
    await wait(tester, 900);
    await shot(tester, '27_market_trends');

    await tester.tap(find.bySemanticsLabel('Roadmapa'));
    await wait(tester, 1400);
    await shot(tester, '28_roadmap_list');
    await tester.tap(find.text('Otwórz'));
    await wait(tester, 1400);
    await shot(tester, '29_roadmap_detail');
    await tester.drag(find.byType(ListView).first, const Offset(0, -420));
    await wait(tester, 800);
    await shot(tester, '29b_roadmap_graph');
    await tester.drag(find.byType(ListView).first, const Offset(0, -420));
    await wait(tester, 800);
    await shot(tester, '29c_roadmap_graph_cross_phase');
    await reveal(tester, find.text('Zbuduj dashboard sprzedażowy'));
    // Held, not released: the node leans in and the line bends with it.
    final hold = await tester.startGesture(
      tester.getCenter(find.text('Zbuduj dashboard sprzedażowy')),
    );
    await wait(tester, 400);
    await shot(tester, '29d_step_pressed');
    await hold.cancel();
    await wait(tester, 600);
    await tester.tap(find.text('Zbuduj dashboard sprzedażowy'));
    await wait(tester, 1000);
    await shot(tester, '30_step_sheet');
    await tester.tap(find.text('Ukończono').last);
    await wait(tester, 900);
    await shot(tester, '31_step_completed');

    // ── CV creator ─────────────────────────────────────────────────────
    ProviderScope.containerOf(
      tester.element(find.byType(VocareApp)),
    ).read(routerProvider).go(Routes.cv);
    await wait(tester, 1400);
    await shot(tester, '32_cv_list');

    await tester.tap(find.text('Nowe CV'));
    await wait(tester, 900);
    await shot(tester, '33_cv_create_sheet');
    await tester.tapAt(const Offset(200, 40));
    await wait(tester, 800);

    await tester.tap(find.text('Analityk danych'));
    await wait(tester, 1500);
    await shot(tester, '34_cv_editor');
    await tester.drag(find.byType(ListView).first, const Offset(0, -640));
    await wait(tester, 800);
    await shot(tester, '35_cv_editor_sections');

    await reveal(tester, find.text('Stażystka analityczna'));
    await tester.tap(find.text('Stażystka analityczna'));
    await wait(tester, 900);
    await shot(tester, '36_cv_work_sheet');
    await tester.tapAt(const Offset(200, 40));
    await wait(tester, 800);

    await tester.tap(find.text('Podgląd'));
    await wait(tester, 3000);
    await shot(tester, '37_cv_preview');
    await tester.tap(find.bySemanticsLabel('Kolor: Granat'));
    await tester.tap(find.bySemanticsLabel('Język CV: English'));
    await wait(tester, 2500);
    await shot(tester, '38_cv_preview_en_navy');

    await tester.tap(find.bySemanticsLabel('Analiza'));
    await wait(tester, 1400);
    await shot(tester, '39_cv_analysis');
    await tester.drag(find.byType(ListView).first, const Offset(0, -700));
    await wait(tester, 800);
    await shot(tester, '40_cv_analysis_sections');
    await reveal(tester, find.text('Popraw sekcję').first);
    await tester.tap(find.text('Popraw sekcję').first);
    await wait(tester, 1400);
    await shot(tester, '41_cv_jump_to_section');

    await tester.tap(find.bySemanticsLabel('Dopasuj'));
    await wait(tester, 900);
    await shot(tester, '42_cv_offer_sheet');
    await tester.tapAt(const Offset(200, 40));
    await wait(tester, 800);

    await tester.tap(find.bySemanticsLabel('Więcej opcji'));
    await wait(tester, 800);
    await shot(tester, '43_cv_menu');
    await tester.tapAt(const Offset(200, 40));
    await wait(tester, 800);

    // No target position → a prompt to set it, never "0%".
    await tester.tap(find.bySemanticsLabel('Wstecz').first);
    await wait(tester, 900);
    await tester.tap(find.text('Moje CV'));
    await wait(tester, 1400);
    await tester.tap(find.bySemanticsLabel('Analiza'));
    await wait(tester, 1400);
    await shot(tester, '44_cv_analysis_no_target');
    await tester.tap(find.bySemanticsLabel('Wstecz').first);
    await wait(tester, 900);
    await tester.tap(find.bySemanticsLabel('Wstecz').first);
    await wait(tester, 900);

    // Never analysed → empty state; opening it charges nothing.
    await tester.tap(find.text('Frontend Developer').first);
    await wait(tester, 1400);
    await tester.tap(find.bySemanticsLabel('Analiza'));
    await wait(tester, 1400);
    await shot(tester, '45_cv_analysis_empty');
  });
}

class _MemoryTokenStore extends TokenStore {
  AuthTokens? _tokens;

  @override
  AuthTokens? get current => _tokens;

  @override
  Future<AuthTokens?> load() async => _tokens;

  @override
  Future<void> save(AuthTokens tokens) async => _tokens = tokens;

  @override
  Future<void> clear() async => _tokens = null;
}

/// Answers with payloads shaped exactly like the backend DTOs.
class _FakeApi extends ApiClient {
  _FakeApi(TokenStore store)
    : super(
        tokenStore: store,
        onSessionExpired: () {},
        onConsentsRequired: () {},
      );

  static final Map<String, Object?> _responses = {
    '/api/Auth/login': {
      'accessToken': 'token',
      'userId': 'u1',
      'email': 'kacper@vocare.pl',
      'expiresIn': 3600,
    },
    '/api/Auth/forgot-password': {'success': true},
    '/api/Legal/status': {'hasValidConsents': false},
    '/api/Legal/pending': [
      {
        'id': 'd1',
        'type': 'TermsOfService',
        'version': '2.1',
        'contentPath': '/terms-of-service',
      },
      {
        'id': 'd2',
        'type': 'PrivacyPolicy',
        'version': '3.0',
        'contentPath': '/privacy-policy',
      },
    ],
    '/api/Legal/accept': {'success': true, 'accessToken': 'token2'},
    '/api/Dashboard/summary': {
      'recommendationsCount': 3,
      'analysisCount': 2,
      'roadmapsCount': 1,
      'cvsCount': 4,
      'profileCompletionPercentage': 78,
      'salaryProgressDto': {
        'currentSalary': 9000,
        'expectedSalary': 14000,
        'goalCompletionPercentage': 64,
      },
    },
    '/api/Dashboard/profile-attributes': {
      'practicalExperience': 72,
      'hardCompetencies': 81,
      'creativity': 58,
      'teamwork': 76,
      'independence': 69,
      'softCompetencies': 64,
      'certification': 40,
      'technicalSkills': 85,
    },
    '/api/Billing/access-status': {
      'tokenBalance': 240,
      'subscriptionStatus': 'None',
    },
    '/api/UserProfile/GetCurrentUserProfile': {
      'firstName': 'Kacper',
      'lastName': 'Nowak',
      'email': 'kacper@vocare.pl',
      'country': 'Polska',
      'address': 'Warszawa',
      'personalityType': 'Architect',
      'aboutMe': 'Frontend developer, który chce wejść w product design i AI.',
      'skills': ['TypeScript', 'React', 'Next.js', 'Flutter', 'Figma'],
      'softSkills': ['Komunikacja', 'Praca zespołowa'],
      'workExperience': [
        {
          'company': 'Vocare',
          'position': 'Frontend Developer',
          'description': '',
          'startDate': '2024-03',
          'endDate': null,
        },
      ],
      'education': [
        {
          'institution': 'Politechnika Warszawska',
          'degree': 'Inżynier',
          'field': 'Informatyka',
          'startDate': '2020',
          'endDate': '2024',
        },
      ],
      'languages': [
        {'language': 'Angielski', 'level': 'C1'},
      ],
      'financialSurvey': {
        'currentSalary': 9000,
        'desiredSalary': 14000,
        'riskAppetite': 'Medium',
        'willingToRelocate': true,
      },
    },
    '/api/Ai/last-recommendation': _recommendation,
    '/api/Ai/recommendations': _recommendation,
    '/api/JobOffers/matching/my-recommendations/detailed': [
      {
        'careerPathId': 'p2',
        'careerPathName': 'Data Analyst',
        'requiredSkills': ['SQL', 'Python', 'Power BI'],
        'averageMatchScore': 71.4,
        'highQualityMatches': 2,
        'totalOffersInCategory': 148,
        'dataQualityWarning': null,
        'matchedOffers': [
          {
            'id': 'o1',
            'title': 'Junior Data Analyst',
            'companyName': 'Allegro',
            'url': 'https://example.com/o1',
            'category': 'Data',
            'seniorityLevel': 'Junior',
            'briefDescription':
                '<p>Analiza danych sprzedażowych, raporty w <b>Power BI</b> i praca z zespołem produktu.</p>',
            'salaryMin': 7000,
            'salaryMax': 9500,
            'salaryCurrency': 'PLN',
            'locations': ['Warszawa', 'Poznań'],
            'skills': ['SQL', 'Power BI'],
            'publishedAt': '2026-10-02T10:00:00Z',
            'matchScore': 82,
            'confidenceLevel': 'high',
            'matchDetails': {
              'userMatchedSkills': ['SQL', 'Python'],
              'missingSkills': ['Power BI'],
            },
          },
          {
            'id': 'o2',
            'title': 'Analityk danych (BI)',
            'companyName': 'mBank',
            'url': 'https://example.com/o2',
            'category': 'Data',
            'seniorityLevel': 'Mid',
            'briefDescription':
                'Budowa dashboardów i modeli danych dla obszaru ryzyka.',
            'salaryMin': null,
            'salaryMax': 12000,
            'salaryCurrency': 'PLN',
            'locations': ['Łódź'],
            'skills': ['SQL'],
            'publishedAt': '2026-09-28T10:00:00Z',
            'matchScore': 64,
            'confidenceLevel': 'medium',
            'matchDetails': {
              'userMatchedSkills': ['SQL'],
              'missingSkills': ['DAX', 'Statystyka'],
            },
          },
        ],
      },
    ],
    '/api/MarketAnalysis/latest': _market,
    '/api/MarketAnalysis': _market,
    '/api/Roadmap/user-roadmaps': [
      {
        'id': 'r1',
        'title': 'Roadmapa: Data Analyst',
        'timeHorizonMonths': 9,
        'status': 'Active',
        'createdAt': '2026-10-08T10:00:00Z',
        'careerPathName': 'Data Analyst',
        'progress': 0,
        'failureReason': '',
        'generationStatus': 'Ready',
      },
    ],
    '/api/Roadmap/r1/progress': {'progress': 40.0},
    '/api/Roadmap/r1': _roadmap,
    '/api/cvs/my-cvs': [
      {
        'id': 'cv1',
        'name': 'Analityk danych',
        'targetPosition': 'Junior Data Analyst',
        'isDefault': true,
        'lastModifiedAt': '2026-10-09T18:20:00Z',
      },
      {
        'id': 'cv2',
        'name': 'Moje CV',
        'targetPosition': null,
        'isDefault': false,
        'lastModifiedAt': '2026-10-02T09:00:00Z',
      },
      {
        'id': 'cv3',
        'name': 'Frontend Developer',
        'targetPosition': 'Frontend Developer',
        'isDefault': false,
        'lastModifiedAt': '2026-09-20T12:00:00Z',
      },
    ],
    '/api/cvs/limits': {
      'canCreateNew': true,
      'currentCount': 3,
      'maxLimit': 25,
    },
    '/api/cvs/details/cv1': _cv1,
    '/api/cvs/update/cv1': _cv1,
    '/api/cvs/details/cv2': _cv2,
    '/api/cvs/update/cv2': _cv2,
    '/api/cvs/details/cv3': _cv3,
    '/api/cvs/update/cv3': _cv3,
    '/api/cvs/analysis/cv1': {
      'overallScore': 74,
      'targetPositionScore': 68,
      'sectionScores': [
        {
          'sectionName': 'Basics',
          'score': 90,
          'insights': ['Kompletne dane kontaktowe.'],
        },
        {
          'sectionName': 'Work',
          'score': 72,
          'insights': [
            'Dodaj liczby do drugiego stanowiska.',
            'Zaczynaj punkty od czasowników.',
          ],
        },
        {'sectionName': 'Education', 'score': 85, 'insights': []},
        {
          'sectionName': 'Certificates',
          'score': 70,
          'insights': ['Dodaj certyfikat z SQL.'],
        },
        {
          'sectionName': 'Skills',
          'score': 80,
          'insights': ['Pogrupuj umiejętności techniczne.'],
        },
        {'sectionName': 'Languages', 'score': 88, 'insights': []},
        {
          'sectionName': 'Projects',
          'score': 58,
          'insights': ['Opisz wynik projektu i użyte narzędzia.'],
        },
        {
          'sectionName': 'Social',
          'score': 40,
          'insights': ['Dodaj link do portfolio z projektami.'],
        },
      ],
      'topImprovements': [
        'Dodaj link do portfolio z najlepszymi projektami analitycznymi.',
        'Opisz rezultaty projektów liczbami, np. zaoszczędzony czas.',
        'Uzupełnij doświadczenie o mierzalne osiągnięcia.',
      ],
    },
    '/api/cvs/analysis/cv2': {
      'overallScore': 46,
      'targetPositionScore': 0,
      'sectionScores': [
        {'sectionName': 'Basics', 'score': 80, 'insights': []},
        {
          'sectionName': 'Work',
          'score': 55,
          'insights': ['Opisz obowiązki konkretniej.'],
        },
        {
          'sectionName': 'Projects',
          'score': 0,
          'insights': ['Dodaj co najmniej jeden projekt.'],
        },
      ],
      'topImprovements': ['Dodaj co najmniej jeden projekt z opisem efektu.'],
    },
    '/api/Notification/unread-count': {'unreadCount': 2},
    '/api/Notification/user-notifications': [
      {
        'id': 'n1',
        'title': 'Roadmapa jest gotowa',
        'message':
            'Twój 12-miesięczny plan dla ścieżki „Product Designer” czeka na Ciebie.',
        'type': 'RoadmapGenerationCompleted',
        'isRead': false,
        'createdAt': DateTime.now()
            .subtract(const Duration(hours: 2))
            .toIso8601String(),
      },
      {
        'id': 'n2',
        'title': 'Nie udało się wygenerować roadmapy',
        'message': 'Spróbuj ponownie — tokeny zostały zwrócone na Twoje konto.',
        'type': 'RoadmapGenerationFailed',
        'isRead': true,
        'createdAt': DateTime.now()
            .subtract(const Duration(days: 3))
            .toIso8601String(),
      },
    ],
  };

  static const _cvData = {
    'basics': {
      'firstName': 'Anna',
      'lastName': 'Nowak',
      'phoneNumber': '+48 600 123 456',
      'email': 'anna.nowak@example.com',
      'summary':
          'Analityczka danych z doświadczeniem w raportowaniu sprzedaży i automatyzacji procesów w Pythonie. '
          'Szukam roli Junior Data Analyst, w której połączę SQL, Power BI i komunikację z biznesem.',
      'location': {'city': 'Kraków', 'country': 'Polska'},
    },
    'work': [
      {
        'company': 'Nordlight Commerce',
        'position': 'Stażystka analityczna',
        'startDate': '2025-03-01',
        'endDate': 'Present',
        'responsibilities': [
          'Raporty sprzedażowe w **Power BI** dla 4 zespołów',
          'Automatyzacja eksportów danych w Pythonie — ok. 6 h tygodniowo mniej pracy ręcznej',
          'Analiza lejka konwersji i rekomendacje zmian w kampaniach',
        ],
      },
      {
        'company': 'Fundacja Kod Przyszłości',
        'position': 'Wolontariuszka — analiza danych',
        'startDate': '2023-10-01',
        'endDate': '2025-02-01',
        'responsibilities': [
          'Ankiety i dashboard dla 1200 uczestników programu',
        ],
      },
    ],
    'education': [
      {
        'institution': 'Uniwersytet Ekonomiczny w Krakowie',
        'degree': 'Bachelor',
        'field': 'Informatyka i ekonometria',
        'startDate': '2021-10-01',
        'endDate': '2025-06-30',
      },
    ],
    'certificates': [
      {
        'name': 'Google Data Analytics Professional Certificate',
        'date': '2024-11-01',
      },
    ],
    'projects': [
      {
        'name': 'Dashboard sprzedaży e-commerce',
        'description':
            'Model danych i raport w Power BI na publicznym zbiorze 500 tys. transakcji.',
        'link': 'https://github.com/annanowak/sales-dashboard',
      },
    ],
    'social': [
      {'social': 'LinkedIn', 'link': 'https://linkedin.com/in/annanowak'},
      {'social': 'GitHub', 'link': 'https://github.com/annanowak'},
    ],
    'skills': ['SQL', 'Python', 'Power BI', 'Excel', 'pandas', 'Statystyka'],
    'languages': [
      {'language': 'Polski', 'fluency': 'Native speaker'},
      {'language': 'Angielski', 'fluency': 'Advanced'},
    ],
    'hobbies': ['Bieganie', 'Fotografia'],
  };

  static const _cv1 = {
    'id': 'cv1',
    'name': 'Analityk danych',
    'targetPosition': 'Junior Data Analyst',
    'isDefault': true,
    'version': 4,
    'lastModifiedAt': '2026-10-09T18:20:00Z',
    'cvData': _cvData,
  };

  static const _cv2 = {
    'id': 'cv2',
    'name': 'Moje CV',
    'targetPosition': null,
    'isDefault': false,
    'version': 1,
    'lastModifiedAt': '2026-10-02T09:00:00Z',
    'cvData': _cvData,
  };

  static const _cv3 = {
    'id': 'cv3',
    'name': 'Frontend Developer',
    'targetPosition': 'Frontend Developer',
    'isDefault': false,
    'version': 1,
    'lastModifiedAt': '2026-09-20T12:00:00Z',
    'cvData': _cvData,
  };

  static const _market = {
    'marketAnalysis': {
      'industryStatistics': [
        {
          'industry': 'Product Designer',
          'minSalary': 7000,
          'maxSalary': 19000,
          'employmentRate': 38,
          'growthForecast':
              'Stabilny popyt, ale dużo kandydatów początkujących; ok. 4–7% więcej ofert rocznie dla osób z portfolio i doświadczeniem w badaniach',
          'salaryProgression': [
            {
              'careerLevel': 'Junior',
              'yearsOfExperience': '0–2',
              'minSalary': 6000,
              'averageSalary': 7500,
              'maxSalary': 9000,
            },
            {
              'careerLevel': 'Mid',
              'yearsOfExperience': '2–4',
              'minSalary': 9000,
              'averageSalary': 11500,
              'maxSalary': 14000,
            },
            {
              'careerLevel': 'Senior',
              'yearsOfExperience': '4–7',
              'minSalary': 13000,
              'averageSalary': 16000,
              'maxSalary': 19000,
            },
            {
              'careerLevel': 'Lead',
              'yearsOfExperience': '7+',
              'minSalary': 17000,
              'averageSalary': 20500,
              'maxSalary': 25000,
            },
          ],
          'workAttributes': {
            'stressLevel': 5,
            'analyticalThinking': 7,
            'creativity': 9,
            'teamwork': 8,
            'independence': 6,
            'routineVsDynamic': 7,
            'customerFacing': 6,
            'technicalDepth': 5,
          },
          'entryDifficulty': {
            'difficultyScore': 58,
            'difficultyLevel': 'Średnia',
            'missingSkillsCount': 3,
            'missingSkills': ['Badania UX', 'Design system', 'Prototypowanie'],
            'matchingSkillsCount': 5,
            'estimatedTimeToReady': '6–9 miesięcy',
            'explanation':
                'Znajomość frontendu skraca drogę — brakuje głównie warsztatu badawczego i portfolio.',
          },
          'aiNarrator': {
            'salaryInsight':
                'Wynagrodzenia rosną najszybciej po przejściu z poziomu junior na mid.',
            'workStyleInsight':
                'Dużo pracy zespołowej i kreatywnej, umiarkowany stres.',
            'entryAdvice':
                'Zbuduj 3 case studies pokazujące proces, nie tylko wynik.',
            'motivationalMessage':
                'Twoje doświadczenie z kodem to rzadka przewaga.',
            'personalizedRecommendation':
                'Zacznij od kursu badań UX i redesignu jednej aplikacji.',
          },
        },
        {
          'industry': 'Data Analyst',
          'minSalary': 6500,
          'maxSalary': 17000,
          'employmentRate': 82,
          'growthForecast': 'Stabilny popyt',
          'salaryProgression': [
            {
              'careerLevel': 'Junior',
              'yearsOfExperience': '0–2',
              'minSalary': 6000,
              'averageSalary': 7000,
              'maxSalary': 8500,
            },
            {
              'careerLevel': 'Mid',
              'yearsOfExperience': '2–4',
              'minSalary': 8500,
              'averageSalary': 10500,
              'maxSalary': 13000,
            },
            {
              'careerLevel': 'Senior',
              'yearsOfExperience': '4+',
              'minSalary': 12000,
              'averageSalary': 14500,
              'maxSalary': 17000,
            },
          ],
          'workAttributes': {
            'stressLevel': 4,
            'analyticalThinking': 10,
            'creativity': 5,
            'teamwork': 6,
            'independence': 8,
            'routineVsDynamic': 5,
            'customerFacing': 4,
            'technicalDepth': 8,
          },
          'entryDifficulty': {
            'difficultyScore': 44,
            'difficultyLevel': 'Średnia',
            'missingSkillsCount': 2,
            'missingSkills': ['Power BI', 'Statystyka'],
            'matchingSkillsCount': 4,
            'estimatedTimeToReady': '4–6 miesięcy',
            'explanation': 'SQL i Python już masz — brakuje narzędzi BI.',
          },
          'aiNarrator': {
            'salaryInsight': 'Bankowość płaci analitykom najwięcej.',
            'workStyleInsight': 'Samodzielna, analityczna praca.',
            'entryAdvice': 'Opublikuj 2 dashboardy na publicznych danych.',
            'motivationalMessage': 'Dane są wszędzie — popyt nie zniknie.',
            'personalizedRecommendation': 'Zrób certyfikat Power BI (PL-300).',
          },
        },
      ],
      'skillDemand': [
        {
          'skill': 'Figma',
          'demandLevel': 'Wysoki',
          'industry': 'Product Designer',
        },
        {
          'skill': 'Badania UX',
          'demandLevel': 'Średni',
          'industry': 'Product Designer',
        },
        {'skill': 'SQL', 'demandLevel': 'Wysoki', 'industry': 'Data Analyst'},
        {
          'skill': 'Power BI',
          'demandLevel': 'Średni',
          'industry': 'Data Analyst',
        },
      ],
      'marketTrends': [
        {
          'trendName': 'Wydłużone procesy rekrutacyjne',
          'description': 'Firmy dodają zadania domowe i więcej etapów rozmów.',
          'impact': 'Przygotuj się na 3–4 etapy i zadanie praktyczne.',
        },
        {
          'trendName': 'Portfolio ważniejsze niż CV',
          'description': 'W rolach produktowych decyduje pokazany proces.',
          'impact': 'Bez case studies trudno przejść pierwszy etap.',
        },
      ],
    },
  };

  static const _roadmap = {
    'id': 'r1',
    'title': 'Roadmapa: Data Analyst',
    'timeHorizonMonths': 9,
    'status': 'Active',
    'careerPathName': 'Data Analyst',
    'progress': 40.0,
    'generationStatus': 'Ready',
    'phases': [
      {
        'id': 'ph1',
        'title': 'Fundamenty analizy danych',
        'orderIndex': 0,
        'startMonth': 1,
        'endMonth': 3,
        'steps': [
          {
            'id': 's1',
            'title': 'SQL od podstaw do zapytań analitycznych',
            'subTitle': 'JOIN, agregacje, funkcje okna',
            'description': 'Przerób kurs i 50 zadań na danych sprzedażowych.',
            'topics': ['JOIN', 'GROUP BY', 'Funkcje okna'],
            'stepType': 'Required',
            'status': 'Completed',
            'orderIndex': 0,
          },
          {
            'id': 's2',
            'title': 'Statystyka dla analityka',
            'subTitle': 'Rozkłady i testy',
            'description': '',
            'topics': ['Średnia i mediana', 'Testy A/B'],
            'stepType': 'Required',
            'status': 'InProgress',
            'orderIndex': 1,
            'parentStepId': 's1',
          },
          {
            'id': 's2b',
            'title': 'Excel na poziomie zaawansowanym',
            'subTitle': 'Tabele przestawne',
            'description': '',
            'topics': [],
            'stepType': 'Optional',
            'status': 'NotStarted',
            'orderIndex': 2,
            'parentStepId': 's1',
          },
          {
            'id': 's2c',
            'title': 'Python i pandas',
            'subTitle': 'Czyszczenie i łączenie danych',
            'description': '',
            'topics': ['pandas', 'Jupyter'],
            'stepType': 'Required',
            'status': 'NotStarted',
            'orderIndex': 3,
            'parentStepId': 's2',
          },
        ],
      },
      {
        'id': 'ph2',
        'title': 'Narzędzia BI i portfolio',
        'orderIndex': 1,
        'startMonth': 4,
        'endMonth': 6,
        'steps': [
          {
            'id': 's3',
            'title': 'Zbuduj dashboard sprzedażowy',
            'subTitle': 'Power BI na publicznych danych',
            'description':
                'Wybierz zbiór danych, zbuduj model i opublikuj dashboard z 3 widokami.',
            'topics': ['Power BI', 'DAX', 'Modelowanie danych', 'Storytelling'],
            'stepType': 'Required',
            'status': 'NotStarted',
            'orderIndex': 0,
            'parentStepId': 's2c',
          },
          {
            'id': 's4',
            'title': 'Certyfikat PL-300',
            'subTitle': 'Microsoft Power BI Data Analyst',
            'description': '',
            'topics': [],
            'stepType': 'Optional',
            'status': 'NotStarted',
            'orderIndex': 1,
            'parentStepId': 's3',
          },
          {
            'id': 's4b',
            'title': 'Portfolio na GitHubie',
            'subTitle': '3 projekty z opisem wniosków',
            'description': '',
            'topics': ['README', 'Case study'],
            'stepType': 'Required',
            'status': 'NotStarted',
            'orderIndex': 2,
            'parentStepId': 's3',
          },
        ],
      },
      {
        'id': 'ph3',
        'title': 'Wejście na rynek',
        'orderIndex': 2,
        'startMonth': 7,
        'endMonth': 9,
        'steps': [
          {
            'id': 's5',
            'title': 'CV pod ATS i 20 aplikacji',
            'subTitle': 'Junior Data Analyst',
            'description': '',
            'topics': ['CV', 'LinkedIn'],
            'stepType': 'Required',
            'status': 'NotStarted',
            'orderIndex': 0,
          },
        ],
      },
    ],
  };

  static const _recommendation = {
    'recommendation': {
      'primaryPath': 'Product Designer',
      'justification':
          'Łączysz doświadczenie frontendowe z wyczuciem UX — to rzadkie połączenie, którego szukają zespoły produktowe.',
      'nextSteps': [
        'Zbuduj portfolio z 3 case studies',
        'Ukończ kurs badań z użytkownikami',
        'Weź udział w projekcie open source jako designer',
        'Aplikuj na stanowiska Junior Product Designer',
      ],
      'longTermGoal':
          'Senior Product Designer w firmie produktowej w ciągu 3 lat.',
    },
    'careerPaths': [
      {
        'id': 'p1',
        'careerName': 'Product Designer',
        'description':
            'Projektowanie doświadczeń użytkownika od badań po gotowy interfejs.',
        'probability': 78,
        'requiredSkills': ['Figma', 'Badania UX', 'Prototypowanie'],
        'recommendedCourses': [
          'Google UX Design',
          'Interaction Design Foundation',
        ],
        'marketAnalysis': [
          'Rosnący popyt w firmach SaaS',
          'Mediana 11 000 zł brutto',
        ],
        'swot': {
          'strengths': ['Znajomość frontendu'],
          'weaknesses': ['Mało projektów UX w portfolio'],
          'opportunities': ['Firmy szukają designerów, którzy kodują'],
          'threats': ['Duża konkurencja na poziomie junior'],
        },
      },
      {
        'id': 'p2',
        'careerName': 'Data Analyst',
        'description':
            'Analiza danych biznesowych i budowa raportów wspierających decyzje.',
        'probability': 64,
        'requiredSkills': ['SQL', 'Python', 'Power BI', 'Statystyka'],
        'recommendedCourses': ['Google Data Analytics', 'SQL dla analityków'],
        'marketAnalysis': [
          'Stabilny popyt w bankowości i e-commerce',
          'Widełki junior: 6–9 tys. zł brutto',
        ],
        'swot': {
          'strengths': ['Programowanie', 'Logiczne myślenie'],
          'weaknesses': ['Brak doświadczenia z BI'],
          'opportunities': ['Rosnąca rola danych w firmach', 'Praca zdalna'],
          'threats': ['Automatyzacja prostych raportów'],
        },
      },
    ],
  };

  Future<ApiResult<T>> _answer<T>(
    String path,
    T Function(Object? json)? decode,
  ) async {
    // Generation is slow on the real backend; keep it visible in the tour.
    final generating = path == '/api/Ai/recommendations';
    await Future<void>.delayed(Duration(milliseconds: generating ? 4000 : 250));
    final json = _responses[path];
    if (json == null && path.startsWith('/api/cvs/analysis/')) {
      return const Err(
        ApiError(
          type: ApiErrorType.notFound,
          message: 'Not found',
          statusCode: 404,
        ),
      );
    }
    return Ok(decode != null ? decode(json) : json as T);
  }

  @override
  Future<ApiResult<T>> get<T>(
    String path, {
    Map<String, Object?>? query,
    T Function(Object? json)? decode,
    Duration? receiveTimeout,
  }) => _answer(path, decode);

  @override
  Future<ApiResult<T>> post<T>(
    String path, {
    Object? body,
    T Function(Object? json)? decode,
    Duration? receiveTimeout,
  }) => _answer(path, decode);

  @override
  Future<ApiResult<T>> put<T>(
    String path, {
    Object? body,
    T Function(Object? json)? decode,
  }) => _answer(path, decode);

  @override
  Future<ApiResult<T>> delete<T>(
    String path, {
    T Function(Object? json)? decode,
  }) => _answer(path, decode);

  @override
  Future<ApiResult<T>> patch<T>(
    String path, {
    Object? body,
    T Function(Object? json)? decode,
  }) => _answer(path, decode);
}
