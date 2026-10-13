import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/config/env.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/buttons.dart';
import '../../../core/widgets/glass_widgets.dart';
import '../../../core/widgets/pressable.dart';
import '../data/ai_consent.dart';
import '../data/legal_repository.dart';

/// Guards every action that sends personal data to the AI provider: returns
/// `true` right away when permission was given, otherwise asks first
/// (App Review Guideline 5.1.2(i) — explicit permission before sharing
/// personal data with third-party AI).
Future<bool> ensureAiConsent(BuildContext context) async {
  final container = ProviderScope.containerOf(context, listen: false);
  if (container.read(aiConsentProvider).granted) return true;
  final granted = await showAiConsentSheet(context);
  return granted;
}

/// The consent sheet. Records the decision either way and returns whether
/// the person agreed; dismissing it counts as "not now".
Future<bool> showAiConsentSheet(BuildContext context) async {
  final container = ProviderScope.containerOf(context, listen: false);
  final granted = await showGlassSheet<bool>(
    context: context,
    builder: (_) => const _AiConsentSheet(),
  );
  final controller = container.read(aiConsentProvider.notifier);
  granted == true ? controller.grant() : controller.decline();
  return granted == true;
}

class _AiConsentSheet extends StatelessWidget {
  const _AiConsentSheet();

  Future<void> _openPrivacyPolicy() => launchUrl(
    Uri.parse('${Env.webBaseUrl}${LegalDocumentType.privacyPolicy.webPath}'),
    mode: LaunchMode.inAppBrowserView,
  );

  @override
  Widget build(BuildContext context) {
    // Scrolls on small phones (iPhone SE) instead of clipping the buttons.
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 56,
              height: 56,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppColors.brandGradient,
              ),
              child: const Icon(
                Icons.auto_awesome_rounded,
                color: Colors.white,
                size: 26,
              ),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            'Twoje dane i AI',
            style: AppTypography.title,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            'Funkcje AI w Vocare działają na modelach firmy OpenAI. Zanim wyślemy tam jakiekolwiek Twoje dane, potrzebujemy Twojej zgody.',
            style: AppTypography.caption.copyWith(
              color: AppColors.textMuted,
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 18),
          const _Point(
            icon: Icons.person_outline_rounded,
            title: 'Co przekazujemy',
            text:
                'Dane z profilu (doświadczenie, wykształcenie, umiejętności, oczekiwania finansowe), treść Twoich CV i wklejonych ofert pracy.',
          ),
          const _Point(
            icon: Icons.dns_outlined,
            title: 'Komu',
            text: 'OpenAI — dostawcy modeli GPT, z których korzysta Vocare.',
          ),
          const _Point(
            icon: Icons.touch_app_outlined,
            title: 'Kiedy',
            text:
                'Tylko gdy sam uruchomisz funkcję AI: rekomendacje ścieżek, analizę rynku, roadmapę, kreator i analizę CV albo import CV.',
          ),
          const _Point(
            icon: Icons.toggle_on_outlined,
            title: 'Twoja decyzja',
            text:
                'Zgodę wycofasz w każdej chwili w Profil → Prywatność. Bez niej korzystasz z Vocare normalnie, tylko bez funkcji AI.',
          ),
          Center(
            child: Pressable(
              onTap: _openPrivacyPolicy,
              semanticLabel: 'Otwórz politykę prywatności',
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  'Szczegóły w polityce prywatności',
                  style: AppTypography.label.copyWith(
                    color: AppColors.accent,
                    decoration: TextDecoration.underline,
                    decorationColor: AppColors.accent,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          PrimaryButton(
            label: 'Zgadzam się',
            onPressed: () => Navigator.pop(context, true),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(
              'Nie teraz',
              style: AppTypography.caption.copyWith(color: AppColors.textMuted),
            ),
          ),
        ],
      ),
    );
  }
}

class _Point extends StatelessWidget {
  const _Point({required this.icon, required this.title, required this.text});

  final IconData icon;
  final String title;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(11),
              color: AppColors.surfaceRaised,
              border: Border.all(color: AppColors.hairline),
            ),
            child: Icon(icon, size: 18, color: AppColors.accent),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppTypography.button.copyWith(height: 1.3)),
                const SizedBox(height: 2),
                Text(
                  text,
                  style: AppTypography.label.copyWith(
                    color: AppColors.textSecondary,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Asks once, shortly after the person first lands in the app: Vocare is
/// built around AI, so the question belongs at the start, not mid-flow.
/// "Nie teraz" is remembered — AI actions then ask again right before use.
class AiConsentLaunchPrompt extends ConsumerStatefulWidget {
  const AiConsentLaunchPrompt({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<AiConsentLaunchPrompt> createState() =>
      _AiConsentLaunchPromptState();
}

class _AiConsentLaunchPromptState extends ConsumerState<AiConsentLaunchPrompt> {
  /// Once per app run, even if the shell is rebuilt.
  static bool _asked = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _maybeAsk());
  }

  Future<void> _maybeAsk() async {
    if (_asked) return;
    // Let the dashboard appear first, so the sheet has context behind it.
    await Future<void>.delayed(const Duration(milliseconds: 700));
    if (!mounted || _asked) return;
    if (ref.read(aiConsentProvider).status != AiConsentStatus.undecided) {
      return;
    }
    _asked = true;
    await showAiConsentSheet(context);
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
