import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_error.dart';
import '../../../core/network/result.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/buttons.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/generating_view.dart';
import '../../../core/widgets/glass_widgets.dart';
import '../../billing/data/billing_repository.dart';
import '../../billing/presentation/service_cost_sheet.dart';
import '../../shell/main_shell.dart';
import '../data/cv_models.dart';
import '../data/cv_repository.dart';
import 'widgets/cv_widgets.dart';
import 'widgets/offer_sheet.dart';

/// "Kreator CV" tab. Unlike the web (desktop-only editing), the full
/// create → edit → export flow works on the phone.
class CvListScreen extends ConsumerStatefulWidget {
  const CvListScreen({super.key});

  @override
  ConsumerState<CvListScreen> createState() => _CvListScreenState();
}

class _CvListScreenState extends ConsumerState<CvListScreen> {
  String? _busyId;
  bool _creating = false;

  CvListController get _controller => ref.read(cvListProvider.notifier);

  Future<void> _create(CvListState state) async {
    final method = await showCreateCvSheet(context, limits: state.limits);
    if (method == null || !mounted) return;

    if (method == CreateCvMethod.forOffer) {
      await _createForOffer();
      return;
    }

    setState(() => _creating = true);
    final result = await _controller.create(
      name: 'Moje CV',
      fromProfile: method == CreateCvMethod.fromProfile,
    );
    if (!mounted) return;
    setState(() => _creating = false);
    switch (result) {
      case Ok(:final value):
        showToast(context, 'Utworzono nowe CV', kind: ToastKind.success);
        context.push(Routes.cvEditor(value.id));
      case Err(:final error):
        showToast(
          context,
          error.type == ApiErrorType.notFound &&
                  method == CreateCvMethod.fromProfile
              ? 'Najpierw uzupełnij profil, żeby przenieść z niego dane.'
              : error.message,
          kind: ToastKind.error,
        );
    }
  }

  Future<void> _createForOffer() async {
    final offer = await showOfferSheet(
      context,
      title: 'CV pod ofertę',
      subtitle:
          'Uzupełnij informacje o stanowisku i wklej opis oferty. Na tej podstawie dopasujemy treść Twojego CV.',
      actionLabel: 'Dalej',
    );
    if (offer == null || !mounted) return;
    final confirmed = await confirmServiceCost(
      context,
      title: 'Wygenerować CV pod ofertę?',
      tokenCost: ServiceCosts.generateCv,
      icon: Icons.auto_awesome_rounded,
    );
    if (!confirmed || !mounted) return;

    final result = await runWithProgress(
      context,
      () => _controller.generateForOffer(
        position: offer.position,
        jobDescription: offer.description,
      ),
      progress: const GeneratingView.cvForOffer(),
    );
    if (!mounted) return;
    switch (result) {
      case Ok(:final value):
        showToast(context, 'Wygenerowano CV', kind: ToastKind.success);
        // Land on the result: the generated document itself.
        context.push(Routes.cvEditor(value.id), extra: true);
      case Err(:final error):
        showToast(context, error.message, kind: ToastKind.error);
    }
  }

