import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_error.dart';
import '../../../core/network/result.dart';
import '../../../core/providers.dart';
import '../../auth/application/session_controller.dart';
import '../../dashboard/data/dashboard_repository.dart';
import 'market_models.dart';

/// What the market tab can show.
sealed class MarketState {
  const MarketState();
}

/// No AI recommendation yet — the analysis is built on its career paths.
class MarketNeedsRecommendation extends MarketState {
  const MarketNeedsRecommendation();
}

class MarketReady extends MarketState {
  const MarketReady(this.analysis);

  /// Empty when the latest recommendation has no analysis yet.
  final MarketAnalysis analysis;
}

/// `/api/MarketAnalysis/*`; error copy mirrors
/// `frontend/features/market-analysis/dal/services.ts`.
class MarketRepository {
  const MarketRepository(this._api);

  final ApiClient _api;

  Future<ApiResult<MarketState>> latest() async {
    final result = await _api.get<MarketState>(
      '/api/MarketAnalysis/latest',
      decode: (j) => MarketReady(MarketAnalysis.fromResponse(j as Map)),
    );
    return switch (result) {
      Err(:final error) when error.type == ApiErrorType.notFound => const Ok(
        MarketNeedsRecommendation(),
      ),
      Err(:final error) => Err(_map(error)),
      _ => result,
    };
  }

  /// Runs the AI analysis (50 tokens). It calls an LLM, so it may take minutes.
  Future<ApiResult<MarketAnalysis>> generate() async {
    final result = await _api.get<MarketAnalysis>(
      '/api/MarketAnalysis',
      receiveTimeout: const Duration(minutes: 3),
      decode: (j) => MarketAnalysis.fromResponse(j as Map),
    );
    return switch (result) {
      Err(:final error) => Err(_map(error)),
      _ => result,
    };
  }

  static ApiError _map(ApiError error) {
    if (error.code == 'INSUFFICIENT_TOKENS') {
      return error.withMessage('Brak tokenów lub aktywnej subskrypcji.');
    }
    return switch (error.type) {
      ApiErrorType.notFound => error.withMessage(
        'Brak ścieżek kariery z asystenta AI. Wygeneruj rekomendacje w Doradcy kariery.',
      ),
      ApiErrorType.server || ApiErrorType.timeout => error.withMessage(
        'Usługa AI jest chwilowo niedostępna. Spróbuj ponownie później.',
      ),
      ApiErrorType.unauthorized ||
      ApiErrorType.network ||
      ApiErrorType.tooManyRequests => error,
      _ => error.withMessage('Błąd podczas pobierania analizy rynku.'),
    };
  }
}

final marketRepositoryProvider = Provider<MarketRepository>(
  (ref) => MarketRepository(ref.watch(apiClientProvider)),
);

final marketProvider = AsyncNotifierProvider<MarketController, MarketState>(
  MarketController.new,
);

class MarketController extends AsyncNotifier<MarketState> {
  MarketRepository get _repo => ref.read(marketRepositoryProvider);

  @override
  Future<MarketState> build() async {
    ref.watch(sessionProvider.select((s) => s.userId));
    return _load();
  }

  Future<MarketState> _load() async => switch (await _repo.latest()) {
    Ok(:final value) => value,
    Err(:final error) => throw error,
  };

  Future<void> refresh() async {
    state = await AsyncValue.guard(_load);
  }

  /// The analysis is saved before the final token settlement, so state is
  /// reloaded after failures too (same as the web command).
  Future<ApiResult<void>> generate() async {
    final result = await _repo.generate();
    switch (result) {
      case Ok(:final value):
        state = AsyncData(MarketReady(value));
      case Err():
        final reloaded = await AsyncValue.guard(_load);
        if (reloaded.hasValue || !state.hasValue) state = reloaded;
    }
    ref.invalidate(dashboardProvider);
    return result.map((_) {});
  }
}
