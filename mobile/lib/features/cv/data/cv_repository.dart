import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_error.dart';
import '../../../core/network/result.dart';
import '../../../core/providers.dart';
import '../../auth/application/session_controller.dart';
import '../../dashboard/data/dashboard_repository.dart';
import 'cv_models.dart';

/// `/api/cvs/*`; error copy mirrors `frontend/features/resume/dal/services.ts`.
class CvRepository {
  const CvRepository(this._api);

  final ApiClient _api;

  static const _aiTimeout = Duration(minutes: 3);

  Future<ApiResult<List<CvListItem>>> list() async => _mapped(
    await _api.get(
      '/api/cvs/my-cvs',
      decode: (j) => (j as List? ?? const [])
          .whereType<Map>()
          .map(CvListItem.fromJson)
          .toList(),
    ),
  );

  Future<ApiResult<CvLimits>> limits() async => _mapped(
    await _api.get(
      '/api/cvs/limits',
      decode: (j) => CvLimits.fromJson(j as Map),
    ),
  );

  Future<ApiResult<CvDetails>> details(String id) async => _mapped(
    await _api.get(
      '/api/cvs/details/$id',
      decode: (j) => CvDetails.fromJson(j as Map),
    ),
  );

  /// Free: `fromProfile` maps the profile into the CV without AI.
  Future<ApiResult<CvDetails>> create({
    required String name,
    String? targetPosition,
    bool fromProfile = false,
    CvData? initialData,
  }) async => _mapped(
    await _api.post(
      '/api/cvs/create',
      body: {
        'name': name,
        'targetPosition': ?_nullIfEmpty(targetPosition),
        'createFromProfile': fromProfile,
        'initialData': ?initialData?.toJson(),
      },
      decode: (j) => CvDetails.fromJson(j as Map),
    ),
  );

  Future<ApiResult<CvDetails>> update(CvDetails cv) async => _mapped(
    await _api.put(
      '/api/cvs/update/${cv.id}',
      body: cv.toUpdateJson(),
      decode: (j) => CvDetails.fromJson(j as Map),
    ),
  );

  Future<ApiResult<void>> delete(String id) async =>
      _mapped(await _api.delete<void>('/api/cvs/delete/$id', decode: (_) {}));

  Future<ApiResult<void>> setDefault(String id) async =>
      _mapped(await _api.put<void>('/api/cvs/set-default/$id', decode: (_) {}));

  /// AI CV written for a job offer (`GenerateCvFromProfile`, 20 tokens).
  Future<ApiResult<CvDetails>> generateForOffer({
    required String position,
    required String jobDescription,
  }) async => _mapped(
    await _api.post(
      '/api/cvs/generate-from-profile',
      body: {
        'name': position.trim(),
        'jobDescription': _offer(position, jobDescription),
      },
      receiveTimeout: _aiTimeout,
      decode: (j) => CvDetails.fromJson(j as Map),
    ),
  );

  /// Rewrites an existing CV for a job offer (`TailorCv`, 20 tokens).
  Future<ApiResult<CvDetails>> tailor({
    required String cvId,
    required String position,
    required String jobDescription,
  }) async => _mapped(
    await _api.post(
      '/api/cvs/tailor',
      body: {'cvId': cvId, 'jobDescription': _offer(position, jobDescription)},
      receiveTimeout: _aiTimeout,
      decode: (j) => CvDetails.fromJson(j as Map),
    ),
  );

  /// Latest stored audit; `null` (HTTP 404) means "never analysed" — free.
  Future<ApiResult<CvAnalysis?>> analysis(String cvId) async {
    final result = await _api.get<CvAnalysis?>(
      '/api/cvs/analysis/$cvId',
      decode: (j) => CvAnalysis.fromJson(j as Map),
    );
    return switch (result) {
      Err(:final error) when error.type == ApiErrorType.notFound => const Ok(
        null,
      ),
      Err(:final error) => Err(_map(error)),
      _ => result,
    };
  }

