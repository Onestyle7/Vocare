import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import 'validators.dart';

/// Live checklist under "new password" fields, so the rules are visible
/// before submitting instead of arriving one error at a time.
class PasswordRulesChecklist extends StatelessWidget {
  const PasswordRulesChecklist({super.key, required this.controller});

  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<TextEditingValue>(
      valueListenable: controller,
      builder: (context, value, _) {
        if (value.text.isEmpty) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
          child: Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              for (final rule in PasswordRule.values)
                _RuleChip(label: rule.label, met: rule.test(value.text)),
            ],
          ),
        );
      },
    );
  }
}

class _RuleChip extends StatelessWidget {
  const _RuleChip({required this.label, required this.met});

  final String label;
  final bool met;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: met
            ? AppColors.gradientSoft.withValues(alpha: 0.16)
            : AppColors.surface,
        border: Border.all(
          color: met
              ? AppColors.gradientSoft.withValues(alpha: 0.5)
              : AppColors.hairline,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            met ? Icons.check_rounded : Icons.circle_outlined,
            size: 12,
            color: met ? AppColors.gradientSoft : AppColors.textSubtle,
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: AppTypography.label.copyWith(
              fontSize: 12,
              color: met ? AppColors.textPrimary : AppColors.textSubtle,
            ),
          ),
        ],
      ),
    );
  }
}
