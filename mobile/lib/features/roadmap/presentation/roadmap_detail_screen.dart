import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_error.dart';
import '../../../core/network/result.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/buttons.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/generating_view.dart';
import '../../../core/widgets/glass_widgets.dart';
import '../../dashboard/presentation/widgets/progress_painters.dart';
import '../data/roadmap_models.dart';
import '../data/roadmap_repository.dart';
import 'widgets/phase_timeline.dart';
import 'widgets/step_graph.dart';
import 'widgets/step_sheet.dart';

/// A roadmap as a vertical journey of phases and steps (web: React Flow canvas).
class RoadmapDetailScreen extends ConsumerWidget {
  const RoadmapDetailScreen({super.key, required this.roadmapId});

  final String roadmapId;

  Future<void> _deleteRoadmap(BuildContext context, WidgetRef ref) async {
    final confirmed = await confirmAction(
      context,
      title: 'Usunąć roadmapę?',
      message: 'Ta akcja nie może być cofnięta.',
      confirmLabel: 'Tak, chcę usunąć',
      cancelLabel: 'Zachowaj roadmapę',
      destructive: true,
    );
    if (!confirmed || !context.mounted) return;
    final result = await ref
        .read(roadmapListProvider.notifier)
        .archive(roadmapId);
    if (!context.mounted) return;
    switch (result) {
      case Ok():
        showToast(
          context,
          'Roadmapa została usunięta',
          kind: ToastKind.success,
        );
        context.popOrGo('/roadmap');
      case Err(:final error):
        showToast(context, error.message, kind: ToastKind.error);
    }
  }

  Future<void> _phaseMenu(
    BuildContext context,
    WidgetRef ref,
    RoadmapPhase phase,
  ) async {
    final choice = await showGlassSheet<String>(
      context: context,
      builder: (sheet) => Padding(
        padding: const EdgeInsets.fromLTRB(12, 14, 12, 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              phase.title,
              style: AppTypography.titleSmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            ListTile(
              leading: const Icon(
                Icons.edit_outlined,
                color: AppColors.textPrimary,
              ),
              title: Text('Zmień nazwę fazy', style: AppTypography.body),
              onTap: () => Navigator.pop(sheet, 'rename'),
            ),
            ListTile(
              leading: const Icon(
                Icons.delete_outline_rounded,
                color: AppColors.danger,
              ),
              title: Text(
                'Usuń fazę',
                style: AppTypography.body.copyWith(color: AppColors.danger),
              ),
              onTap: () => Navigator.pop(sheet, 'delete'),
            ),
          ],
        ),
      ),
    );
    if (!context.mounted || choice == null) return;
    final controller = ref.read(roadmapDetailsProvider(roadmapId).notifier);

