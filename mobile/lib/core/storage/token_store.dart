import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthTokens {
  const AuthTokens({
    required this.accessToken,
    required this.expiresAt,
    this.refreshToken,
    this.userId,
    this.email,
  });

  final String accessToken;
  final String? refreshToken;
  final DateTime expiresAt;
  final String? userId;
  final String? email;

  bool get isExpired =>
      DateTime.now().isAfter(expiresAt.subtract(const Duration(seconds: 30)));

  AuthTokens copyWith({String? accessToken, DateTime? expiresAt}) => AuthTokens(
    accessToken: accessToken ?? this.accessToken,
    expiresAt: expiresAt ?? this.expiresAt,
    refreshToken: refreshToken,
    userId: userId,
    email: email,
  );

  Map<String, Object?> toJson() => {
    'accessToken': accessToken,
    'refreshToken': refreshToken,
    'expiresAt': expiresAt.toIso8601String(),
    'userId': userId,
    'email': email,
  };

  static AuthTokens? fromJson(Map<String, Object?> json) {
    final token = json['accessToken'];
    final expiresAt = DateTime.tryParse('${json['expiresAt']}');
    if (token is! String || expiresAt == null) return null;
    return AuthTokens(
      accessToken: token,
      refreshToken: json['refreshToken'] as String?,
      expiresAt: expiresAt,
      userId: json['userId'] as String?,
      email: json['email'] as String?,
    );
  }
}

/// Keeps the session in the Keychain / Android Keystore — never in prefs.
class TokenStore {
  TokenStore([FlutterSecureStorage? storage])
    : _storage = storage ?? const FlutterSecureStorage();

  static const _key = 'vocare.session';

  final FlutterSecureStorage _storage;
  AuthTokens? _cache;

  AuthTokens? get current => _cache;

  Future<AuthTokens?> load() async {
    try {
      final raw = await _storage.read(key: _key);
      if (raw == null) return _cache = null;
      return _cache = AuthTokens.fromJson(
        (jsonDecode(raw) as Map).cast<String, Object?>(),
      );
    } on Exception {
      // A keychain entry restored from a backup on another device is
      // unreadable; treat it as signed out.
      await clear();
      return null;
    }
  }

  Future<void> save(AuthTokens tokens) async {
    _cache = tokens;
    await _storage.write(key: _key, value: jsonEncode(tokens.toJson()));
  }

  Future<void> clear() async {
    _cache = null;
    await _storage.delete(key: _key);
  }
}
