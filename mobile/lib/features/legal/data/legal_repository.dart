import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_error.dart';
import '../../../core/network/result.dart';
import '../../../core/providers.dart';

enum LegalDocumentType {
  termsOfService('Regulamin', '/terms-of-service'),
  privacyPolicy('Polityka prywatności', '/privacy-policy'),
  unknown('Dokument', '/');

  const LegalDocumentType(this.label, this.webPath);
  final String label;
  final String webPath;

  static LegalDocumentType parse(Object? raw) => switch ('$raw') {
    'TermsOfService' || '1' => termsOfService,
    'PrivacyPolicy' || '2' => privacyPolicy,
    _ => unknown,
  };
}

class PendingDocument {
  const PendingDocument({
    required this.id,
    required this.type,
    required this.version,
    required this.contentPath,
  });

  final String id;
  final LegalDocumentType type;
  final String version;
  final String contentPath;

  factory PendingDocument.fromJson(Map json) => PendingDocument(
    id: '${json['id']}',
    type: LegalDocumentType.parse(json['type']),
    version: '${json['version'] ?? ''}',
    contentPath: '${json['contentPath'] ?? ''}',
  );
}

final legalRepositoryProvider = Provider<LegalRepository>(
  (ref) => LegalRepository(ref.watch(apiClientProvider)),
);

/// `/api/Legal/*` — the GDPR "hard wall" (LegalConsentsMiddleware).
class LegalRepository {
  const LegalRepository(this._api);

  final ApiClient _api;

  Future<ApiResult<List<PendingDocument>>> pending() => _api.get(
    '/api/Legal/pending',
    decode: (json) => (json as List? ?? const [])
        .whereType<Map>()
        .map(PendingDocument.fromJson)
        .toList(),
  );

  /// Returns the re-issued access token carrying `consents_valid: true`.
  Future<ApiResult<String>> accept(List<String> documentIds) => _api.post(
    '/api/Legal/accept',
    body: {'documentIds': documentIds},
    decode: (json) => (json as Map)['accessToken'] as String,
  );

  /// `null` when the backend has no legal module deployed (404) — then the
  /// wall is simply not enforced and the app proceeds.
  Future<bool?> hasValidConsents() async {
    final result = await _api.get<bool>(
      '/api/Legal/status',
      decode: (json) => (json as Map)['hasValidConsents'] == true,
    );
    return switch (result) {
      Ok(:final value) => value,
      Err(:final error) when error.type == ApiErrorType.notFound => null,
      Err() => null,
    };
  }
}