  /// Paid audit (`AnalyzeCv`); only ever called on an explicit tap.
  Future<ApiResult<CvAnalysis>> analyze(String cvId) async => _mapped(
    await _api.post(
      '/api/cvs/analyze/$cvId',
      receiveTimeout: _aiTimeout,
      decode: (j) => CvAnalysis.fromJson(j as Map),
    ),
  );

  /// The web prepends the position to the offer text the same way.
  static String _offer(String position, String description) =>
      ['Stanowisko ${position.trim()}', '', description.trim()].join('\n');

  static String? _nullIfEmpty(String? v) =>
      (v == null || v.trim().isEmpty) ? null : v.trim();

  static ApiResult<T> _mapped<T>(ApiResult<T> result) => switch (result) {
    Err(:final error) => Err(_map(error)),
    _ => result,
  };

  static ApiError _map(ApiError error) {
    switch (error.code) {
      case 'CV_LIMIT_REACHED':
        return error.withMessage('Osiągnięto limit CV dla Twojego planu');
      case 'INSUFFICIENT_TOKENS':
        return error.withMessage(
          'Masz za mało tokenów, aby wykonać tę operację',
        );
    }
    return switch (error.type) {
      ApiErrorType.notFound => error.withMessage('Nie znaleziono tego CV'),
      ApiErrorType.server => error.withMessage(
        'Usługa AI jest chwilowo niedostępna. Spróbuj ponownie później.',
      ),
      ApiErrorType.unauthorized ||
      ApiErrorType.network ||
      ApiErrorType.timeout ||
      ApiErrorType.tooManyRequests => error,
      _ => error.withMessage(
        'Coś poszło nie tak podczas przetwarzania Twojego żądania',
      ),
    };
  }
}

final cvRepositoryProvider = Provider<CvRepository>(
  (ref) => CvRepository(ref.watch(apiClientProvider)),
);

class CvListState {
  const CvListState({required this.items, required this.limits});

  final List<CvListItem> items;
  final CvLimits? limits;

  bool get canCreate => limits?.canCreateNew ?? true;
}

final cvListProvider = AsyncNotifierProvider<CvListController, CvListState>(
  CvListController.new,
);

class CvListController extends AsyncNotifier<CvListState> {
  CvRepository get _repo => ref.read(cvRepositoryProvider);

  @override
  Future<CvListState> build() {
    ref.watch(sessionProvider.select((s) => s.userId));
    return _load();
  }

  Future<CvListState> _load() async {
    final (items, limits) = await (_repo.list(), _repo.limits()).wait;
    final list = switch (items) {
      Ok(:final value) => value,
      Err(:final error) => throw error,
    };
    list.sort((a, b) {
      if (a.isDefault != b.isDefault) return a.isDefault ? -1 : 1;
      return (b.lastModifiedAt ?? DateTime(0)).compareTo(
        a.lastModifiedAt ?? DateTime(0),
      );
    });
    return CvListState(items: list, limits: limits.valueOrNull);
  }

  Future<void> refresh() async {
    final next = await AsyncValue.guard(_load);
    if (next.hasValue || !state.hasValue) state = next;
  }

  Future<void> _afterChange() async {
    await refresh();
    ref.invalidate(dashboardProvider);
  }

  Future<ApiResult<CvDetails>> create({
    required String name,
    String? targetPosition,
    bool fromProfile = false,
    CvData? initialData,
  }) async {
    final result = await _repo.create(
      name: name,
      targetPosition: targetPosition,
      fromProfile: fromProfile,
      initialData: initialData,
    );
    if (result.isOk) await _afterChange();
    return result;
  }

  /// Generation saves the CV before the token settlement, so the list is
  /// refreshed after failures too (same as the web command).
  Future<ApiResult<CvDetails>> generateForOffer({
    required String position,
    required String jobDescription,
  }) async {
    final result = await _repo.generateForOffer(
      position: position,
      jobDescription: jobDescription,
    );
    await _afterChange();
    return result;
  }

  Future<ApiResult<void>> delete(String id) async {
    final result = await _repo.delete(id);
    if (result.isOk) await _afterChange();
    return result;
  }

