import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import 'app_icon.dart';
import 'pressable.dart';

/// Gradient pill from the Figma "Sign In Button".
class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.loading = false,
    this.width,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final double? width;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null && !loading;
    return Pressable(
      onTap: enabled ? onPressed : null,
      semanticLabel: label,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 200),
        opacity: onPressed == null ? 0.45 : 1,
        child: Container(
          width: width ?? double.infinity,
          height: AppSpacing.control,
          decoration: BoxDecoration(
            gradient: AppColors.brandGradient,
            borderRadius: BorderRadius.circular(999),
            boxShadow: AppColors.buttonGlow,
          ),
          alignment: Alignment.center,
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: loading
                ? const SizedBox.square(
                    key: ValueKey('loading'),
                    dimension: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.2,
                      color: Colors.white,
                    ),
                  )
                : Text(
                    label,
                    key: const ValueKey('label'),
                    style: AppTypography.button,
                    textAlign: TextAlign.center,
                  ),
          ),
        ),
      ),
    );
  }
}

/// Dark pill with a hairline border — the social login buttons in Figma.
class OutlinePillButton extends StatelessWidget {
  const OutlinePillButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.leading,
    this.loading = false,
  });

  final String label;
  final Widget? leading;
  final VoidCallback? onPressed;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: loading ? null : onPressed,
      semanticLabel: label,
      child: Container(
        height: AppSpacing.control,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: AppColors.outline, width: 0.3),
        ),
        alignment: Alignment.center,
        child: loading
            ? const SizedBox.square(
                dimension: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (leading != null) ...[leading!, const SizedBox(width: 12)],
                  Text(label, style: AppTypography.button),
                ],
              ),
      ),
    );
  }
}

/// Circular back control from the onboarding frames (gradient ring + arrow).
class GradientBackButton extends StatelessWidget {
  const GradientBackButton({super.key, required this.onPressed});

  final VoidCallback onPressed;

  static const _size = AppSpacing.control;

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: onPressed,
      semanticLabel: 'Wstecz',
      child: SizedBox.square(
        dimension: _size,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: AppColors.buttonGlow,
                  color: AppColors.surface,
                ),
              ),
            ),
            // The export is 83.6pt including the shadow bleed; the ring sits at
            // (12.3, 7.3) inside it, as in the Figma layer.
            const Positioned(
              left: -11.3,
              top: -6.3,
              child: AppIcon(AppIcons.backButton, size: 83.6),
            ),
          ],
        ),
      ),
    );
  }
}

/// Text link pair: "Nie masz konta? **Zarejestruj się**".
class InlineLink extends StatelessWidget {
  const InlineLink({
    super.key,
    required this.prefix,
    required this.action,
    required this.onTap,
  });

  final String prefix;
  final String action;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: onTap,
      scale: 0.98,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Text.rich(
          TextSpan(
            children: [
              TextSpan(text: '$prefix '),
              TextSpan(
                text: action,
                style: AppTypography.caption.copyWith(
                  fontWeight: FontWeight.w400,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          textAlign: TextAlign.center,
          style: AppTypography.caption.copyWith(color: AppColors.textMuted),
        ),
      ),
    );
  }
}

/// "—— Lub ——" separator.
class LabeledDivider extends StatelessWidget {
  const LabeledDivider({super.key, required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    const line = Expanded(
      child: Divider(color: AppColors.divider, thickness: 1),
    );
    return Row(
      children: [
        line,
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(label, style: AppTypography.caption),
        ),
        line,
      ],
    );
  }
}
