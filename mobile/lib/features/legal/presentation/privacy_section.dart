import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/config/env.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/glass_widgets.dart';
import '../../../core/widgets/native_controls.dart';
import '../../../core/widgets/pressable.dart';
import '../data/ai_consent.dart';
import '../data/legal_repository.dart';
import 'ai_consent_sheet.dart';

final _decidedAt = DateFormat('d MMM yyyy', 'pl');

/// "Prywatność i dokumenty" in the profile: the AI consent can be given or
/// withdrawn at any time, and the legal documents stay one tap away.
class PrivacySection extends ConsumerWidget {
  const PrivacySection({super.key});

  Future<void> _toggleAi(BuildContext context, WidgetRef ref, bool on) async {
    if (on) {
      // Turning it on still shows what is shared — consent must be informed.
      final granted = await showAiConsentSheet(context);
      if (granted && context.mounted) {
        showToast(context, 'Funkcje AI są włączone', kind: ToastKind.success);
      }
      return;
    }
    final confirmed = await confirmAction(
      context,
      title: 'Wycofać zgodę na AI?',
      message:
          'Nie będziemy przekazywać Twoich danych do OpenAI, a funkcje AI zapytają o zgodę przed kolejnym użyciem. Wycofanie nie wpływa na przetwarzanie, które odbyło się wcześniej.',
      confirmLabel: 'Wycofaj zgodę',
      destructive: true,
    );
    if (!confirmed) return;
    ref.read(aiConsentProvider.notifier).decline();
    if (context.mounted) showToast(context, 'Zgoda na AI została wycofana');
  }

  Future<void> _open(LegalDocumentType document) => launchUrl(
    Uri.parse('${Env.webBaseUrl}${document.webPath}'),
    mode: LaunchMode.inAppBrowserView,
  );

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final consent = ref.watch(aiConsentProvider);
    final status = switch (consent.status) {
      AiConsentStatus.granted when consent.decidedAt != null =>
        'Udzielona ${_decidedAt.format(consent.decidedAt!)}',
      AiConsentStatus.granted => 'Udzielona',
      AiConsentStatus.declined => 'Funkcje AI są wyłączone',
      AiConsentStatus.undecided => 'Jeszcze nie zdecydowano',
    };

    return SurfaceCard(
      padding: const EdgeInsets.fromLTRB(20, 18, 16, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Prywatność i dokumenty', style: AppTypography.titleSmall),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Przekazywanie danych do AI',
                      style: AppTypography.button.copyWith(height: 1.3),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'OpenAI · $status',
                      style: AppTypography.label.copyWith(height: 1.4),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              LiquidGlassSwitch(
                value: consent.granted,
                semanticLabel: 'Zgoda na przekazywanie danych do AI',
                onChanged: (on) => _toggleAi(context, ref, on),
              ),
            ],
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(height: 1, color: AppColors.hairline),
          ),
          for (final document in const [
            LegalDocumentType.termsOfService,
            LegalDocumentType.privacyPolicy,
          ])
            _LinkRow(
              icon: document == LegalDocumentType.termsOfService
                  ? Icons.description_outlined
                  : Icons.privacy_tip_outlined,
              label: document.label,
              onTap: () => _open(document),
            ),
        ],
      ),
    );
  }
}

class _LinkRow extends StatelessWidget {
  const _LinkRow({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: onTap,
      semanticLabel: label,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: ExcludeSemantics(
          child: Row(
            children: [
              Icon(icon, size: 20, color: AppColors.textMuted),
              const SizedBox(width: 12),
              Expanded(child: Text(label, style: AppTypography.body)),
              const Icon(
                Icons.open_in_new_rounded,
                size: 18,
                color: AppColors.textSubtle,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
