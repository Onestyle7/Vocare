import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/config/env.dart';
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
import '../application/session_controller.dart';
import '../data/auth_repository.dart';
import 'password_rules.dart';
import 'validators.dart';
import 'widgets/auth_layout.dart';
import 'widgets/social_sign_in_buttons.dart';

class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  final _passwordFocus = FocusNode();
  final _confirmFocus = FocusNode();
  late final _termsLink = _link('/terms-of-service');
  late final _privacyLink = _link('/privacy-policy');

  bool _acceptTerms = false;
  bool _acceptMarketing = false;
  bool _termsError = false;
  bool _loading = false;

  @override
  void dispose() {
    for (final c in [_email, _password, _confirm]) {
      c.dispose();
    }
    _passwordFocus.dispose();
    _confirmFocus.dispose();
    _termsLink.dispose();
    _privacyLink.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final valid = _form.currentState!.validate();
    setState(() => _termsError = !_acceptTerms);
    if (!valid || !_acceptTerms) return;

    FocusScope.of(context).unfocus();
    setState(() => _loading = true);

    final auth = ref.read(authRepositoryProvider);
    final email = _email.text.trim();
    final registered = await auth.register(
      email: email,
      password: _password.text,
      acceptMarketing: _acceptMarketing,
    );

    switch (registered) {
      case Err(:final error):
        if (mounted) showToast(context, error.message, kind: ToastKind.error);
      case Ok(value: final bonus):
        TextInput.finishAutofillContext();
        if (mounted) {
          showToast(
            context,
            _registrationMessage(bonus),
            kind: ToastKind.success,
          );
        }
        // Signing in right away saves a round-trip through the login form.
        final signedIn = await auth.signIn(email, _password.text);
        switch (signedIn) {
          case Ok(:final value):
            await ref.read(sessionProvider.notifier).signIn(value);
          case Err():
            if (mounted) context.popOrGo(Routes.signIn);
        }
    }
    if (mounted) setState(() => _loading = false);
  }

  /// Same copy as `getRegistrationToastMessage` on the web.
  static String _registrationMessage(WelcomeBonus? bonus) =>
      switch (bonus?.status) {
        WelcomeBonusStatus.granted =>
          'Rejestracja ukończona, przyznano ${_tokens(bonus!.amount)}',
        WelcomeBonusStatus.pending =>
          'Rejestracja ukończona. Tokeny pojawią się na koncie za chwilę.',
        _ => 'Rejestracja ukończona',
      };

  static String _tokens(int count) {
    final mod10 = count % 10;
    final mod100 = count % 100;
    if (count == 1) return '1 token';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
      return '$count tokeny';
    }
    return '$count tokenów';
  }

  TapGestureRecognizer _link(String path) => TapGestureRecognizer()
    ..onTap = () => launchUrl(
      Uri.parse('${Env.webBaseUrl}$path'),
      mode: LaunchMode.inAppBrowserView,
    );

  @override
  Widget build(BuildContext context) {
    final linkStyle = AppTypography.caption.copyWith(
      color: AppColors.textPrimary,
      decoration: TextDecoration.underline,
      decorationColor: AppColors.textSubtle,
      height: 1.5,
    );

    return AuthLayout(
      title: 'Zarejestruj się',
      subtitle: 'Wprowadź hasło oraz e-mail do swojego konta',
      showBack: true,
      children: [
        AutofillGroup(
          child: Form(
            key: _form,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AppTextField(
                  controller: _email,
                  hint: 'Email',
                  icon: AppIcons.sms,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.email],
                  validator: AuthValidators.email,
                  onSubmitted: (_) => _passwordFocus.requestFocus(),
                ),
                fieldGap,
                AppTextField(
                  controller: _password,
                  focusNode: _passwordFocus,
                  hint: 'Hasło',
                  icon: AppIcons.lock,
                  obscure: true,
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
                  textInputAction: TextInputAction.done,
                  autofillHints: const [AutofillHints.newPassword],
                  validator: AuthValidators.confirm(
                    () => _password.text.trim(),
                  ),
                  onSubmitted: (_) => _submit(),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        AppCheckbox(
          value: _acceptTerms,
          error: _termsError ? 'required' : null,
          onChanged: (v) => setState(() {
            _acceptTerms = v;
            _termsError = false;
          }),
          label: Text.rich(
            TextSpan(
              children: [
                // Legal copy kept identical to the web sign-up form.
                const TextSpan(text: 'Oświadczam, że zapoznałem/am się z '),
                TextSpan(
                  text: 'regulaminem',
                  style: linkStyle,
                  recognizer: _termsLink,
                ),
                const TextSpan(text: ' oraz '),
                TextSpan(
                  text: 'polityką prywatności',
                  style: linkStyle,
                  recognizer: _privacyLink,
                ),
                const TextSpan(text: ' serwisu i akceptuję jego treść.'),
              ],
            ),
          ),
        ),
        if (_termsError)
          Padding(
            padding: const EdgeInsets.only(left: 34, bottom: 4),
            child: Text(
              'Akceptacja regulaminu jest wymagana',
              style: AppTypography.label.copyWith(color: AppColors.danger),
            ),
          ),
        AppCheckbox(
          value: _acceptMarketing,
          onChanged: (v) => setState(() => _acceptMarketing = v),
          label: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Wyrażam zgodę na otrzymywanie od firmy Vocare okazjonalnych '
                'aktualizacji produktów i wiadomości e-mail o charakterze marketingowym.',
              ),
              const SizedBox(height: 2),
              Text(
                'W podziękowaniu za zgodę otrzymasz darmowe tokeny na start.',
                style: AppTypography.label.copyWith(color: AppColors.accent),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        PrimaryButton(
          label: 'Zarejestruj się',
          loading: _loading,
          onPressed: _submit,
        ),
        fieldGap,
        const SocialSignInButtons(),
        fieldGap,
        InlineLink(
          prefix: 'Masz już konto?',
          action: 'Zaloguj się',
          onTap: () => context.popOrGo(Routes.signIn),
        ),
      ],
    );
  }
}
