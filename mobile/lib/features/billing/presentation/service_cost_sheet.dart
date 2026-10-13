import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/buttons.dart';
import '../../../core/widgets/glass_widgets.dart';
import '../../legal/presentation/ai_consent_sheet.dart';
import '../data/billing_repository.dart';

/// Asks before a paid AI action, with the live token balance — the mobile
/// counterpart of `ServiceCostConfirmationDialog`. There is no purchase path
/// on mobile, so an insufficient balance only explains the situation.
///
/// Returns `true` when the person confirmed.
Future<bool> confirmServiceCost(
  BuildContext context, {
  required String title,
  required int tokenCost,
  required IconData icon,
  String actionLabel = 'Generuj',
}) async {
  // Every paid action here sends personal data to the AI provider, so the
  // explicit AI consent comes first (App Review Guideline 5.1.2(i)).
  if (!await ensureAiConsent(context) || !context.mounted) return false;
  final confirmed = await showGlassSheet<bool>(
    context: context,
    builder: (_) => _ServiceCostSheet(
      title: title,
      tokenCost: tokenCost,
      icon: icon,
      actionLabel: actionLabel,
    ),
  );
  return confirmed ?? false;
}

class _ServiceCostSheet extends ConsumerStatefulWidget {
  const _ServiceCostSheet({
    required this.title,
    required this.tokenCost,
    required this.icon,
    required this.actionLabel,
  });

  final String title;
  final int tokenCost;
  final IconData icon;
  final String actionLabel;

  @override
  ConsumerState<_ServiceCostSheet> createState() => _ServiceCostSheetState();
}

class _ServiceCostSheetState extends ConsumerState<_ServiceCostSheet> {
  late final Future<ApiResult<AccessStatus>> _access = ref
      .read(billingRepositoryProvider)
      .accessStatus();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 12),
      child: FutureBuilder(
        future: _access,
        builder: (context, snapshot) {
          final access = snapshot.data?.valueOrNull;
          final loading = snapshot.connectionState != ConnectionState.done;
          // Unknown balance (request failed) — let the backend decide.
          final affordable = access?.canAfford(widget.tokenCost) ?? true;

          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: AppColors.brandGradient,
                  boxShadow: AppColors.buttonGlow,
                ),
                child: Icon(widget.icon, color: Colors.white, size: 28),
              ),
              const SizedBox(height: 18),
              Text(
                widget.title,
                style: AppTypography.title,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 10),
              Text.rich(
                access?.hasActiveSubscription == true
                    ? const TextSpan(
                        text:
                            'Masz aktywną subskrypcję, więc ta akcja nie wykorzysta żadnych tokenów.',
                      )
                    : TextSpan(
                        children: [
                          const TextSpan(text: 'Zostanie pobrane '),
                          TextSpan(
                            text: '${widget.tokenCost} tokenów',
                            style: const TextStyle(
                              color: AppColors.accent,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const TextSpan(text: ' z Twojego konta.'),
                        ],
                      ),
                style: AppTypography.caption.copyWith(
                  color: AppColors.textMuted,
                  fontSize: 15,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
              if (access != null && !access.hasActiveSubscription) ...[
                const SizedBox(height: 6),
                Text(
                  'Saldo: ${access.tokenBalance} tokenów',
                  style: AppTypography.label,
                ),
              ],
              if (!affordable) ...[
                const SizedBox(height: 18),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 18,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.danger.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: AppColors.danger.withValues(alpha: 0.25),
                    ),
                  ),
                  child: Text(
                    'Niewystarczające saldo (${access!.tokenBalance}/${widget.tokenCost} tokenów)',
                    style: AppTypography.caption.copyWith(height: 1.4),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
              const SizedBox(height: 24),
              PrimaryButton(
                label: widget.actionLabel,
                loading: loading,
                onPressed: affordable
                    ? () => Navigator.pop(context, true)
                    : null,
              ),
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: Text('Anuluj', style: AppTypography.caption),
              ),
            ],
          );
        },
      ),
    );
  }
}
