import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_error.dart';
import '../../../core/network/result.dart';
import '../../../core/providers.dart';
import '../../auth/application/session_controller.dart';
import '../../billing/data/billing_repository.dart';
import '../../dashboard/data/dashboard_repository.dart';
import 'roadmap_models.dart';

/// Horizons offered on the web (`timeHorizonOptions`); the backend accepts 3–24.
const roadmapHorizons = [3, 6, 9, 12, 18, 24];

/// Plan limits enforced by `CareerRoadmapService` (and shown on the web).
int roadmapLimitFor(AccessStatus? access) =>
    access?.hasActiveSubscription == true ? 10 : 1;

/// `/api/Roadmap*`; error copy mirrors `frontend/features/roadmap/dal/services.ts`.
class RoadmapRepository {
  const RoadmapRepository(this._api);

  final ApiClient _api;

  Future<ApiResult<List<RoadmapSummary>>> list() async => _mapped(
    await _api.get(
      '/api/Roadmap/user-roadmaps',
      decode: (j) => (j as List? ?? const [])
          .whereType<Map>()
          .map(RoadmapSummary.fromJson)
          .toList(),
    ),
  );

  Future<ApiResult<RoadmapDetails>> details(String id) async => _mapped(
    await _api.get(
      '/api/Roadmap/$id',
      decode: (j) => RoadmapDetails.fromJson(j as Map),
    ),
  );

  Future<ApiResult<double>> progress(String id) async => _mapped(
    await _api.get(
      '/api/Roadmap/$id/progress',
      decode: (j) => ((j as Map)['progress'] as num?)?.toDouble() ?? 0,
    ),
  );

  /// Starts background generation (Hangfire); returns the new roadmap id.
  Future<ApiResult<String>> generate({
    required String careerPathId,
    required int timeHorizonMonths,
  }) async => _mapped(
    await _api.post(
      '/api/Roadmap/generate',
      body: {
        'careerPathId': careerPathId,
        'timeHorizonMonths': timeHorizonMonths,
      },
      decode: (j) => '${(j as Map)['roadmapId']}',
    ),
  );

  Future<ApiResult<void>> retry(String id) async =>
      _mapped(await _api.post<void>('/api/Roadmap/$id/retry', decode: (_) {}));

  Future<ApiResult<void>> archive(String id) async =>
      _mapped(await _api.delete<void>('/api/Roadmap/$id', decode: (_) {}));

  /// The endpoint binds a bare enum, so the body is a JSON string.
  Future<ApiResult<void>> setStepStatus(
    String stepId,
    StepStatus status,
  ) async => _mapped(
    await _api.patch<void>(
      '/api/RoadmapSteps/$stepId/status',
      body: jsonEncode(status.apiName),
      decode: (_) {},
    ),
  );

  Future<ApiResult<void>> deleteStep(String stepId) async => _mapped(
    await _api.delete<void>('/api/RoadmapSteps/$stepId', decode: (_) {}),
  );

  Future<ApiResult<void>> renamePhase(String phaseId, String name) async =>
      _mapped(
        await _api.patch<void>(
          '/api/RoadmapPhases/$phaseId/name',
          body: jsonEncode(name),
          decode: (_) {},
        ),
      );

  Future<ApiResult<void>> deletePhase(String phaseId) async => _mapped(
    await _api.delete<void>('/api/RoadmapPhases/$phaseId', decode: (_) {}),
  );

  static ApiResult<T> _mapped<T>(ApiResult<T> result) => switch (result) {
    Err(:final error) => Err(_map(error)),
    _ => result,
  };

  static ApiError _map(ApiError error) {
    switch (error.code) {
      case 'INSUFFICIENT_TOKENS':
        return error.withMessage(
          'Masz za mało tokenów, aby wygenerować roadmapę.',
        );
      case 'ROADMAP_LIMIT_REACHED':
        return error.withMessage('Osiągnięto limit roadmap dla Twojego planu.');
      case 'DUPLICATE_ROADMAP':
        return error.withMessage(
          'Posiadasz już roadmapę dla tej ścieżki zawodowej.',
        );
      case 'PHASE_STEP_LIMIT_REACHED':
        return error.withMessage('Osiągnięto limit kroków w tej fazie.');
    }
    return switch (error.type) {
      ApiErrorType.conflict => error.withMessage(
        'Stan roadmapy nie pozwala wykonać tej operacji.',
      ),
      ApiErrorType.notFound => error.withMessage('Nie znaleziono roadmapy.'),
      ApiErrorType.badRequest || ApiErrorType.unprocessable =>
        error.withMessage('Nieprawidłowa operacja na roadmapie.'),
      ApiErrorType.unauthorized ||
      ApiErrorType.network ||
      ApiErrorType.timeout => error,
      _ => error.withMessage('Wystąpił nieoczekiwany błąd serwera.'),
    };
  }
}

