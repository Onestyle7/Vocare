import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/result.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/feedback.dart';
import '../../../../core/widgets/glass_widgets.dart';
import '../../../../core/widgets/pressable.dart';
import '../../data/roadmap_models.dart';
import '../../data/roadmap_repository.dart';
import 'phase_timeline.dart';

/// Step details with the status switcher (web: `RoadmapNodeDetailsSheet`).
Future<void> showStepSheet(
  BuildContext context, {
  required String roadmapId,
  required String stepId,
}) {
  return showGlassSheet<void>(
    context: context,
    builder: (_) => _StepSheet(roadmapId: roadmapId, stepId: stepId),
  );
}

class _StepSheet extends ConsumerWidget {
  const _StepSheet({required this.roadmapId, required this.stepId});

  final String roadmapId;
  final String stepId;

  Future<void> _setStatus(
    BuildContext context,
    WidgetRef ref,
    StepStatus status,
  ) async {
    HapticFeedback.selectionClick();
    final result = await ref
        .read(roadmapDetailsProvider(roadmapId).notifier)
        .setStepStatus(stepId, status);
    if (result case Err(:final error) when context.mounted) {
      showToast(context, error.message, kind: ToastKind.error);
    }
  }

  Future<void> _delete(BuildContext context, WidgetRef ref) async {
    final confirmed = await confirmAction(
      context,
      title: 'Usunąć krok?',
      message: 'Ta akcja nie może być cofnięta.',
      confirmLabel: 'Tak, chcę usunąć',
      cancelLabel: 'Zachowaj krok',
      destructive: true,
    );
    if (!confirmed || !context.mounted) return;
    final result = await ref
        .read(roadmapDetailsProvider(roadmapId).notifier)
        .deleteStep(stepId);
    if (!context.mounted) return;
    switch (result) {
      case Ok():
        Navigator.pop(context);
        showToast(context, 'Krok został usunięty', kind: ToastKind.success);
      case Err():
        showToast(context, 'Nie udało się usunąć kroku', kind: ToastKind.error);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final details = ref.watch(roadmapDetailsProvider(roadmapId)).value;
    RoadmapPhase? phase;
    RoadmapStep? step;
    for (final p in details?.phases ?? const <RoadmapPhase>[]) {
      for (final s in p.steps) {
        if (s.id == stepId) {
          phase = p;
          step = s;
        }
      }
    }
    if (step == null || phase == null) return const SizedBox(height: 120);

    final months = monthsLabel(phase.startMonth, phase.endMonth);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Flexible(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    [phase.title, if (months.isNotEmpty) months].join(' · '),
                    style: AppTypography.label.copyWith(
                      color: AppColors.accent,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(step.title, style: AppTypography.title),
                  if (step.subtitle.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      step.subtitle,
                      style: AppTypography.caption.copyWith(
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  _TypeBadge(required: step.required),
                  const SizedBox(height: 20),
                  Text('Status', style: AppTypography.label),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      for (final status in StepStatus.values) ...[
                        if (status != StepStatus.notStarted)
                          const SizedBox(width: 8),
                        Expanded(
                          child: _StatusOption(
                            status: status,
                            selected: step.status == status,
                            onTap: () => _setStatus(context, ref, status),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 22),
                  Text('Opis', style: AppTypography.titleSmall),
                  const SizedBox(height: 6),
                  Text(
                    step.description.isEmpty
                        ? 'Ten krok nie ma jeszcze dodatkowego opisu.'
                        : step.description,
                    style: AppTypography.caption.copyWith(
                      color: AppColors.textMuted,
                      height: 1.6,
                    ),
                  ),
                  if (step.topics.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    Text('Zagadnienia', style: AppTypography.titleSmall),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        for (final topic in step.topics)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 5,
                            ),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(999),
                              color: AppColors.surface,
                              border: Border.all(color: AppColors.hairline),
                            ),
                            child: Text(
                              topic,
                              style: AppTypography.label.copyWith(
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => _delete(context, ref),
            child: Text(
              'Usuń krok',
              style: AppTypography.caption.copyWith(color: AppColors.danger),
            ),
          ),
        ],
      ),
    );
  }
}

class _TypeBadge extends StatelessWidget {
  const _TypeBadge({required this.required});

  final bool required;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: AppColors.surface,
        border: Border.all(color: AppColors.hairline),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: required ? AppColors.textPrimary : null,
              border: required ? null : Border.all(color: AppColors.outline),
            ),
          ),
          const SizedBox(width: 6),
          Text(
            required ? 'Wymagany' : 'Opcjonalny',
            style: AppTypography.label.copyWith(
              fontSize: 12,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusOption extends StatelessWidget {
  const _StatusOption({
    required this.status,
    required this.selected,
    required this.onTap,
  });

  final StepStatus status;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = stepStatusColor(status);
    return Pressable(
      onTap: selected ? null : onTap,
      semanticLabel: status.label,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        height: 46,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: selected ? color.withValues(alpha: 0.18) : AppColors.surface,
          border: Border.all(
            color: selected ? color.withValues(alpha: 0.6) : AppColors.hairline,
          ),
        ),
        child: Text(
          status.label,
          style: AppTypography.label.copyWith(
            fontSize: 12.5,
            color: selected
                ? (status == StepStatus.notStarted
                      ? AppColors.textPrimary
                      : color)
                : AppColors.textMuted,
            fontWeight: selected ? FontWeight.w500 : FontWeight.w400,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
