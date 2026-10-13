import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/result.dart';
import '../../../core/providers.dart';
import '../../../core/router/app_router.dart';
import '../../../core/widgets/app_icon.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/buttons.dart';
import '../../../core/widgets/feedback.dart';
import 'password_rules.dart';
import 'validators.dart';
import 'widgets/auth_layout.dart';

/// "Enter New Password screen" — opened from the e-mail link
/// (`/reset-password?token=…&email=…`).
class ResetPasswordScreen extends ConsumerStatefulWidget {
  const ResetPasswordScreen({
    super.key,
    required this.token,
    required this.email,
  });

  final String token;
  final String email;

  @override
  ConsumerState<ResetPasswordScreen> createState() =>
      _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _form = GlobalKey<FormState>();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  final _confirmFocus = FocusNode();
  bool _loading = false;

  /// `null` while checking the link.
  bool? _linkValid;

  @override
  void initState() {
    super.initState();
    _validateLink();
  }

  Future<void> _validateLink() async {
    if (widget.token.isEmpty || widget.email.isEmpty) {
      setState(() => _linkValid = false);
      return;
    }
    final result = await ref
        .read(authRepositoryProvider)
        .validateResetToken(token: widget.token, email: widget.email);
    if (mounted) setState(() => _linkValid = result.valueOrNull ?? false);
  }

  @override
  void dispose() {
    _password.dispose();
    _confirm.dispose();
    _confirmFocus.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() => _loading = true);
    final result = await ref
        .read(authRepositoryProvider)
        .resetPassword(
          token: widget.token,
          email: widget.email,
          newPassword: _password.text,
        );
    if (!mounted) return;
    setState(() => _loading = false);
    switch (result) {
      case Ok():
        showToast(
          context,
          'Hasło zostało zmienione. Zaloguj się nowym hasłem.',
          kind: ToastKind.success,
        );
        context.go(Routes.signIn);
      case Err(:final error):
        showToast(context, error.message, kind: ToastKind.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    final invalid = _linkValid == false;
    return AuthLayout(
      title: 'Zresetuj hasło',
      subtitle: invalid
          ? 'Link wygasł lub jest nieprawidłowy. Poproś o nowy.'
          : 'Utwórz nowe hasło dla swojego konta',
      children: [
        if (invalid)
          PrimaryButton(
            label: 'Wyślij nowy link',
            onPressed: () => context.go(Routes.forgotPassword),
          )
        else
          Form(
            key: _form,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AppTextField(
                  controller: _password,
                  hint: 'Hasło',
                  icon: AppIcons.lock,
                  obscure: true,
                  enabled: _linkValid == true,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.newPassword],
                  validator: AuthValidators.newPassword,
                  onSubmitted: (_) => _confirmFocus.requestFocus(),
                ),
                PasswordRulesChecklist(controller: _password),
                fieldGap,
                AppTextField(
                  controller: _confirm,
                  focusNode: _confirmFocus,
                  hint: 'Potwierdź hasło',
                  icon: AppIcons.lock,
                  obscure: true,
                  enabled: _linkValid == true,
                  textInputAction: TextInputAction.done,
                  validator: AuthValidators.confirm(
                    () => _password.text.trim(),
                  ),
                  onSubmitted: (_) => _submit(),
                ),
                fieldGap,
                PrimaryButton(
                  label: 'Zresetuj hasło',
                  loading: _loading || _linkValid == null,
                  onPressed: _submit,
                ),
              ],
            ),
          ),
        fieldGap,
        InlineLink(
          prefix: 'Pamiętasz hasło?',
          action: 'Zaloguj się',
          onTap: () => context.go(Routes.signIn),
        ),
      ],
    );
  }
}