    if (choice == 'rename') {
      final name = await _askPhaseName(context, phase.title);
      if (name == null || name == phase.title || !context.mounted) return;
      final result = await controller.renamePhase(phase.id, name);
      if (!context.mounted) return;
      showToast(
        context,
        result.isOk
            ? 'Nazwa fazy została zaktualizowana'
            : 'Nie udało się zapisać nazwy fazy',
        kind: result.isOk ? ToastKind.success : ToastKind.error,
      );
    } else {
      final confirmed = await confirmAction(
        context,
        title: 'Usunąć fazę?',
        message:
            'Usuniesz też wszystkie jej kroki. Ta akcja nie może być cofnięta.',
        confirmLabel: 'Tak, chcę usunąć',
        cancelLabel: 'Zachowaj fazę',
        destructive: true,
      );
      if (!confirmed || !context.mounted) return;
      final result = await controller.deletePhase(phase.id);
      if (!context.mounted) return;
      showToast(
        context,
        result.isOk ? 'Faza została usunięta' : 'Nie udało się usunąć fazy',
        kind: result.isOk ? ToastKind.success : ToastKind.error,
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final details = ref.watch(roadmapDetailsProvider(roadmapId));
    final top = MediaQuery.paddingOf(context).top;
    final bottom = MediaQuery.paddingOf(context).bottom;

    final Widget body = switch (details) {
      AsyncValue(:final value?) when value.generationStatus.inProgress =>
        const Padding(
          padding: EdgeInsets.only(top: 24),
          child: GeneratingView(
            title: 'Tworzę Twoją roadmapę',
            subtitle:
                'Generowanie trwa w tle - damy znać w powiadomieniach, gdy plan będzie gotowy.',
            stepInterval: Duration(seconds: 9),
            steps: [
              'Analizuję wybraną ścieżkę kariery',
              'Dzielę cel na fazy',
              'Dobieram kroki i zagadnienia',
              'Układam plan w czasie',
            ],
          ),
        ),
      AsyncValue(:final value?)
          when value.generationStatus == GenerationStatus.failed =>
        StateMessage(
          icon: Icons.error_outline_rounded,
          title: 'Nie udało się wygenerować roadmapy',
          message: value.failureReason.isNotEmpty
              ? value.failureReason
              : 'Spróbuj ponownie - to zwykle chwilowy problem z usługą AI.',
          actionLabel: 'Spróbuj ponownie',
          onAction: () async {
            final result = await ref
                .read(roadmapDetailsProvider(roadmapId).notifier)
                .retry();
            if (result case Err(:final error) when context.mounted) {
              showToast(context, error.message, kind: ToastKind.error);
            }
          },
        ),
      AsyncValue(:final value?) => _Journey(
        details: value,
        onStepTap: (step) =>
            showStepSheet(context, roadmapId: roadmapId, stepId: step.id),
        onPhaseMenu: (phase) => _phaseMenu(context, ref, phase),
      ),
      AsyncError(:final error) => StateMessage(
        icon: Icons.cloud_off_rounded,
        title: 'Nie udało się pobrać roadmapy',
        message: error is ApiError
            ? error.message
            : 'Spróbuj ponownie za chwilę.',
        actionLabel: 'Odśwież',
        onAction: () => ref.invalidate(roadmapDetailsProvider(roadmapId)),
      ),
      _ => const Padding(
        padding: EdgeInsets.only(top: 80),
        child: Center(child: CircularProgressIndicator.adaptive()),
      ),
    };

    return Scaffold(
      body: Stack(
        children: [
          RefreshIndicator.adaptive(
            edgeOffset: top + AppSpacing.navButton + 16,
            onRefresh: () =>
                ref.read(roadmapDetailsProvider(roadmapId).notifier).refresh(),
            child: ListView(
              padding: EdgeInsets.fromLTRB(
                AppSpacing.gutter,
                top + AppSpacing.navButton + 24,
                AppSpacing.gutter,
                bottom + 32,
              ),
              physics: const AlwaysScrollableScrollPhysics(
                parent: BouncingScrollPhysics(),
              ),
              children: [body],
            ),
          ),
          TopScrollFade(height: top + AppSpacing.navButton + 36),
          Positioned(
            top: top + 8,
            left: AppSpacing.gutter,
            right: AppSpacing.gutter,
            child: Row(
              children: [
                const GlassBackButton(),
                const Spacer(),
                GlassIconButton(
                  size: AppSpacing.navButton,
                  semanticLabel: 'Usuń roadmapę',
                  onPressed: () => _deleteRoadmap(context, ref),
                  child: const Icon(
                    Icons.delete_outline_rounded,
                    size: 22,
                    color: AppColors.textPrimary,
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

Future<String?> _askPhaseName(BuildContext context, String current) {
  return showGlassSheet<String>(
    context: context,
    builder: (_) => _RenameSheet(initial: current),
  );
}

class _RenameSheet extends StatefulWidget {
  const _RenameSheet({required this.initial});

  final String initial;

  @override
  State<_RenameSheet> createState() => _RenameSheetState();
}

class _RenameSheetState extends State<_RenameSheet> {
  late final _controller = TextEditingController(text: widget.initial);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _save() {
    final name = _controller.text.trim();
    if (name.isNotEmpty) Navigator.pop(context, name);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Nazwa fazy',
            style: AppTypography.title,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          AppTextField(
            controller: _controller,
            hint: 'Nazwa fazy',
            textCapitalization: TextCapitalization.sentences,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _save(),
          ),
          const SizedBox(height: 16),
          PrimaryButton(label: 'Zapisz', onPressed: _save),
        ],
      ),
    );
  }
}

class _Journey extends StatelessWidget {
  const _Journey({
    required this.details,
    required this.onStepTap,
    required this.onPhaseMenu,
  });

  final RoadmapDetails details;
  final ValueChanged<RoadmapStep> onStepTap;
  final ValueChanged<RoadmapPhase> onPhaseMenu;

  @override
  Widget build(BuildContext context) {
    final progress = details.progress.clamp(0, 100).round();
    final links = crossPhaseLinks(details.phases);
    final graphs = [
      for (final phase in details.phases)
        StepGraph.layout(
          phase.steps,
          externalParents: links.parents,
          externalChildren: links.children,
        ),
    ];
    final metrics = GraphMetrics(
      graphs.fold(1, (lanes, g) => math.max(lanes, g.laneCount)),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Roadmapa', style: AppTypography.label),
        const SizedBox(height: 4),
        Text(details.displayName, style: AppTypography.headline),
        const SizedBox(height: 16),
        SurfaceCard(
          padding: const EdgeInsets.all(18),
          child: Row(
            children: [
              RingProgress(
                value: progress / 100,
                size: 84,
                stroke: 9,
                child: Text('$progress%', style: AppTypography.button),
              ),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Cel osiągniesz w ciągu ${details.timeHorizonMonths} mies.',
                      style: AppTypography.button.copyWith(height: 1.4),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${details.completedCount} z ${details.stepCount} kroków ukończonych · ${details.phases.length} faz',
                      style: AppTypography.label.copyWith(height: 1.45),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        if (details.phases.isEmpty)
          const StateMessage(
            icon: Icons.layers_clear_outlined,
            title: 'Roadmapa jest pusta',
            message: 'Ta roadmapa nie ma jeszcze żadnych faz.',
          ),
        for (var i = 0; i < details.phases.length; i++) ...[
          PhaseSection(
            phase: details.phases[i],
            index: i,
            graph: graphs[i],
            metrics: metrics,
            onStepTap: onStepTap,
            onMenu: () => onPhaseMenu(details.phases[i]),
          ),
          const SizedBox(height: 20),
        ],
      ],
    );
  }
}