  /// "Zapisz jako nowe CV": copy [source], tailor the copy and keep the
  /// original untouched. A failed tailoring removes the copy again (web
  /// `handleCreateTailoredCopy`).
  Future<ApiResult<CvDetails>> tailorAsCopy({
    required CvDetails source,
    required String position,
    required String jobDescription,
  }) async {
    final created = await _repo.create(
      name: position,
      targetPosition: position,
      initialData: source.data,
    );
    final ApiResult<CvDetails> result;
    switch (created) {
      case Err(:final error):
        result = Err(error);
      case Ok(value: final copy):
        final tailored = await _repo.tailor(
          cvId: copy.id,
          position: position,
          jobDescription: jobDescription,
        );
        if (tailored.isOk) {
          result = tailored.map((cv) => cv.copyWith(targetPosition: position));
        } else {
          await _repo.delete(copy.id);
          result = tailored;
        }
    }
    await _afterChange();
    return result;
  }

  Future<ApiResult<void>> setDefault(String id) async {
    final result = await _repo.setDefault(id);
    if (result.isOk) await refresh();
    return result;
  }

  /// Keeps the list in sync with the editor without refetching on every save.
  void applyLocal(CvDetails cv) {
    final current = state.value;
    if (current == null) return;
    state = AsyncData(
      CvListState(
        items: [
          for (final item in current.items)
            item.id == cv.id
                ? CvListItem(
                    id: cv.id,
                    name: cv.name,
                    targetPosition: cv.targetPosition,
                    isDefault: cv.isDefault,
                    lastModifiedAt: DateTime.now(),
                  )
                : item,
        ],
        limits: current.limits,
      ),
    );
  }
}

enum SaveStatus { saved, pending, saving, failed }

class CvEditorState {
  const CvEditorState({required this.cv, this.status = SaveStatus.saved});

  final CvDetails cv;
  final SaveStatus status;

  CvEditorState copyWith({CvDetails? cv, SaveStatus? status}) =>
      CvEditorState(cv: cv ?? this.cv, status: status ?? this.status);
}

final cvEditorProvider = AsyncNotifierProvider.autoDispose
    .family<CvEditorController, CvEditorState, String>(CvEditorController.new);

/// Holds the CV being edited and autosaves it (debounced), like the web editor.
class CvEditorController extends AsyncNotifier<CvEditorState> {
  CvEditorController(this.cvId);

  final String cvId;

  static const _debounce = Duration(milliseconds: 1200);

  late CvRepository _repo;
  Timer? _timer;
  bool _saving = false;
  bool _dirty = false;

  /// Mirror of the edited CV — `state` cannot be read inside `onDispose`.
  CvDetails? _latest;

  @override
  set state(AsyncValue<CvEditorState> value) {
    _latest = value.value?.cv ?? _latest;
    super.state = value;
  }

  @override
  Future<CvEditorState> build() async {
    _repo = ref.read(cvRepositoryProvider);
    final list = ref.read(cvListProvider.notifier);
    ref.onDispose(() {
      _timer?.cancel();
      // Leaving the editor must not lose the last few keystrokes.
      final latest = _latest;
      if (_dirty && latest != null) {
        unawaited(
          _repo.update(latest).then((r) {
            if (r.isOk) list.applyLocal(latest);
          }),
        );
      }
    });
    return switch (await _repo.details(cvId)) {
      Ok(:final value) => CvEditorState(cv: _latest = value),
      Err(:final error) => throw error,
    };
  }

  CvDetails? get current => state.value?.cv;

  void edit(CvDetails Function(CvDetails cv) change) {
    final value = state.value;
    if (value == null) return;
    _dirty = true;
    state = AsyncData(
      value.copyWith(cv: change(value.cv), status: SaveStatus.pending),
    );
    _timer?.cancel();
    _timer = Timer(_debounce, save);
  }

  void editData(CvData Function(CvData data) change) =>
      edit((cv) => cv.copyWith(data: change(cv.data)));

