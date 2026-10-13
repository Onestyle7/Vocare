import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_error.dart';
import '../../../core/network/result.dart';
import '../../../core/providers.dart';
import '../../auth/application/session_controller.dart';
import '../../dashboard/data/dashboard_repository.dart';
import '../../market/data/market_repository.dart';
import 'assistant_models.dart';

/// `/api/Ai/*` + job matching. Error copy mirrors
/// `frontend/features/assistant/dal/services.ts`.
class AssistantRepository {
  const AssistantRepository(this._api);

  final ApiClient _api;

  /// `null` when nothing has been generated yet (404).
  Future<ApiResult<CareerRecommendation?>> lastRecommendation() async {
    final result = await _api.get<CareerRecommendation?>(
      '/api/Ai/last-recommendation',
      decode: (j) => CareerRecommendation.fromJson(j as Map),
    );
    return switch (result) {
      Err(:final error) when error.type == ApiErrorType.notFound => const Ok(
        null,
      ),
      Err(:final error) => Err(
        error.type == ApiErrorType.unauthorized
            ? error
            : error.withMessage(
                'Błąd podczas pobierania ostatniej rekomendacji',
              ),
      ),
      _ => result,
    };
  }

  /// Runs the AI career analysis (60 tokens, rate-limited to 5/min). It calls
  /// an LLM, so it is allowed to take minutes.
  Future<ApiResult<CareerRecommendation>> generate() async {
    final result = await _api.get<CareerRecommendation>(
      '/api/Ai/recommendations',
      receiveTimeout: const Duration(minutes: 3),
      decode: (j) => CareerRecommendation.fromJson(j as Map),
    );
    return switch (result) {
      Err(:final error) => Err(switch (error) {
        _ when error.code == 'INSUFFICIENT_TOKENS' => error.withMessage(
          'Brak tokenów lub subskrypcja nieaktywna.',
        ),
        _ when error.type == ApiErrorType.notFound => error.withMessage(
          'Uzupełnij profil przed wygenerowaniem rekomendacji',
        ),
        _
            when error.type == ApiErrorType.server ||
                error.type == ApiErrorType.timeout =>
          error.withMessage('Błąd usługi AI, spróbuj ponownie później.'),
        _
            when error.type == ApiErrorType.unauthorized ||
                error.type == ApiErrorType.tooManyRequests ||
                error.type == ApiErrorType.network =>
          error,
        _ => error.withMessage('Błąd podczas generowania rekomendacji'),
      }),
      _ => result,
    };
  }

  /// Offers matched to every path of the latest recommendation. 404 means
  /// there is no recommendation yet, which is not an error here.
  Future<ApiResult<List<CareerPathMatch>>> jobMatches() async {
    final result = await _api.get<List<CareerPathMatch>>(
      '/api/JobOffers/matching/my-recommendations/detailed',
      decode: (j) => (j as List? ?? const [])
          .whereType<Map>()
          .map(CareerPathMatch.fromJson)
          .toList(),
    );
    return switch (result) {
      Err(:final error) when error.type == ApiErrorType.notFound => const Ok(
        [],
      ),
      Err(:final error) => Err(
        error.withMessage('Błąd podczas pobierania ofert pracy'),
      ),
      _ => result,
    };
  }
}

final assistantRepositoryProvider = Provider<AssistantRepository>(
  (ref) => AssistantRepository(ref.watch(apiClientProvider)),
);

class AssistantData {
  const AssistantData({
    required this.recommendation,
    required this.matches,
    this.matchesError,
  });

  final CareerRecommendation? recommendation;
  final List<CareerPathMatch> matches;

  /// Offers are secondary: their failure is shown inline, not as a page error.
  final String? matchesError;

  /// Matched by name, like the web (`matchByName`).
  CareerPathMatch? matchFor(CareerPath path) {
    final key = path.name.trim().toLowerCase();
    for (final m in matches) {
      if (m.careerPathName.trim().toLowerCase() == key) return m;
    }
    return null;
  }

  CareerPath? pathById(String id) {
    for (final p in recommendation?.careerPaths ?? const <CareerPath>[]) {
      if (p.id == id) return p;
    }
    return null;
  }
}

final assistantProvider =
    AsyncNotifierProvider<AssistantController, AssistantData>(
      AssistantController.new,
    );

class AssistantController extends AsyncNotifier<AssistantData> {
  AssistantRepository get _repo => ref.read(assistantRepositoryProvider);

  @override
  Future<AssistantData> build() {
    ref.watch(sessionProvider.select((s) => s.userId));
    return _load();
  }

  Future<AssistantData> _load() async {
    final (recommendation, matches) = await (
      _repo.lastRecommendation(),
      _repo.jobMatches(),
    ).wait;
    if (recommendation case Err(:final error)) throw error;
    return AssistantData(
      recommendation: recommendation.valueOrNull,
      matches: matches.valueOrNull ?? const [],
      matchesError: matches.errorOrNull?.message,
    );
  }

  Future<void> refresh() async {
    state = await AsyncValue.guard(_load);
  }

  /// Generates a new recommendation. The backend saves the result before the
  /// final token settlement, so state is reloaded on failure as well.
  Future<ApiResult<void>> generate() async {
    final result = await _repo.generate();
    final reloaded = await AsyncValue.guard(_load);
    // Keep the previous data visible if reloading itself failed.
    if (reloaded.hasValue || !state.hasValue) state = reloaded;
    ref.invalidate(dashboardProvider);
    // The market analysis is tied to the latest recommendation.
    ref.invalidate(marketProvider);
    return result.map((_) {});
  }
}
