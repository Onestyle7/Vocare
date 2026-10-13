import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../../core/storage/token_store.dart';
import '../../legal/data/legal_repository.dart';

enum SessionStatus { signedOut, signedIn, consentsRequired }

class SessionState {
  const SessionState(
    this.status, {
    this.email,
    this.userId,
    this.expired = false,
  });

  const SessionState.signedOut({bool expired = false})
    : this(SessionStatus.signedOut, expired: expired);

  final SessionStatus status;
  final String? email;
  final String? userId;

  /// Set when the backend rejected the token, so sign-in can explain why.
  final bool expired;

  bool get isSignedIn => status != SessionStatus.signedOut;
}

final sessionProvider = NotifierProvider<SessionController, SessionState>(
  SessionController.new,
);

/// Single source of truth for "who is signed in". The router listens to it,
/// and data providers watch it so they reset on account switches.
class SessionController extends Notifier<SessionState> {
  TokenStore get _store => ref.read(tokenStoreProvider);

  @override
  SessionState build() {
    final tokens = _store.current;
    if (tokens == null) return const SessionState.signedOut();
    // Password logins get no refresh token; an expired one means signing in again.
    if (tokens.isExpired && tokens.refreshToken == null) {
      _store.clear();
      return const SessionState.signedOut(expired: true);
    }
    return _signedIn(tokens);
  }

  Future<void> signIn(AuthTokens tokens) async {
    await _store.save(tokens);
    // Check the legal wall up front instead of waiting for the first 403.
    final consentsValid = await ref
        .read(legalRepositoryProvider)
        .hasValidConsents();
    state = consentsValid == false
        ? SessionState(
            SessionStatus.consentsRequired,
            email: tokens.email,
            userId: tokens.userId,
          )
        : _signedIn(tokens);
  }

  /// Called by the API client on HTTP 403 `CONSENTS_REQUIRED`.
  void requireConsents() {
    if (state.status == SessionStatus.signedIn) {
      state = SessionState(
        SessionStatus.consentsRequired,
        email: state.email,
        userId: state.userId,
      );
    }
  }

  /// `/api/Legal/accept` re-issues the token with `consents_valid: true`.
  Future<void> consentsAccepted(String accessToken) async {
    final current = _store.current;
    if (current == null) return;
    final updated = current.copyWith(accessToken: accessToken);
    await _store.save(updated);
    state = _signedIn(updated);
  }

  /// Called by the API client when a request comes back 401.
  Future<void> expire() async {
    if (!state.isSignedIn) return;
    await _store.clear();
    state = const SessionState.signedOut(expired: true);
  }

  Future<void> signOut() async {
    // Best effort — the local session is cleared regardless.
    await ref.read(authRepositoryProvider).logout();
    await ref.read(socialAuthProvider).signOutGoogle();
    await _store.clear();
    state = const SessionState.signedOut();
  }

  SessionState _signedIn(AuthTokens tokens) => SessionState(
    SessionStatus.signedIn,
    email: tokens.email,
    userId: tokens.userId,
  );
}
