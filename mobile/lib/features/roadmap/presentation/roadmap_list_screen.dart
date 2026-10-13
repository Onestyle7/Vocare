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
import '../../../core/widgets/glass_widgets.dart';
import '../../legal/presentation/ai_consent_sheet.dart';
import '../../shell/main_shell.dart';
import '../data/roadmap_repository.dart';
import 'widgets/create_roadmap_sheet.dart';
import 'widgets/roadmap_card.dart';

/// "Roadmapa" tab (web: /dashboard/roadmap).
class RoadmapListScreen extends ConsumerStatefulWidget {
  const RoadmapListScreen({super.key});

  @override
  ConsumerState<RoadmapListScreen> createState() => _RoadmapListScreenState();
}

class _RoadmapListScreenState extends ConsumerState<RoadmapListScreen> {
  String? _busyId;
  bool _creating = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _consumeIntent());
  }

  /// Another screen asked to create a roadmap for a specific career path.
  Future<void> _consumeIntent() async {
    if (!mounted || ref.read(roadmapCreateIntentProvider) == null) return;
    final list = await ref
        .read(roadmapListProvider.future)
        .catchError((_) => _emptyList);
    final pathId = ref.read(roadmapCreateIntentProvider.notifier).take();
    if (mounted && pathId != null) await _create(list, preselected: pathId);
  }

  static const _emptyList = RoadmapListState(entries: [], limit: 1);

  Future<void> _create(RoadmapListState list, {String? preselected}) async {
    final action = await showCreateRoadmapSheet(
      context,
      list: list,
      preselectedPathId: preselected,
    );
    if (!mounted || action == null) return;
    switch (action) {
      case OpenAssistant():
        context.go(Routes.assistant);
      case OpenExistingRoadmap(:final roadmapId):
        context.push(Routes.roadmapDetails(roadmapId));
      case CreateRoadmap(:final careerPathId, :final months):
        if (!await ensureAiConsent(context) || !mounted) return;
        setState(() => _creating = true);
        final result = await ref
            .read(roadmapListProvider.notifier)
            .generate(careerPathId: careerPathId, months: months);
        if (!mounted) return;
        setState(() => _creating = false);
        switch (result) {
          case Ok():
            showToast(
              context,
              'Rozpoczęto generowanie roadmapy w tle',
              kind: ToastKind.success,
            );
          case Err(:final error):
            showToast(context, error.message, kind: ToastKind.error);
        }
    }
  }

  Future<void> _retry(String id) async {
    setState(() => _busyId = id);
    final result = await ref.read(roadmapListProvider.notifier).retry(id);
    if (!mounted) return;
    setState(() => _busyId = null);
    if (result case Err(:final error)) {
      showToast(context, error.message, kind: ToastKind.error);
    }
  }

  Future<void> _delete(String id) async {
    final confirmed = await confirmAction(
      context,
      title: 'Usunąć roadmapę?',
      message: 'Ta akcja nie może być cofnięta.',
      confirmLabel: 'Tak, chcę usunąć',
      cancelLabel: 'Zachowaj roadmapę',
      destructive: true,
    );
    if (!confirmed || !mounted) return;
    setState(() => _busyId = id);
    final result = await ref.read(roadmapListProvider.notifier).archive(id);
    if (!mounted) return;
    setState(() => _busyId = null);
    switch (result) {
      case Ok():
        showToast(
          context,
          'Roadmapa została usunięta',
          kind: ToastKind.success,
        );
      case Err(:final error):
        showToast(context, error.message, kind: ToastKind.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(roadmapCreateIntentProvider, (_, next) {
      if (next != null) _consumeIntent();
    });
    final roadmaps = ref.watch(roadmapListProvider);

    final Widget body = switch (roadmaps) {
      AsyncValue(:final value?) => _List(
        key: const ValueKey('list'),
        state: value,
        busyId: _busyId,
        creating: _creating,
        onCreate: () {
          if (value.limitReached) {
            showToast(
              context,
              'Osiągnięto limit roadmap dla obecnego planu (${value.usedSlots}/${value.limit}). Usuń roadmapę, aby utworzyć nową.',
            );
            return;
          }
          _create(value);
        },
        onOpen: (id) => context.push(Routes.roadmapDetails(id)),
        onRetry: _retry,
        onDelete: _delete,
      ),
      AsyncError(:final error) => StateMessage(
        key: const ValueKey('error'),
        icon: Icons.cloud_off_rounded,
        title: 'Nie udało się wczytać roadmap',
        message: error is ApiError
            ? error.message
            : 'Spróbuj ponownie za chwilę.',
        actionLabel: 'Spróbuj ponownie',
        onAction: () => ref.invalidate(roadmapListProvider),
      ),
      _ => const Column(
        key: ValueKey('loading'),
        children: [
          SkeletonBox(height: 60, radius: AppSpacing.cardRadius),
          SizedBox(height: 16),
          SkeletonBox(height: 150, radius: AppSpacing.cardRadius),
        ],
      ),
    };

    return RefreshIndicator.adaptive(
      edgeOffset: shellHeaderExtent(context),
      onRefresh: () => ref.read(roadmapListProvider.notifier).refresh(),
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

class _List extends StatelessWidget {
  const _List({
    super.key,
    required this.state,
    required this.busyId,
    required this.creating,
    required this.onCreate,
    required this.onOpen,
    required this.onRetry,
    required this.onDelete,
  });

  final RoadmapListState state;
  final String? busyId;
  final bool creating;
  final VoidCallback onCreate;
  final ValueChanged<String> onOpen;
  final ValueChanged<String> onRetry;
  final ValueChanged<String> onDelete;

  @override
  Widget build(BuildContext context) {
    if (state.entries.isEmpty) {
      return Column(
        children: [
          SizedBox(
            height: 190,
            child: Stack(
              alignment: Alignment.center,
              children: [
                const AmbientGlow(size: 150, opacity: 0.5, blur: 55),
                Container(
                  width: 104,
                  height: 104,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.surfaceRaised,
                    border: Border.all(color: AppColors.hairline),
                  ),
                  child: const Icon(
                    Icons.map_outlined,
                    size: 42,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Brak aktywnych roadmap',
            style: AppTypography.headline,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 10),
          Text(
            'Zamień wybraną ścieżkę kariery w plan krok po kroku na 3–24 miesiące.',
            style: AppTypography.body.copyWith(color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 28),
          PrimaryButton(
            label: 'Utwórz roadmapę',
            loading: creating,
            onPressed: onCreate,
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionHeader(
          title: 'Twoje roadmapy',
          trailing: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(999),
              color: AppColors.surfaceRaised,
            ),
            child: Text(
              '${state.usedSlots}/${state.limit}',
              style: AppTypography.label.copyWith(fontSize: 12),
            ),
          ),
        ),
        for (final entry in state.entries) ...[
          RoadmapCard(
            entry: entry,
            busy: busyId == entry.roadmap.id,
            onOpen: () => onOpen(entry.roadmap.id),
            onRetry: () => onRetry(entry.roadmap.id),
            onDelete: () => onDelete(entry.roadmap.id),
          ),
          const SizedBox(height: 12),
        ],
        const SizedBox(height: 8),
        OutlinePillButton(
          label: 'Nowa roadmapa',
          loading: creating,
          leading: const Icon(
            Icons.add_rounded,
            size: 20,
            color: AppColors.textMuted,
          ),
          onPressed: onCreate,
        ),
      ],
    );
  }
}
