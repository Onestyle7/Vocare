import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';

final onboardingSeenProvider = NotifierProvider<OnboardingSeen, bool>(
  OnboardingSeen.new,
);

/// The intro carousel is shown once per install.
class OnboardingSeen extends Notifier<bool> {
  static const _key = 'onboarding.seen';

  @override
  bool build() => ref.read(preferencesProvider).getBool(_key) ?? false;

  Future<void> markSeen() async {
    await ref.read(preferencesProvider).setBool(_key, true);
    state = true;
  }
}
