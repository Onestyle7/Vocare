import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../features/auth/application/session_controller.dart';
import '../features/auth/data/auth_repository.dart';
import '../features/auth/data/social_auth.dart';
import 'network/api_client.dart';
import 'storage/token_store.dart';

/// Overridden in `main()` once the keychain has been read.
final tokenStoreProvider = Provider<TokenStore>(
  (ref) => throw UnimplementedError('tokenStoreProvider must be overridden'),
);

/// Overridden in `main()` with the loaded instance.
final preferencesProvider = Provider<SharedPreferences>(
  (ref) => throw UnimplementedError('preferencesProvider must be overridden'),
);

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(
    tokenStore: ref.watch(tokenStoreProvider),
    onSessionExpired: () => ref.read(sessionProvider.notifier).expire(),
    onConsentsRequired: () =>
        ref.read(sessionProvider.notifier).requireConsents(),
  );
});

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(apiClientProvider)),
);

final socialAuthProvider = Provider<SocialAuth>((ref) => SocialAuth());
