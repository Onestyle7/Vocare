import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vocare/core/providers.dart';
import 'package:vocare/features/auth/application/session_controller.dart';
import 'package:vocare/features/legal/data/ai_consent.dart';

class _FakeSession extends SessionController {
  _FakeSession(this.userId);

  final String userId;

  @override
  SessionState build() =>
      SessionState(SessionStatus.signedIn, email: 'a@b.pl', userId: userId);
}

Future<ProviderContainer> containerFor(
  String userId, [
  Map<String, Object> prefs = const {},
]) async {
  SharedPreferences.setMockInitialValues(prefs);
  final preferences = await SharedPreferences.getInstance();
  final container = ProviderContainer(
    overrides: [
      preferencesProvider.overrideWithValue(preferences),
      sessionProvider.overrideWith(() => _FakeSession(userId)),
    ],
  );
  addTearDown(container.dispose);
  return container;
}

void main() {
  test('a new user has not decided yet', () async {
    final c = await containerFor('u1');
    expect(c.read(aiConsentProvider).status, AiConsentStatus.undecided);
    expect(c.read(aiConsentProvider).granted, isFalse);
  });

  test('a decision is stored per user and survives a restart', () async {
    final c = await containerFor('u1');
    c.read(aiConsentProvider.notifier).grant();
    expect(c.read(aiConsentProvider).granted, isTrue);

    final prefs = await SharedPreferences.getInstance();
    final stored = jsonDecode(prefs.getString('ai_consent.u1')!) as Map;
    expect(stored['granted'], isTrue);
    expect(stored['version'], aiConsentVersion);

    final restarted = await containerFor('u1', {
      'ai_consent.u1': prefs.getString('ai_consent.u1')!,
    });
    expect(restarted.read(aiConsentProvider).granted, isTrue);

    // Another account on the same phone decides for itself.
    final other = await containerFor('u2', {
      'ai_consent.u1': prefs.getString('ai_consent.u1')!,
    });
    expect(other.read(aiConsentProvider).status, AiConsentStatus.undecided);
  });

  test('withdrawing turns AI features off', () async {
    final c = await containerFor('u1');
    c.read(aiConsentProvider.notifier).grant();
    c.read(aiConsentProvider.notifier).decline();
    expect(c.read(aiConsentProvider).status, AiConsentStatus.declined);
    expect(c.read(aiConsentProvider).granted, isFalse);
  });

  test('a new notice version asks everyone again', () async {
    final c = await containerFor('u1', {
      'ai_consent.u1': jsonEncode({
        'granted': true,
        'version': aiConsentVersion - 1,
        'at': '2026-01-01T00:00:00Z',
      }),
    });
    expect(c.read(aiConsentProvider).status, AiConsentStatus.undecided);
  });

  test('a corrupted record is treated as undecided', () async {
    final c = await containerFor('u1', {'ai_consent.u1': '{not json'});
    expect(c.read(aiConsentProvider).status, AiConsentStatus.undecided);
  });
}
