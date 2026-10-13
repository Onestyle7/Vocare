import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/config/env.dart';
import '../../../core/network/api_error.dart';
import '../../../core/network/result.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/buttons.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/glass_widgets.dart';
import '../../../core/widgets/pressable.dart';
import '../../auth/application/session_controller.dart';
import '../data/legal_repository.dart';

final _pendingDocumentsProvider =
    FutureProvider.autoDispose<Result<List<PendingDocument>, ApiError>>(
      (ref) => ref.watch(legalRepositoryProvider).pending(),
    );

/// GDPR hard wall: nothing else is reachable until the current versions of
/// the legal documents are accepted (HTTP 403 `CONSENTS_REQUIRED`).
class ConsentsScreen extends ConsumerStatefulWidget {
  const ConsentsScreen({super.key});

  @override
  ConsumerState<ConsentsScreen> createState() => _ConsentsScreenState();
}

class _ConsentsScreenState extends ConsumerState<ConsentsScreen> {
  bool _accepted = false;
  bool _submitting = false;

  Future<void> _accept(List<PendingDocument> documents) async {
    setState(() => _submitting = true);
    final result = await ref
        .read(legalRepositoryProvider)
        .accept(documents.map((d) => d.id).toList());
    if (!mounted) return;
    switch (result) {
      case Ok(:final value):
        await ref.read(sessionProvider.notifier).consentsAccepted(value);
      case Err(:final error):
        setState(() => _submitting = false);
        showToast(context, error.message, kind: ToastKind.error);
    }
  }

  void _open(PendingDocument doc) {
    final path = doc.contentPath.isNotEmpty
        ? doc.contentPath
        : doc.type.webPath;
    final uri = path.startsWith('http')
        ? Uri.parse(path)
        : Uri.parse('${Env.webBaseUrl}$path');
    launchUrl(uri, mode: LaunchMode.inAppBrowserView);
  }

  @override
  Widget build(BuildContext context) {
    final pending = ref.watch(_pendingDocumentsProvider);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.gutter),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
              const Center(child: VocareLogo(size: 72)),
              const SizedBox(height: 28),
              Text(
                'Zaktualizowaliśmy\nnasze dokumenty',
                style: AppTypography.headline,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                'Aby dalej korzystać z Vocare, zapoznaj się z ich aktualną treścią i zaakceptuj zmiany.',
                style: AppTypography.bodyLight.copyWith(
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              Expanded(
                child: switch (pending) {
                  AsyncData(value: Ok(value: final docs)) => _documents(docs),
                  AsyncData(value: Err(:final error)) => StateMessage(
                    icon: Icons.cloud_off_rounded,
                    title: 'Nie udało się pobrać dokumentów',
                    message: error.message,
                    actionLabel: 'Spróbuj ponownie',
                    onAction: () => ref.invalidate(_pendingDocumentsProvider),
                  ),
                  _ => const Column(
                    children: [
                      SkeletonBox(height: 72),
                      SizedBox(height: 12),
                      SkeletonBox(height: 72),
                    ],
                  ),
                },
              ),
              if (pending case AsyncData(value: Ok(value: final docs))) ...[
                AppCheckbox(
                  value: _accepted,
                  onChanged: (v) => setState(() => _accepted = v),
                  label: const Text(
                    'Oświadczam, że zapoznałem/am się z powyższymi dokumentami i akceptuję ich treść.',
                  ),
                ),
                const SizedBox(height: 16),
                PrimaryButton(
                  label: 'Akceptuję i przechodzę dalej',
                  loading: _submitting,
                  onPressed: _accepted ? () => _accept(docs) : null,
                ),
              ],
              Center(
                child: TextButton(
                  onPressed: () => ref.read(sessionProvider.notifier).signOut(),
                  child: Text(
                    'Wyloguj się',
                    style: AppTypography.caption.copyWith(
                      color: AppColors.textMuted,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  Widget _documents(List<PendingDocument> docs) {
    return ListView.separated(
      itemCount: docs.length,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (context, i) {
        final doc = docs[i];
        return Pressable(
          onTap: () => _open(doc),
          scale: 0.985,
          child: SurfaceCard(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
            child: Row(
              children: [
                const Icon(Icons.description_outlined, color: AppColors.accent),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(doc.type.label, style: AppTypography.button),
                      if (doc.version.isNotEmpty)
                        Text(
                          'Wersja ${doc.version}',
                          style: AppTypography.label,
                        ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.open_in_new_rounded,
                  size: 18,
                  color: AppColors.textSubtle,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
