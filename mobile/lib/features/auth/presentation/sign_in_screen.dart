import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/result.dart';
import '../../../core/providers.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/app_icon.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/buttons.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/pressable.dart';
import '../application/session_controller.dart';
import 'validators.dart';
import 'widgets/auth_layout.dart';
import 'widgets/social_sign_in_buttons.dart';

class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _passwordFocus = FocusNode();
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && ref.read(sessionProvider).expired) {
        showToast(context, 'Sesja wygasła. Zaloguj się ponownie.');
      }
    });
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() => _loading = true);

    final result = await ref
        .read(authRepositoryProvider)
        .signIn(_email.text.trim(), _password.text);
    switch (result) {
      case Ok(:final value):
        TextInput.finishAutofillContext();
        await ref.read(sessionProvider.notifier).signIn(value);
      case Err(:final error):
        if (mounted) showToast(context, error.message, kind: ToastKind.error);
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return AuthLayout(
      title: 'Zaloguj się',
      subtitle: 'Wprowadź hasło oraz e-mail do swojego konta',
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
                  textInputAction: TextInputAction.done,
                  autofillHints: const [AutofillHints.password],
                  validator: AuthValidators.requiredPassword,
                  onSubmitted: (_) => _submit(),
                ),
              ],
            ),
          ),
        ),
        Align(
          alignment: Alignment.centerRight,
          child: Pressable(
            onTap: () => context.push(Routes.forgotPassword),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text(
                'Zapomniałeś hasła?',
                style: AppTypography.caption.copyWith(
                  color: AppColors.textMuted,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        PrimaryButton(
          label: 'Zaloguj się',
          loading: _loading,
          onPressed: _submit,
        ),
        fieldGap,
        const SocialSignInButtons(),
        fieldGap,
        InlineLink(
          prefix: 'Nie masz konta?',
          action: 'Zarejestruj się',
          onTap: () => context.push(Routes.signUp),
        ),
      ],
    );
  }
}