final roadmapRepositoryProvider = Provider<RoadmapRepository>(
  (ref) => RoadmapRepository(ref.watch(apiClientProvider)),
);

class RoadmapListEntry {
  const RoadmapListEntry(this.roadmap, this.progress);

  final RoadmapSummary roadmap;

  /// Only known for ready roadmaps (the list endpoint does not compute it).
  final double? progress;
}

class RoadmapListState {
  const RoadmapListState({required this.entries, required this.limit});

  /// Non-archived roadmaps, newest first.
  final List<RoadmapListEntry> entries;
  final int limit;

  /// Counted like the web: failed generations do not take a slot.
  int get usedSlots => entries
      .where((e) => e.roadmap.generationStatus != GenerationStatus.failed)
      .length;

  bool get limitReached => usedSlots >= limit;

  bool get anyGenerating =>
      entries.any((e) => e.roadmap.generationStatus.inProgress);

  RoadmapSummary? existingFor(String careerPathName) {
    final key = careerPathName.trim().toLowerCase();
    for (final e in entries) {
      if (e.roadmap.generationStatus != GenerationStatus.failed &&
          e.roadmap.careerPathName.trim().toLowerCase() == key) {
        return e.roadmap;
      }
    }
    return null;
  }
}

final roadmapListProvider =
    AsyncNotifierProvider<RoadmapListController, RoadmapListState>(
      RoadmapListController.new,
    );

/// User roadmaps; polls every 3 s while any of them is being generated
/// (same cadence as the web dashboard).
class RoadmapListController extends AsyncNotifier<RoadmapListState> {
  Timer? _poll;

  RoadmapRepository get _repo => ref.read(roadmapRepositoryProvider);

  @override
  Future<RoadmapListState> build() async {
    ref.watch(sessionProvider.select((s) => s.userId));
    ref.onDispose(() => _poll?.cancel());
    final state = await _load();
    _schedulePolling(state);
    return state;
  }

  Future<RoadmapListState> _load() async {
    final (list, access) = await (
      _repo.list(),
      ref.read(billingRepositoryProvider).accessStatus(),
    ).wait;
    final roadmaps = switch (list) {
      Ok(:final value) => value,
      Err(:final error) => throw error,
    };
    final visible = roadmaps.where((r) => !r.isArchived).toList()
      ..sort(
        (a, b) =>
            (b.createdAt ?? DateTime(0)).compareTo(a.createdAt ?? DateTime(0)),
      );

    final progress = await Future.wait([
      for (final r in visible)
        r.generationStatus == GenerationStatus.ready
            ? _repo.progress(r.id).then((p) => p.valueOrNull)
            : Future.value(null),
    ]);
    return RoadmapListState(
      entries: [
        for (var i = 0; i < visible.length; i++)
          RoadmapListEntry(visible[i], progress[i]),
      ],
      limit: roadmapLimitFor(access.valueOrNull),
    );
  }

  void _schedulePolling(RoadmapListState current) {
    _poll?.cancel();
    if (!current.anyGenerating) return;
    _poll = Timer(const Duration(seconds: 3), () async {
      final next = await AsyncValue.guard(_load);
      // Keep showing the last good list if a poll fails.
      if (next.hasValue) {
        final wasGenerating = state.value?.anyGenerating ?? false;
        state = next;
        if (wasGenerating && !next.requireValue.anyGenerating) {
          ref.invalidate(dashboardProvider);
        }
      }
      _schedulePolling(state.value ?? current);
    });
  }

  Future<void> refresh() async {
    final next = await AsyncValue.guard(_load);
    state = next;
    if (next.hasValue) _schedulePolling(next.requireValue);
  }

  Future<ApiResult<String>> generate({
    required String careerPathId,
    required int months,
  }) async {
    final result = await _repo.generate(
      careerPathId: careerPathId,
      timeHorizonMonths: months,
    );
    await refresh();
    return result;
  }

  Future<ApiResult<void>> retry(String id) async {
    final result = await _repo.retry(id);
    await refresh();
    return result;
  }

