import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_error.dart';
import '../../../core/network/result.dart';
import '../../../core/providers.dart';
import '../../auth/application/session_controller.dart';
import '../../billing/data/billing_repository.dart';

class SalaryProgress {
  const SalaryProgress({
    required this.current,
    required this.expected,
    required this.goalPercent,
  });

  final double current;
  final double expected;
  final int goalPercent;

  factory SalaryProgress.fromJson(Map json) => SalaryProgress(
    current: (json['currentSalary'] as num?)?.toDouble() ?? 0,
    expected: (json['expectedSalary'] as num?)?.toDouble() ?? 0,
    goalPercent: (json['goalCompletionPercentage'] as num?)?.toInt() ?? 0,
  );
}

class DashboardSummary {
  const DashboardSummary({
    required this.recommendations,
    required this.analyses,
    required this.roadmaps,
    required this.cvs,
    required this.profileCompletion,
    this.salary,
  });

  final int recommendations;
  final int analyses;
  final int roadmaps;
  final int cvs;
  final int profileCompletion;
  final SalaryProgress? salary;

  factory DashboardSummary.fromJson(Map json) {
    final salary = json['salaryProgressDto'] ?? json['salaryProgress'];
    return DashboardSummary(
      recommendations: (json['recommendationsCount'] as num?)?.toInt() ?? 0,
      analyses: (json['analysisCount'] as num?)?.toInt() ?? 0,
      roadmaps: (json['roadmapsCount'] as num?)?.toInt() ?? 0,
      cvs: (json['cvsCount'] as num?)?.toInt() ?? 0,
      profileCompletion:
          (json['profileCompletionPercentage'] as num?)?.toInt() ?? 0,
      salary: salary is Map ? SalaryProgress.fromJson(salary) : null,
    );
  }
}

/// Labels and order match `parseProfileAttributesForChart` on the web.
class ProfileAttribute {
  const ProfileAttribute(this.label, this.score);
  final String label;
  final int score;

  static List<ProfileAttribute> listFromJson(Map json) {
    int v(String key) => (json[key] as num?)?.toInt() ?? 0;
    return [
      ProfileAttribute('Doświadczenie praktyczne', v('practicalExperience')),
      ProfileAttribute('Kompetencje twarde', v('hardCompetencies')),
      ProfileAttribute('Kreatywność', v('creativity')),
      ProfileAttribute('Zespół', v('teamwork')),
      ProfileAttribute('Samodzielność', v('independence')),
      ProfileAttribute('Kompetencje miękkie', v('softCompetencies')),
      ProfileAttribute('Certyfikacja', v('certification')),
      ProfileAttribute('Umiejętności techniczne', v('technicalSkills')),
    ];
  }
}

/// Everything the home tab shows. `summary == null` means the profile has not
/// been filled in yet (the backend answers 404), which is an onboarding state,
/// not an error.
class DashboardData {
  const DashboardData({this.summary, this.attributes, this.access});

  final DashboardSummary? summary;
  final List<ProfileAttribute>? attributes;
  final AccessStatus? access;

  bool get hasProfile => summary != null;
}

class DashboardRepository {
  const DashboardRepository(this._api);

  final ApiClient _api;

  Future<ApiResult<DashboardSummary?>> summary() => _optional(
    _api.get(
      '/api/Dashboard/summary',
      decode: (j) => DashboardSummary.fromJson(j as Map),
    ),
  );

  Future<ApiResult<List<ProfileAttribute>?>> attributes() => _optional(
    _api.get(
      '/api/Dashboard/profile-attributes',
      decode: (j) => ProfileAttribute.listFromJson(j as Map),
    ),
  );

  /// Maps 404 (no profile yet) to `null`.
  static Future<ApiResult<T?>> _optional<T>(
    Future<ApiResult<T>> request,
  ) async {
    final result = await request;
    return switch (result) {
      Ok(:final value) => Ok(value),
      Err(:final error) when error.type == ApiErrorType.notFound => const Ok(
        null,
      ),
      Err(:final error) => Err(error),
    };
  }
}

final dashboardRepositoryProvider = Provider<DashboardRepository>(
  (ref) => DashboardRepository(ref.watch(apiClientProvider)),
);

/// Re-fetched on account switch because it watches the signed-in user.
final dashboardProvider = FutureProvider<DashboardData>((ref) async {
  ref.watch(sessionProvider.select((s) => s.userId));
  final repo = ref.watch(dashboardRepositoryProvider);
  final billing = ref.watch(billingRepositoryProvider);

  final (summary, attributes, access) = await (
    repo.summary(),
    repo.attributes(),
    billing.accessStatus(),
  ).wait;

  if (summary case Err(:final error)) throw error;
  return DashboardData(
    summary: summary.valueOrNull,
    // Attributes and balance are secondary: a failure hides their card only.
    attributes: attributes.valueOrNull,
    access: access.valueOrNull,
  );
});
