import 'package:dio/dio.dart';

enum ApiErrorType {
  network,
  timeout,
  badRequest,
  unauthorized,
  forbidden,
  consentsRequired,
  notFound,
  conflict,
  unprocessable,
  tooManyRequests,
  server,
  cancelled,
  unknown,
}

/// Normalised backend failure. Mirrors `ApiError` in `frontend/lib/api/api-client.ts`
/// and understands ASP.NET ProblemDetails (`errorCode`, `detail`, `errors`).
class ApiError {
  const ApiError({
    required this.type,
    required this.message,
    this.statusCode,
    this.code,
    this.fieldErrors = const {},
  });

  final ApiErrorType type;
  final String message;
  final int? statusCode;

  /// Domain error code from the backend, e.g. `CONSENTS_REQUIRED`.
  final String? code;
  final Map<String, List<String>> fieldErrors;

  factory ApiError.fromDio(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.transformTimeout:
        return const ApiError(
          type: ApiErrorType.timeout,
          message: 'Serwer odpowiada zbyt długo. Spróbuj ponownie za chwilę.',
        );
      case DioExceptionType.connectionError:
        return const ApiError(
          type: ApiErrorType.network,
          message:
              'Nie udało się połączyć z serwerem. Sprawdź połączenie z internetem.',
        );
      case DioExceptionType.cancel:
        return const ApiError(
          type: ApiErrorType.cancelled,
          message: 'Żądanie zostało anulowane.',
        );
      case DioExceptionType.badResponse:
        return ApiError.fromResponse(e.response);
      case DioExceptionType.badCertificate:
      case DioExceptionType.unknown:
        return const ApiError(
          type: ApiErrorType.unknown,
          message: 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.',
        );
    }
  }

  factory ApiError.fromResponse(Response<dynamic>? response) {
    final status = response?.statusCode ?? 0;
    final data = response?.data;

    String? code;
    String? detail;
    final fieldErrors = <String, List<String>>{};

    if (data is Map) {
      code = (data['errorCode'] ?? data['code'])?.toString();
      detail = (data['detail'] ?? data['message'] ?? data['errorMessage'])
          ?.toString();
      final errors = data['errors'];
      if (errors is Map) {
        errors.forEach((key, value) {
          if (value is List) {
            fieldErrors[key.toString()] = value.map((v) => '$v').toList();
          }
        });
      } else if (errors is List && detail == null && errors.isNotEmpty) {
        detail = errors
            .map((e) => e is Map ? e['description'] ?? e : e)
            .join('\n');
      }
    } else if (data is String && data.isNotEmpty && data.length < 300) {
      detail = data;
    }

    final type = switch (status) {
      400 => ApiErrorType.badRequest,
      401 => ApiErrorType.unauthorized,
      403 when code == 'CONSENTS_REQUIRED' => ApiErrorType.consentsRequired,
      403 => ApiErrorType.forbidden,
      404 => ApiErrorType.notFound,
      409 => ApiErrorType.conflict,
      422 => ApiErrorType.unprocessable,
      429 => ApiErrorType.tooManyRequests,
      >= 500 => ApiErrorType.server,
      _ => ApiErrorType.unknown,
    };

    return ApiError(
      type: type,
      statusCode: status,
      code: code,
      fieldErrors: fieldErrors,
      message:
          _fallbackMessage(type) ?? detail ?? 'Wystąpił nieoczekiwany błąd.',
    );
  }

  /// Backend messages are mostly English; user-facing copy stays Polish and
  /// feature repositories refine it further where the context is known.
  static String? _fallbackMessage(ApiErrorType type) => switch (type) {
    ApiErrorType.unauthorized => 'Sesja wygasła. Zaloguj się ponownie.',
    ApiErrorType.consentsRequired =>
      'Zaakceptuj aktualne dokumenty, aby kontynuować.',
    ApiErrorType.forbidden => 'Nie masz dostępu do tego zasobu.',
    ApiErrorType.tooManyRequests =>
      'Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.',
    ApiErrorType.server =>
      'Coś poszło nie tak po naszej stronie. Spróbuj później.',
    _ => null,
  };

  ApiError withMessage(String message) => ApiError(
    type: type,
    message: message,
    statusCode: statusCode,
    code: code,
    fieldErrors: fieldErrors,
  );

  @override
  String toString() => 'ApiError($type, $statusCode, $code): $message';
}
