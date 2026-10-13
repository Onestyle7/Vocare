import 'dart:io';

/// Build-time configuration, supplied with `--dart-define` (see README).
abstract final class Env {
  static const _apiBaseUrl = String.fromEnvironment('API_BASE_URL');

  /// Backend origin without the `/api` suffix. Defaults to the plain-http
  /// Kestrel endpoint from appsettings.Development.json, seen from the
  /// simulator / emulator.
  static String get apiBaseUrl {
    if (_apiBaseUrl.isNotEmpty) return _apiBaseUrl;
    return Platform.isAndroid
        ? 'http://10.0.2.2:8080'
        : 'http://localhost:8080';
  }

  /// Web app origin — legal documents and "continue on the web" links.
  static const webBaseUrl = String.fromEnvironment(
    'WEB_BASE_URL',
    defaultValue: 'https://vocare.pl',
  );

  static const googleIosClientId = String.fromEnvironment(
    'GOOGLE_IOS_CLIENT_ID',
  );
  static const googleServerClientId = String.fromEnvironment(
    'GOOGLE_SERVER_CLIENT_ID',
  );

  static const linkedInClientId = String.fromEnvironment('LINKEDIN_CLIENT_ID');

  /// LinkedIn only accepts https redirects, so the web app bounces the code
  /// back into the app (`frontend/app/api/oauth/mobile/linkedin/route.ts`).
  static const linkedInRedirectUri = String.fromEnvironment(
    'LINKEDIN_REDIRECT_URI',
    defaultValue: 'https://vocare.pl/api/oauth/mobile/linkedin',
  );

  /// Custom URL scheme registered in Info.plist / AndroidManifest.
  static const appScheme = 'vocare';

  static bool get googleConfigured =>
      googleServerClientId.isNotEmpty &&
      (!Platform.isIOS || googleIosClientId.isNotEmpty);

  static bool get linkedInConfigured => linkedInClientId.isNotEmpty;
}