  Future<void> _menu(CvListItem cv) async {
    final action = await showGlassSheet<String>(
      context: context,
      builder: (sheet) => Padding(
        padding: const EdgeInsets.fromLTRB(12, 14, 12, 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              cv.name,
              style: AppTypography.titleSmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            ListTile(
              leading: const Icon(
                Icons.edit_outlined,
                color: AppColors.textPrimary,
              ),
              title: Text('Otwórz edytor', style: AppTypography.body),
              onTap: () => Navigator.pop(sheet, 'open'),
            ),
            if (!cv.isDefault)
              ListTile(
                leading: const Icon(
                  Icons.star_outline_rounded,
                  color: AppColors.textPrimary,
                ),
                title: Text('Ustaw jako domyślne', style: AppTypography.body),
                onTap: () => Navigator.pop(sheet, 'default'),
              ),
            ListTile(
              leading: const Icon(
                Icons.delete_outline_rounded,
                color: AppColors.danger,
              ),
              title: Text(
                'Usuń CV',
                style: AppTypography.body.copyWith(color: AppColors.danger),
              ),
              onTap: () => Navigator.pop(sheet, 'delete'),
            ),
          ],
        ),
      ),
    );
    if (!mounted || action == null) return;
    switch (action) {
      case 'open':
        context.push(Routes.cvEditor(cv.id));
      case 'default':
        setState(() => _busyId = cv.id);
        final result = await _controller.setDefault(cv.id);
        if (!mounted) return;
        setState(() => _busyId = null);
        showToast(
          context,
          result.isOk
              ? 'Ustawiono jako domyślne CV'
              : 'Nie udało się ustawić domyślnego CV',
          kind: result.isOk ? ToastKind.success : ToastKind.error,
        );
      case 'delete':
        final confirmed = await confirmAction(
          context,
          title: 'Usunąć CV?',
          message: 'Ta akcja nie może być cofnięta.',
          confirmLabel: 'Tak, chcę usunąć',
          cancelLabel: 'Zachowaj CV',
          destructive: true,
        );
        if (!confirmed || !mounted) return;
        setState(() => _busyId = cv.id);
        final result = await _controller.delete(cv.id);
        if (!mounted) return;
        setState(() => _busyId = null);
        showToast(
          context,
          result.isOk ? 'CV zostało usunięte' : 'Nie udało się usunąć CV',
          kind: result.isOk ? ToastKind.success : ToastKind.error,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final cvs = ref.watch(cvListProvider);

    final Widget body = switch (cvs) {
      AsyncValue(:final value?) when value.items.isEmpty => _EmptyState(
        key: const ValueKey('empty'),
        creating: _creating,
        onCreate: () => _create(value),
      ),
      AsyncValue(:final value?) => Column(
        key: const ValueKey('list'),
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SectionHeader(
            title: 'Twoje CV',
            trailing: value.limits == null
                ? null
                : Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(999),
                      color: AppColors.surfaceRaised,
                    ),
                    child: Text(
                      '${value.limits!.currentCount}/${value.limits!.maxLimit}',
                      style: AppTypography.label.copyWith(fontSize: 12),
                    ),
                  ),
          ),
          for (final cv in value.items) ...[
            CvCard(
              cv: cv,
              busy: _busyId == cv.id,
              onOpen: () => context.push(Routes.cvEditor(cv.id)),
              onMenu: () => _menu(cv),
            ),
            const SizedBox(height: 12),
          ],
          const SizedBox(height: 8),
          OutlinePillButton(
            label: 'Nowe CV',
            loading: _creating,
            leading: const Icon(
              Icons.add_rounded,
              size: 20,
              color: AppColors.textMuted,
            ),
            onPressed: () => _create(value),
          ),
        ],
      ),
      AsyncError(:final error) => StateMessage(
        key: const ValueKey('error'),
        icon: Icons.cloud_off_rounded,
        title: 'Nie udało się wczytać CV',
        message: error is ApiError
            ? error.message
            : 'Spróbuj ponownie za chwilę.',
        actionLabel: 'Spróbuj ponownie',
        onAction: () => ref.invalidate(cvListProvider),
      ),
      _ => const Column(
        key: ValueKey('loading'),
        children: [
          SkeletonBox(height: 100, radius: AppSpacing.cardRadius),
          SizedBox(height: 12),
          SkeletonBox(height: 100, radius: AppSpacing.cardRadius),
        ],
      ),
    };

    return RefreshIndicator.adaptive(
      edgeOffset: shellHeaderExtent(context),
      onRefresh: () => ref.read(cvListProvider.notifier).refresh(),
      child: ListView(
        padding: EdgeInsets.fromLTRB(
          AppSpacing.gutter,
          shellHeaderExtent(context) + 8,
          AppSpacing.gutter,
          shellBottomExtent(context),
        ),
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        children: [
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 350),
            child: body,
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    super.key,
    required this.creating,
    required this.onCreate,
  });

  final bool creating;
  final VoidCallback onCreate;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 210,
          child: Stack(
            alignment: Alignment.center,
            children: [
              const AmbientGlow(size: 160, opacity: 0.5, blur: 60),
              Transform.translate(
                offset: const Offset(-34, 10),
                child: Transform.rotate(
                  angle: -0.16,
                  child: const CvThumbnail(
                    width: 86,
                    accent: AppColors.gradientEnd,
                  ),
                ),
              ),
              Transform.translate(
                offset: const Offset(30, -4),
                child: Transform.rotate(
                  angle: 0.1,
                  child: const CvThumbnail(width: 96),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Twoje pierwsze CV',
          style: AppTypography.headline,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 10),
        Text(
          'Stwórz CV w kilka minut — z profilu, pod konkretną ofertę albo od zera. Pobierzesz je jako PDF prosto z telefonu.',
          style: AppTypography.body.copyWith(color: AppColors.textSecondary),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 28),
        PrimaryButton(
          label: 'Stwórz CV',
          loading: creating,
          onPressed: onCreate,
        ),
      ],
    );
  }
}
