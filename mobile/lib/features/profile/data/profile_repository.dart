import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_error.dart';
import '../../../core/network/result.dart';
import '../../../core/providers.dart';
import '../../auth/application/session_controller.dart';
import '../../dashboard/data/dashboard_repository.dart';
import 'user_profile.dart';

/// `/api/UserProfile/*`; error copy follows `frontend/features/profile/dal/services.ts`.
class ProfileRepository {
  const ProfileRepository(this._api);

  final ApiClient _api;

  /// `null` when the profile has not been created yet.
  Future<ApiResult<UserProfile?>> fetch() async {
    final result = await _api.get<UserProfile?>(
      '/api/UserProfile/GetCurrentUserProfile',
      decode: (j) => UserProfile.fromJson(j as Map),
    );
    return switch (result) {
      Err(:final error) when error.type == ApiErrorType.notFound => const Ok(
        null,
      ),
      _ => result,
    };
  }

  Future<ApiResult<void>> save(
    UserProfile profile, {
    required bool exists,
  }) async {
    final body = profile.toJson();
    final result = exists
        ? await _api.put<void>(
            '/api/UserProfile/UpdateCurrentUserProfile',
            body: body,
            decode: (_) {},
          )
        : await _api.post<void>(
            '/api/UserProfile/CreateCurrentUserProfile',
            body: body,
            decode: (_) {},
          );
    return switch (result) {
      Err(:final error) when error.type == ApiErrorType.badRequest => Err(
        error.withMessage(
          _firstFieldError(error) ?? 'Sprawdź poprawność danych profilu.',
        ),
      ),
      _ => result,
    };
  }

  /// Parses the CV on the server and saves it as the profile.
  Future<ApiResult<UserProfile>> importCv({
    required String path,
    required String fileName,
  }) async {
    final form = FormData.fromMap({
      'file': await MultipartFile.fromFile(path, filename: fileName),
    });
    final result = await _api.post<UserProfile>(
      '/api/UserProfile/import-cv',
      body: form,
      receiveTimeout: const Duration(minutes: 2),
      decode: (j) => UserProfile.fromJson(j as Map),
    );
    return switch (result) {
      Err(:final error) when error.code == 'CV_IMPORT_LIMIT_REACHED' => Err(
        error.withMessage('Osiągnięto limit importów CV dla Twojego planu'),
      ),
      Err(:final error) when error.type == ApiErrorType.badRequest => Err(
        error.withMessage('Wystąpił błąd parsowania pliku CV'),
      ),
      _ => result,
    };
  }

  static String? _firstFieldError(ApiError error) {
    for (final messages in error.fieldErrors.values) {
      if (messages.isNotEmpty) return messages.first;
    }
    return null;
  }
}

final profileRepositoryProvider = Provider<ProfileRepository>(
  (ref) => ProfileRepository(ref.watch(apiClientProvider)),
);

final profileProvider = AsyncNotifierProvider<ProfileController, UserProfile?>(
  ProfileController.new,
);

/// The signed-in user's profile; `null` until it is created.
class ProfileController extends AsyncNotifier<UserProfile?> {
  ProfileRepository get _repo => ref.read(profileRepositoryProvider);

  @override
  Future<UserProfile?> build() async {
    ref.watch(sessionProvider.select((s) => s.userId));
    return switch (await _repo.fetch()) {
      Ok(:final value) => value,
      Err(:final error) => throw error,
    };
  }

  /// Saves and, on success, updates local state optimistically-confirmed.
  Future<ApiResult<void>> save(UserProfile profile) async {
    final exists = state.value != null;
    final result = await _repo.save(profile, exists: exists);
    if (result.isOk) {
      state = AsyncData(profile);
      // Completion % and attributes are derived server-side.
      ref.invalidate(dashboardProvider);
    }
    return result;
  }

  Future<ApiResult<UserProfile>> importCv({
    required String path,
    required String fileName,
  }) async {
    final result = await _repo.importCv(path: path, fileName: fileName);
    if (result case Ok(:final value)) {
      state = AsyncData(value);
      ref.invalidate(dashboardProvider);
    }
    return result;
  }
}
