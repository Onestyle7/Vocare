import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/result.dart';
import '../../../core/providers.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/app_icon.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/buttons.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/glass_widgets.dart';
import 'validators.dart';
import 'widgets/auth_layout.dart';

/// "Reset Password screen" from Figma, plus a sent-confirmation state.
class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  bool _loading = false;
  bool _sent = false;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    // The form is unmounted in the "sent" state, where this means "resend".
    if (_form.currentState?.validate() == false) return;
    FocusScope.of(context).unfocus();
    setState(() => _loading = true);
    final result = await ref
        .read(authRepositoryProvider)
        .forgotPassword(_email.text.trim());
    if (!mounted) return;
    setState(() => _loading = false);
    switch (result) {
      case Ok():
        if (_sent) {
          showToast(
            context,
            'Wysłaliśmy link ponownie.',
            kind: ToastKind.success,
          );
        }
        setState(() => _sent = true);
      case Err(:final error):
        showToast(context, error.message, kind: ToastKind.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthLayout(
      title: 'Zresetuj hasło',
      subtitle: _sent
          ? 'Jeśli konto istnieje, wysłaliśmy link do resetu hasła'
          : 'Sprawdź e-mail i kliknij link potrzebny do resetu hasła',
      showBack: true,
      children: [
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          child: _sent ? _sentState() : _formState(),
        ),
        if (!_sent) ...[
          fieldGap,
          InlineLink(
            prefix: 'Pamiętasz hasło?',
            action: 'Zaloguj się',
            onTap: () => context.popOrGo(Routes.signIn),
          ),
        ],
      ],
    );
  }

  Widget _formState() {
    return Form(key: _form, child: _formFields());
  }

  Widget _formFields() {
    return Column(
      key: const ValueKey('form'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppTextField(
          controller: _email,
          hint: 'Email',
          icon: AppIcons.sms,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.done,
          autofillHints: const [AutofillHints.email],
          validator: AuthValidators.email,
          onSubmitted: (_) => _submit(),
        ),
        fieldGap,
        PrimaryButton(
          label: 'Kontynuuj',
          loading: _loading,
          onPressed: _submit,
        ),
      ],
    );
  }

  Widget _sentState() {
    return Column(
      key: const ValueKey('sent'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(28),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.mark_email_read_outlined,
                color: AppColors.accent,
                size: 28,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  'Link wysłaliśmy na ${_email.text.trim()}. '
                  'Otwórz go na tym telefonie, aby ustawić nowe hasło.',
                  style: AppTypography.caption.copyWith(
                    height: 1.5,
                    color: AppColors.textMuted,
                  ),
                ),
              ),
            ],
          ),
        ),
        fieldGap,
        PrimaryButton(
          label: 'Wróć do logowania',
          onPressed: () => context.popOrGo(Routes.signIn),
        ),
        const SizedBox(height: 8),
        TextButton(
          onPressed: _loading ? null : _submit,
          child: Text(
            'Wyślij ponownie',
            style: AppTypography.caption.copyWith(color: AppColors.textMuted),
          ),
        ),
      ],
    );
  }
}
