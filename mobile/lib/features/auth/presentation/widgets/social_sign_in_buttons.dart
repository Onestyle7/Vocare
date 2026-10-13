import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/config/env.dart';
import '../../../../core/network/result.dart';
import '../../../../core/providers.dart';
import '../../../../core/widgets/app_icon.dart';
import '../../../../core/widgets/buttons.dart';
import '../../../../core/widgets/feedback.dart';
import '../../application/session_controller.dart';
import '../../data/social_auth.dart';
import 'auth_layout.dart';

enum _Provider { google, linkedIn }

/// "Lub" + Google / LinkedIn buttons. A successful login updates the session
/// and the router moves on by itself.
class SocialSignInButtons extends ConsumerStatefulWidget {
  const SocialSignInButtons({super.key});

  @override
  ConsumerState<SocialSignInButtons> createState() =>
      _SocialSignInButtonsState();
}

class _SocialSignInButtonsState extends ConsumerState<SocialSignInButtons> {
  _Provider? _busy;

  Future<void> _run(_Provider provider) async {
    if (_busy != null) return;
    setState(() => _busy = provider);
    final social = ref.read(socialAuthProvider);
    final repo = ref.read(authRepositoryProvider);
    try {
      final result = switch (provider) {
        _Provider.google => await repo.verifyGoogle(
          await social.googleAccessToken(),
        ),
        _Provider.linkedIn => await repo.verifyLinkedIn(
          code: await social.linkedInCode(),
          redirectUri: Env.linkedInRedirectUri,
        ),
      };
      switch (result) {
        case Ok(:final value):
          await ref.read(sessionProvider.notifier).signIn(value);
        case Err(:final error):
          if (mounted) showToast(context, error.message, kind: ToastKind.error);
      }
    } on SocialAuthCancelled {
      // The person closed the provider sheet — nothing to report.
    } on SocialAuthException catch (e) {
      if (mounted) showToast(context, e.message, kind: ToastKind.error);
    } finally {
      if (mounted) setState(() => _busy = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const LabeledDivider(label: 'Lub'),
        fieldGap,
        OutlinePillButton(
          label: 'Zaloguj się Google',
          loading: _busy == _Provider.google,
          leading: Image.asset(
            'assets/icons/google.png',
            width: 24,
            height: 24,
          ),
          onPressed: () => _run(_Provider.google),
        ),
        fieldGap,
        OutlinePillButton(
          label: 'Zaloguj się LinkedIn',
          loading: _busy == _Provider.linkedIn,
          leading: const AppIcon(AppIcons.linkedIn, size: 24),
          onPressed: () => _run(_Provider.linkedIn),
        ),
      ],
    );
  }
}
