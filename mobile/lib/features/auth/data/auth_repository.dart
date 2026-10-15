import '../../../core/network/api_client.dart';
import '../../../core/network/api_error.dart';
import '../../../core/network/result.dart';
import '../../../core/storage/token_store.dart';

enum WelcomeBonusStatus { granted, alreadyClaimed, disabled, pending, failed }

class WelcomeBonus {
  const WelcomeBonus(this.status, this.amount);

  final WelcomeBonusStatus status;
  final int amount;

  static WelcomeBonus? fromJson(Object? json) {
    if (json is! Map) return null;
    final raw = '${json['status']}'.toLowerCase();
    final status = WelcomeBonusStatus.values.firstWhere(
      (s) => s.name.toLowerCase() == raw,
      orElse: () => WelcomeBonusStatus.failed,
    );
    return WelcomeBonus(status, (json['amount'] as num?)?.toInt() ?? 0);
  }
}

/// `/api/Auth/*`. Error copy mirrors `frontend/features/auth/dal/services.ts`.
class AuthRepository {
  const AuthRepository(this._api);

  final ApiClient _api;

  Future<ApiResult<AuthTokens>> signIn(String email, String password) async {
    final result = await _api.post<AuthTokens>(
      '/api/Auth/login',
      body: {'email': email, 'password': password},
      decode: (json) => _tokensFrom(json as Map, fallbackEmail: email),
    );
    return _mapErr(result, (e) {
      return switch (e.code) {
        'INVALID_CREDENTIALS' => e.withMessage('Nieprawidłowe dane logowania'),
        'ACCOUNT_LOCKED' => e.withMessage(
          'Konto zostało tymczasowo zablokowane po wielu nieudanych próbach. Spróbuj później.',
        ),
        _ when e.type == ApiErrorType.unauthorized => e.withMessage(
          'Nieprawidłowe dane logowania',
        ),
        _ => e,
      };
    });
  }

  Future<ApiResult<WelcomeBonus?>> register({
    required String email,
    required String password,
    required bool acceptMarketing,
  }) async {
    final result = await _api.post<WelcomeBonus?>(
      '/api/Auth/register',
      body: {
        'email': email,
        'password': password,
        'confirmPassword': password,
        'acceptMarketingConsent': acceptMarketing,
      },
      decode: (json) => WelcomeBonus.fromJson((json as Map?)?['welcomeBonus']),
    );
    return _mapErr(result, (e) {
      return switch (e.code) {
        'GOOGLE_ACCOUNT_EXISTS' => e.withMessage(
          'To konto jest powiązane z Google - zaloguj się przez Google.',
        ),
        _ when e.type == ApiErrorType.conflict => e.withMessage(
          'Użytkownik z takim adresem e-mail już istnieje',
        ),
        _ when e.type == ApiErrorType.badRequest => e.withMessage(
          'Sprawdź poprawność danych i spróbuj ponownie.',
        ),
        _ => e,
      };
    });
  }

  Future<ApiResult<void>> forgotPassword(String email) async {
    final result = await _api.post<void>(
      '/api/Auth/forgot-password',
      body: {'email': email},
      decode: (_) {},
    );
    return _mapErr(
      result,
      (e) => e.type == ApiErrorType.badRequest
          ? e.withMessage('Niepoprawny adres e-mail')
          : e,
    );
  }

  Future<ApiResult<bool>> validateResetToken({
    required String token,
    required String email,
  }) => _api.get<bool>(
    '/api/Auth/validate-reset-token',
    query: {'token': token, 'email': email},
    decode: (json) => (json as Map?)?['isValid'] == true,
  );

  Future<ApiResult<void>> resetPassword({
    required String token,
    required String email,
    required String newPassword,
  }) async {
    final result = await _api.post<void>(
      '/api/Auth/reset-password',
      body: {
        'email': email,
        'token': token,
        'newPassword': newPassword,
        'confirmPassword': newPassword,
      },
      decode: (_) {},
    );
    return _mapErr(
      result,
      (e) => e.type == ApiErrorType.badRequest
          ? e.withMessage('Hasło nie spełnia wymagań lub link wygasł')
          : e.withMessage('Nie udało się zmienić hasła'),
    );
  }

  Future<ApiResult<AuthTokens>> verifyGoogle(String accessToken) =>
      _verifyOAuth('/api/Auth/google-verify', {'accessToken': accessToken});

  Future<ApiResult<AuthTokens>> verifyLinkedIn({
    required String code,
    required String redirectUri,
  }) => _verifyOAuth('/api/Auth/linkedin-verify', {
    'code': code,
    'redirectUri': redirectUri,
  });

  Future<void> logout() => _api.post<void>('/api/Auth/logout', decode: (_) {});

  Future<ApiResult<AuthTokens>> _verifyOAuth(
    String path,
    Map<String, Object?> body,
  ) async {
    final result = await _api.post<AuthTokens>(
      path,
      body: body,
      decode: (json) => _tokensFrom(json as Map),
    );
    return _mapErr(
      result,
      (e) => e.type == ApiErrorType.badRequest
          ? e.withMessage(
              'Problem podczas logowania przy pomocy zewnętrznego providera',
            )
          : e,
    );
  }

  static AuthTokens _tokensFrom(Map json, {String? fallbackEmail}) {
    final expiresIn = (json['expiresIn'] as num?)?.toInt() ?? 3600;
    return AuthTokens(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String?,
      expiresAt: DateTime.now().add(Duration(seconds: expiresIn)),
      userId: json['userId'] as String?,
      email: (json['email'] as String?) ?? fallbackEmail,
    );
  }

  static ApiResult<T> _mapErr<T>(
    ApiResult<T> result,
    ApiError Function(ApiError) map,
  ) => switch (result) {
    Ok() => result,
    Err(:final error) => Err(map(error)),
  };
}
