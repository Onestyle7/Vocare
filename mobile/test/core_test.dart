import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:vocare/core/network/api_error.dart';
import 'package:vocare/features/auth/presentation/validators.dart';
import 'package:vocare/features/dashboard/data/dashboard_repository.dart';
import 'package:vocare/features/profile/data/phone_number.dart';
import 'package:vocare/features/profile/data/profile_dates.dart';
import 'package:vocare/features/profile/data/user_profile.dart';

Response<dynamic> _response(int status, Object? data) => Response(
  requestOptions: RequestOptions(path: '/x'),
  statusCode: status,
  data: data,
);

void main() {
  group('AuthValidators', () {
    test('new password follows the web rules', () {
      expect(AuthValidators.newPassword('abc'), PasswordRule.length.error);
      expect(AuthValidators.newPassword('ABCDEF1!'), PasswordRule.lower.error);
      expect(AuthValidators.newPassword('abcdef1!'), PasswordRule.upper.error);
      expect(AuthValidators.newPassword('Abcdefg!'), PasswordRule.digit.error);
      expect(
        AuthValidators.newPassword('Abcdef12'),
        PasswordRule.special.error,
      );
      expect(AuthValidators.newPassword('Vocare1!'), isNull);
    });

    test('email', () {
      expect(AuthValidators.email(''), isNotNull);
      expect(AuthValidators.email('kacper@'), isNotNull);
      expect(AuthValidators.email('kacper@vocare.pl'), isNull);
    });
  });

  group('ApiError.fromResponse', () {
    test('recognises the legal hard wall', () {
      final error = ApiError.fromResponse(
        _response(403, {'status': 403, 'errorCode': 'CONSENTS_REQUIRED'}),
      );
      expect(error.type, ApiErrorType.consentsRequired);
      expect(error.code, 'CONSENTS_REQUIRED');
    });

    test('keeps validation errors per field', () {
      final error = ApiError.fromResponse(
        _response(400, {
          'title': 'One or more validation errors occurred.',
          'errors': {
            'FirstName': ['Imię jest wymagane.'],
          },
        }),
      );
      expect(error.type, ApiErrorType.badRequest);
      expect(error.fieldErrors['FirstName'], ['Imię jest wymagane.']);
    });

    test('plain 403 stays forbidden', () {
      expect(
        ApiError.fromResponse(_response(403, null)).type,
        ApiErrorType.forbidden,
      );
    });
  });

  group('DTO mapping', () {
    test('dashboard summary reads salaryProgressDto', () {
      final summary = DashboardSummary.fromJson({
        'recommendationsCount': 3,
        'profileCompletionPercentage': 78,
        'salaryProgressDto': {
          'currentSalary': 9000.0,
          'goalCompletionPercentage': 64,
        },
      });
      expect(summary.recommendations, 3);
      expect(summary.profileCompletion, 78);
      expect(summary.salary?.goalPercent, 64);
    });

    test('profile enums round-trip with backend names', () {
      final profile = UserProfile.fromJson({
        'firstName': 'Kacper',
        'personalityType': 'Architect',
        'financialSurvey': {'riskAppetite': 'Medium'},
      });
      expect(profile.personalityType, PersonalityType.architect);
      expect(profile.financialSurvey?.riskAppetite, RiskAppetite.medium);

      final json = profile.toJson();
      expect(json['personalityType'], 'Architect');
      expect((json['financialSurvey'] as Map)['riskAppetite'], 'Medium');
    });

    test('personality type also accepts numeric values', () {
      expect(PersonalityType.parse(17), PersonalityType.unknown);
      expect(PersonalityType.parse('1'), PersonalityType.mediator);
    });
  });

  group('PhoneNumber', () {
    test('accepts the web format plus a +48 / 0048 prefix', () {
      expect(PhoneNumber.normalize('600100200'), '600100200');
      expect(PhoneNumber.normalize('600 100 200'), '600100200');
      expect(PhoneNumber.normalize('600-100-200'), '600100200');
      expect(PhoneNumber.normalize('+48 600 100 200'), '600100200');
      expect(PhoneNumber.normalize('0048 600-100-200'), '600100200');
      expect(PhoneNumber.normalize('(+48) 600.100.200'), '600100200');
    });

    test('rejects anything that is not 9 digits', () {
      expect(PhoneNumber.normalize('60010020'), isNull);
      expect(PhoneNumber.normalize('6001002000'), isNull);
      expect(PhoneNumber.normalize('+49 600 100 200'), isNull);
      expect(PhoneNumber.normalize('600 100 2OO'), isNull);
      expect(PhoneNumber.validate(''), 'Numer telefonu jest wymagany');
      expect(PhoneNumber.validate('123'), isNotNull);
      expect(PhoneNumber.validate('+48 600 100 200'), isNull);
    });
  });

  test('required basics match the web profile schema', () {
    const complete = UserProfile(
      firstName: 'Anna',
      lastName: 'Nowak',
      country: 'Polska',
      personalityType: PersonalityType.unknown,
      phoneNumber: '600100200',
      address: 'Kraków',
    );
    expect(complete.hasRequiredFields, isTrue);
    expect(
      const UserProfile(
        firstName: 'Anna',
        lastName: 'Nowak',
        country: 'Polska',
        personalityType: PersonalityType.unknown,
        phoneNumber: '12',
      ).missingBasics,
      ['telefon', 'miasto / adres'],
    );
  });

  group('Profile dates sent to the API', () {
    test('ongoing entries are null and API strings are normalised', () {
      final json = const UserProfile(
        education: [
          EducationEntry(
            institution: 'WSEI',
            startDate: '10.01.2022 00:00:00',
            endDate: 'Present',
          ),
        ],
        workExperience: [
          WorkEntry(
            company: 'ACME',
            position: 'Dev',
            startDate: '2024-03-01',
            endDate: 'Present',
          ),
        ],
        certificates: [CertificateEntry(name: 'AWS', date: '2023')],
      ).toJson();
      final education = (json['education']! as List).single as Map;
      final work = (json['workExperience']! as List).single as Map;
      final certificate = (json['certificates']! as List).single as Map;
      expect(education['startDate'], '2022-01-10');
      // Non-nullable on the backend: null is a 400, an empty string is "ongoing".
      expect(education['endDate'], '');
      expect(work['endDate'], isNull);
      expect(certificate['date'], '2023-01-01');
    });
  });

  group('ProfileDates', () {
    setUpAll(() => initializeDateFormatting('pl'));

    test('reads web, CV-import and bare-year formats', () {
      expect(ProfileDates.parse('2024-03-12'), DateTime(2024, 3, 12));
      expect(ProfileDates.parse('2024-03'), DateTime(2024, 3));
      expect(ProfileDates.parse('12.03.2024'), DateTime(2024, 3, 12));
      expect(ProfileDates.parse('2020'), DateTime(2020));
      expect(ProfileDates.parse('Present'), isNull);
      // What the API returns: `DateTime.ToString()` in pl-PL / invariant.
      expect(ProfileDates.parse('10.01.2022 00:00:00'), DateTime(2022, 1, 10));
      expect(ProfileDates.parse('01/10/2022 00:00:00'), DateTime(2022, 1, 10));
      expect(
        ProfileDates.parse('1/10/2022 12:00:00 AM'),
        DateTime(2022, 1, 10),
      );
    });

    test('stores the web format and formats ranges in Polish', () {
      expect(ProfileDates.store(DateTime(2024, 3, 5)), '2024-03-05');
      expect(ProfileDates.range('2020', 'Present'), '2020 – obecnie');
      expect(ProfileDates.range('2024-03-12', ''), 'mar 2024 – obecnie');
    });
  });
}
