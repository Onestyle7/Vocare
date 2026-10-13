import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../auth/application/session_controller.dart';

/// Version of the AI data-sharing notice. Bump it whenever the provider list
/// or the scope of shared data changes — everyone is asked again.
const aiConsentVersion = 1;

enum AiConsentStatus {
  /// Never asked, or asked about an older version of the notice.
  undecided,
  granted,
  declined,
}

/// Explicit permission to send personal data to a third-party AI provider
/// (App Review Guideline 5.1.2(i)). Kept per user on the device.
///
/// TODO(legal): once the backend Legal module (branch
/// `feature/epic-consent-mgmt`) is merged, record the decision as a
/// `UserConsents` entry as well, so it is part of the GDPR audit trail.
class AiConsent {
  const AiConsent({required this.status, this.decidedAt});

  final AiConsentStatus status;
  final DateTime? decidedAt;

  bool get granted => status == AiConsentStatus.granted;

  static const undecided = AiConsent(status: AiConsentStatus.undecided);
}

final aiConsentProvider = NotifierProvider<AiConsentController, AiConsent>(
  AiConsentController.new,
);

class AiConsentController extends Notifier<AiConsent> {
  String? get _key {
    final userId = ref.read(sessionProvider).userId;
    return userId == null ? null : 'ai_consent.$userId';
  }

  @override
  AiConsent build() {
    // A different account on the same phone decides for itself.
    ref.watch(sessionProvider.select((s) => s.userId));
    final key = _key;
    if (key == null) return AiConsent.undecided;
    final raw = ref.read(preferencesProvider).getString(key);
    if (raw == null) return AiConsent.undecided;
    try {
      final json = jsonDecode(raw) as Map;
      if (json['version'] != aiConsentVersion) return AiConsent.undecided;
      return AiConsent(
        status: json['granted'] == true
            ? AiConsentStatus.granted
            : AiConsentStatus.declined,
        decidedAt: DateTime.tryParse('${json['at']}'),
      );
    } on Object {
      return AiConsent.undecided;
    }
  }

  void grant() => _decide(granted: true);

  /// Declining and withdrawing are the same record: AI features then ask
  /// again just before they would send anything.
  void decline() => _decide(granted: false);

  void _decide({required bool granted}) {
    final now = DateTime.now();
    state = AiConsent(
      status: granted ? AiConsentStatus.granted : AiConsentStatus.declined,
      decidedAt: now,
    );
    final key = _key;
    if (key == null) return;
    ref
        .read(preferencesProvider)
        .setString(
          key,
          jsonEncode({
            'granted': granted,
            'version': aiConsentVersion,
            'at': now.toUtc().toIso8601String(),
          }),
        );
  }
}