  Future<ApiResult<void>> archive(String id) async {
    final result = await _repo.archive(id);
    if (result.isOk) {
      await refresh();
      ref.invalidate(dashboardProvider);
    }
    return result;
  }
}

final roadmapDetailsProvider = AsyncNotifierProvider.autoDispose
    .family<RoadmapDetailsController, RoadmapDetails, String>(
      RoadmapDetailsController.new,
    );

/// One roadmap with optimistic step / phase edits.
class RoadmapDetailsController extends AsyncNotifier<RoadmapDetails> {
  RoadmapDetailsController(this.roadmapId);

  final String roadmapId;
  Timer? _poll;

  RoadmapRepository get _repo => ref.read(roadmapRepositoryProvider);

  @override
  Future<RoadmapDetails> build() async {
    ref.onDispose(() => _poll?.cancel());
    final details = await _load();
    _schedulePolling(details);
    return details;
  }

  Future<RoadmapDetails> _load() async =>
      switch (await _repo.details(roadmapId)) {
        Ok(:final value) => value,
        Err(:final error) => throw error,
      };

  void _schedulePolling(RoadmapDetails details) {
    _poll?.cancel();
    if (!details.generationStatus.inProgress) return;
    _poll = Timer(const Duration(seconds: 3), () async {
      final next = await AsyncValue.guard(_load);
      if (next.hasValue) {
        state = next;
        _schedulePolling(next.requireValue);
        if (!next.requireValue.generationStatus.inProgress) {
          ref.invalidate(roadmapListProvider);
        }
      } else {
        _schedulePolling(details);
      }
    });
  }

  Future<void> refresh() async {
    final next = await AsyncValue.guard(_load);
    if (next.hasValue || !state.hasValue) state = next;
    if (next.hasValue) _schedulePolling(next.requireValue);
  }

  Future<ApiResult<void>> setStepStatus(
    String stepId,
    StepStatus status,
  ) async {
    final previous = state.value;
    if (previous != null) {
      state = AsyncData(
        _mapSteps(previous, stepId, (s) => s.withStatus(status)),
      );
    }
    final result = await _repo.setStepStatus(stepId, status);
    switch (result) {
      case Ok():
        // Progress is computed server-side from required steps.
        final progress = await _repo.progress(roadmapId);
        if (progress case Ok(:final value)) {
          final current = state.value;
          if (current != null) {
            state = AsyncData(current.copyWith(progress: value));
          }
        }
        ref.invalidate(roadmapListProvider);
        ref.invalidate(dashboardProvider);
      case Err():
        if (previous != null) state = AsyncData(previous);
    }
    return result;
  }

  Future<ApiResult<void>> deleteStep(String stepId) async {
    final result = await _repo.deleteStep(stepId);
    if (result.isOk) await refresh();
    return result;
  }

  Future<ApiResult<void>> renamePhase(String phaseId, String name) async {
    final previous = state.value;
    if (previous != null) {
      state = AsyncData(
        previous.copyWith(
          phases: [
            for (final p in previous.phases)
              p.id == phaseId ? p.copyWith(title: name) : p,
          ],
        ),
      );
    }
    final result = await _repo.renamePhase(phaseId, name);
    if (!result.isOk && previous != null) state = AsyncData(previous);
    return result;
  }

  Future<ApiResult<void>> deletePhase(String phaseId) async {
    final result = await _repo.deletePhase(phaseId);
    if (result.isOk) await refresh();
    return result;
  }

  Future<ApiResult<void>> retry() async {
    final result = await _repo.retry(roadmapId);
    if (result.isOk) {
      await refresh();
      ref.invalidate(roadmapListProvider);
    }
    return result;
  }

  static RoadmapDetails _mapSteps(
    RoadmapDetails details,
    String stepId,
    RoadmapStep Function(RoadmapStep) update,
  ) => details.copyWith(
    phases: [
      for (final phase in details.phases)
        phase.copyWith(
          steps: [for (final s in phase.steps) s.id == stepId ? update(s) : s],
        ),
    ],
  );
}

/// Set by other screens (assistant path, notification) to open the create
/// sheet with a career path preselected when the Roadmap tab shows up.
final roadmapCreateIntentProvider =
    NotifierProvider<RoadmapCreateIntent, String?>(RoadmapCreateIntent.new);

class RoadmapCreateIntent extends Notifier<String?> {
  @override
  String? build() => null;

  void request(String careerPathId) => state = careerPathId;

  String? take() {
    final value = state;
    state = null;
    return value;
  }
}
