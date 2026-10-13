import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../config/env.dart';
import '../storage/token_store.dart';
import 'api_error.dart';
import 'result.dart';

typedef ApiResult<T> = Result<T, ApiError>;

/// Thin wrapper over Dio that returns [Result] instead of throwing — the same
/// contract as `ApiClient` in the web app.
class ApiClient {
  ApiClient({
    required TokenStore tokenStore,
    required VoidCallback onSessionExpired,
    required VoidCallback onConsentsRequired,
  }) : _tokenStore = tokenStore {
    _dio = Dio(
      BaseOptions(
        baseUrl: Env.apiBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 60),
        headers: {'Accept': 'application/json'},
      ),
    );
    _dio.interceptors.add(
      _AuthInterceptor(
        dio: _dio,
        tokenStore: tokenStore,
        onSessionExpired: onSessionExpired,
        onConsentsRequired: onConsentsRequired,
      ),
    );
    if (kDebugMode) {
      _dio.interceptors.add(
        LogInterceptor(
          requestBody: false,
          responseBody: false,
          logPrint: (line) => debugPrint('$line'),
        ),
      );
    }
  }

  final TokenStore _tokenStore;
  late final Dio _dio;

  bool get hasSession => _tokenStore.current != null;

  Future<ApiResult<T>> get<T>(
    String path, {
    Map<String, Object?>? query,
    T Function(Object? json)? decode,
    Duration? receiveTimeout,
  }) => _send(
    () => _dio.get<Object?>(
      path,
      queryParameters: query,
      options: receiveTimeout == null
          ? null
          : Options(receiveTimeout: receiveTimeout),
    ),
    decode,
  );

  Future<ApiResult<T>> post<T>(
    String path, {
    Object? body,
    T Function(Object? json)? decode,
    Duration? receiveTimeout,
  }) => _send(
    () => _dio.post<Object?>(
      path,
      data: body,
      options: receiveTimeout == null
          ? null
          : Options(receiveTimeout: receiveTimeout),
    ),
    decode,
  );

  Future<ApiResult<T>> put<T>(
    String path, {
    Object? body,
    T Function(Object? json)? decode,
  }) => _send(() => _dio.put<Object?>(path, data: body), decode);

  Future<ApiResult<T>> patch<T>(
    String path, {
    Object? body,
    T Function(Object? json)? decode,
  }) => _send(() => _dio.patch<Object?>(path, data: body), decode);

  Future<ApiResult<T>> delete<T>(
    String path, {
    T Function(Object? json)? decode,
  }) => _send(() => _dio.delete<Object?>(path), decode);

  Future<ApiResult<T>> _send<T>(
    Future<Response<Object?>> Function() request,
    T Function(Object? json)? decode,
  ) async {
    try {
      final response = await request();
      final data = response.data;
      return Ok(decode != null ? decode(data) : data as T);
    } on DioException catch (e) {
      return Err(ApiError.fromDio(e));
    } on Object catch (e, stack) {
      // A decoding bug must surface as an error state, not a crash.
      debugPrint('ApiClient decode failure: $e\n$stack');
      return const Err(
        ApiError(
          type: ApiErrorType.unknown,
          message: 'Nie udało się odczytać odpowiedzi serwera.',
        ),
      );
    }
  }
}

class _AuthInterceptor extends QueuedInterceptor {
  _AuthInterceptor({
    required this.dio,
    required this.tokenStore,
    required this.onSessionExpired,
    required this.onConsentsRequired,
  });

  final Dio dio;
  final TokenStore tokenStore;
  final VoidCallback onSessionExpired;
  final VoidCallback onConsentsRequired;

  static const _retriedKey = 'vocare.retried';

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final token = tokenStore.current?.accessToken;
    if (token != null) options.headers['Authorization'] = 'Bearer $token';
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final response = err.response;
    final path = err.requestOptions.path.toLowerCase();
    final isAuthCall = path.contains('/api/auth/');

    if (response?.statusCode == 403) {
      final error = ApiError.fromResponse(response);
      if (error.type == ApiErrorType.consentsRequired) onConsentsRequired();
      return handler.next(err);
    }

    if (response?.statusCode != 401 || isAuthCall) return handler.next(err);

    final tokens = tokenStore.current;
    final alreadyRetried = err.requestOptions.extra[_retriedKey] == true;
    if (tokens?.refreshToken != null && !alreadyRetried) {
      final refreshed = await _refresh(tokens!);
      if (refreshed != null) {
        final retry = err.requestOptions
          ..headers['Authorization'] = 'Bearer ${refreshed.accessToken}'
          ..extra[_retriedKey] = true;
        try {
          // A bare Dio: re-entering this queued interceptor from its own
          // onError would deadlock if the retry failed too.
          return handler.resolve(await Dio(dio.options).fetch<Object?>(retry));
        } on DioException catch (e) {
          return handler.next(e);
        }
      }
    }

    if (tokens != null) onSessionExpired();
    handler.next(err);
  }

  Future<AuthTokens?> _refresh(AuthTokens tokens) async {
    try {
      final response = await Dio(BaseOptions(baseUrl: dio.options.baseUrl))
          .post<Map<String, Object?>>(
            '/api/Auth/refresh',
            data: {'refreshToken': tokens.refreshToken},
          );
      final token = response.data?['token'] as String?;
      if (token == null) return null;
      final expiresIn = (response.data?['expiresIn'] as num?)?.toInt() ?? 3600;
      final updated = tokens.copyWith(
        accessToken: token,
        expiresAt: DateTime.now().add(Duration(seconds: expiresIn)),
      );
      await tokenStore.save(updated);
      return updated;
    } on DioException {
      return null;
    }
  }
}