  Future<void> save() async {
    _timer?.cancel();
    final value = state.value;
    if (value == null || !_dirty) return;
    if (_saving) {
      // A save is in flight; the newer state goes out right after it.
      _timer = Timer(_debounce, save);
      return;
    }
    _saving = true;
    _dirty = false;
    final snapshot = value.cv;
    state = AsyncData(value.copyWith(status: SaveStatus.saving));

    final result = await _repo.update(snapshot);
    _saving = false;
    if (!ref.mounted) return;
    final latest = state.value!;
    switch (result) {
      case Ok():
        ref.read(cvListProvider.notifier).applyLocal(snapshot);
        state = AsyncData(
          latest.copyWith(
            status: _dirty ? SaveStatus.pending : SaveStatus.saved,
          ),
        );
      case Err():
        _dirty = true;
        state = AsyncData(latest.copyWith(status: SaveStatus.failed));
    }
  }

  /// Waits for an in-flight save and pushes pending edits — call before
  /// anything that reads the CV on the server (AI tailoring, analysis).
  Future<void> flush() async {
    while (_saving) {
      await Future<void>.delayed(const Duration(milliseconds: 100));
      if (!ref.mounted) return;
    }
    if (_dirty) await save();
  }

  /// Replaces the whole CV with fresh server data (after tailoring).
  void replace(CvDetails cv) {
    _timer?.cancel();
    _dirty = false;
    state = AsyncData(CvEditorState(cv: cv));
    ref.read(cvListProvider.notifier).applyLocal(cv);
  }

  /// Local-only change that the server already knows about (e.g. the
  /// default flag); does not schedule a save.
  void patch(CvDetails Function(CvDetails cv) change) {
    final value = state.value;
    if (value == null) return;
    state = AsyncData(value.copyWith(cv: change(value.cv)));
  }

  /// Drops pending edits — the CV is about to be deleted.
  void discard() {
    _timer?.cancel();
    _dirty = false;
  }

  /// "Zastąp to CV": the content is overwritten only once the AI result is
  /// in. On failure the latest server copy is reloaded, because the backend
  /// may have saved the result before settling the tokens (web
  /// `handleReplaceWithTailoredCv`).
  Future<ApiResult<CvDetails>> tailorInPlace({
    required String position,
    required String jobDescription,
  }) async {
    final before = current;
    if (before == null) {
      return const Err(
        ApiError(
          type: ApiErrorType.notFound,
          message: 'Nie znaleziono tego CV',
        ),
      );
    }
    final result = await _repo.tailor(
      cvId: cvId,
      position: position,
      jobDescription: jobDescription,
    );
    if (!ref.mounted) return result;
    switch (result) {
      case Ok(:final value):
        final tailored = value.copyWith(
          name: before.name,
          targetPosition: position,
          isDefault: before.isDefault,
        );
        final saved = await _repo.update(tailored);
        if (!ref.mounted) return result;
        replace(
          saved.valueOrNull?.copyWith(isDefault: before.isDefault) ?? tailored,
        );
        return Ok(current!);
      case Err():
        if (await _repo.details(cvId) case Ok(:final value)) {
          if (ref.mounted) replace(value);
        }
        return result;
    }
  }
}

final cvAnalysisProvider = AsyncNotifierProvider.autoDispose
    .family<CvAnalysisController, CvAnalysis?, String>(
      CvAnalysisController.new,
    );

/// Opening the panel only reads the stored result (free). A paid analysis
/// runs exclusively from [analyze], i.e. an explicit tap.
class CvAnalysisController extends AsyncNotifier<CvAnalysis?> {
  CvAnalysisController(this.cvId);

  final String cvId;

  @override
  Future<CvAnalysis?> build() async =>
      switch (await ref.read(cvRepositoryProvider).analysis(cvId)) {
        Ok(:final value) => value,
        Err(:final error) => throw error,
      };

  /// A failed re-run keeps the previous valid scores (spec, "Error" state).
  Future<ApiResult<CvAnalysis>> analyze() async {
    final result = await ref.read(cvRepositoryProvider).analyze(cvId);
    if (result case Ok(:final value)) state = AsyncData(value);
    ref.invalidate(dashboardProvider);
    return result;
  }
}
