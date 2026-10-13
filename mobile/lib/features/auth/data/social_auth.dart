import 'dart:math';

import 'package:flutter/services.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../../core/config/env.dart';

/// Thrown when the person closes the provider sheet — not an error to show.
class SocialAuthCancelled implements Exception {
  const SocialAuthCancelled();
}

class SocialAuthException implements Exception {
  const SocialAuthException(this.message);
  final String message;
}

/// Obtains provider credentials on the device; the backend verifies them.
class SocialAuth {
  static const _googleScopes = ['email', 'profile', 'openid'];
  static const _linkedInScopes = 'openid profile email';

  bool _googleReady = false;

  /// Returns a Google OAuth access token for `/api/Auth/google-verify`.
  Future<String> googleAccessToken() async {
    if (!Env.googleConfigured) {
      throw const SocialAuthException(
        'Logowanie przez Google nie jest jeszcze skonfigurowane w tej wersji aplikacji.',
      );
    }
    final signIn = GoogleSignIn.instance;
    try {
      if (!_googleReady) {
        await signIn.initialize(
          clientId: Env.googleIosClientId.isEmpty
              ? null
              : Env.googleIosClientId,
          serverClientId: Env.googleServerClientId,
        );
        _googleReady = true;
      }
      final account = await signIn.authenticate(scopeHint: _googleScopes);
      final authorization =
          await account.authorizationClient.authorizationForScopes(
            _googleScopes,
          ) ??
          await account.authorizationClient.authorizeScopes(_googleScopes);
      return authorization.accessToken;
    } on GoogleSignInException catch (e) {
      if (e.code == GoogleSignInExceptionCode.canceled ||
          e.code == GoogleSignInExceptionCode.interrupted) {
        throw const SocialAuthCancelled();
      }
      throw const SocialAuthException('Nie udało się zalogować przez Google.');
    }
  }

  Future<void> signOutGoogle() async {
    if (_googleReady) await GoogleSignIn.instance.signOut();
  }

  /// Runs the LinkedIn authorization-code flow in the system browser sheet and
  /// returns the code for `/api/Auth/linkedin-verify`.
  Future<String> linkedInCode() async {
    if (!Env.linkedInConfigured) {
      throw const SocialAuthException(
        'Logowanie przez LinkedIn nie jest jeszcze skonfigurowane w tej wersji aplikacji.',
      );
    }
    final state = _randomState();
    final url = Uri.https('www.linkedin.com', '/oauth/v2/authorization', {
      'response_type': 'code',
      'client_id': Env.linkedInClientId,
      'redirect_uri': Env.linkedInRedirectUri,
      'scope': _linkedInScopes,
      'state': state,
    });

    try {
      final callback = Uri.parse(
        await FlutterWebAuth2.authenticate(
          url: url.toString(),
          callbackUrlScheme: Env.appScheme,
          options: const FlutterWebAuth2Options(preferEphemeral: true),
        ),
      );
      final code = callback.queryParameters['code'];
      if (callback.queryParameters['state'] != state || code == null) {
        throw const SocialAuthException(
          'Nie udało się zalogować przez LinkedIn.',
        );
      }
      return code;
    } on PlatformException catch (e) {
      if (e.code == 'CANCELED') throw const SocialAuthCancelled();
      throw const SocialAuthException(
        'Nie udało się zalogować przez LinkedIn.',
      );
    }
  }

  static String _randomState() {
    final random = Random.secure();
    return List.generate(
      16,
      (_) => random.nextInt(256).toRadixString(16).padLeft(2, '0'),
    ).join();
  }
}
