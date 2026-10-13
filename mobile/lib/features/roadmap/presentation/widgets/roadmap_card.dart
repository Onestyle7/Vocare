import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/app_icon.dart';
import '../../../../core/widgets/glass_widgets.dart';
import '../../../assistant/presentation/widgets/assistant_widgets.dart';
import '../../data/roadmap_models.dart';
import '../../data/roadmap_repository.dart';

final _date = DateFormat('d MMM yyyy', 'pl');

/// One roadmap in the list, with its generation state.
class RoadmapCard extends StatelessWidget {
  const RoadmapCard({
    super.key,
    required this.entry,
    required this.onOpen,
    required this.onRetry,
    required this.onDelete,
    this.busy = false,
  });

  final RoadmapListEntry entry;
  final VoidCallback onOpen;
  final VoidCallback onRetry;
  final VoidCallback onDelete;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    final roadmap = entry.roadmap;
    final status = roadmap.generationStatus;
    final progress = (entry.progress ?? 0).clamp(0, 100).round();

    return SurfaceCard(
      onTap: status == GenerationStatus.ready ? onOpen : null,
      padding: const EdgeInsets.fromLTRB(18, 16, 10, 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.surfaceRaised,
                ),
                child: const OverflowBox(
                  minWidth: 0,
                  minHeight: 0,
                  maxWidth: 62,
                  maxHeight: 62,
                  child: AppIcon(AppIcons.map, size: 52),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      roadmap.displayName,
                      style: AppTypography.titleSmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      [
                        '${roadmap.timeHorizonMonths} mies.',
                        if (roadmap.createdAt != null)
                          _date.format(roadmap.createdAt!),
                      ].join(' · '),
                      style: AppTypography.label,
                    ),
                  ],
                ),
              ),
              _StatusBadge(roadmap: roadmap),
              IconButton(
                tooltip: 'Usuń roadmapę',
                onPressed: busy ? null : onDelete,
                icon: const Icon(
                  Icons.more_vert_rounded,
                  color: AppColors.textSubtle,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: switch (status) {
              GenerationStatus.ready => Column(
                children: [
                  GradientBar(value: progress / 100),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Text('$progress% ukończone', style: AppTypography.label),
                      const Spacer(),
                      Text(
                        'Otwórz',
                        style: AppTypography.label.copyWith(
                          color: AppColors.accent,
                        ),
                      ),
                      const Icon(
                        Icons.chevron_right_rounded,
                        size: 18,
                        color: AppColors.accent,
                      ),
                    ],
                  ),
                ],
              ),
              GenerationStatus.pending || GenerationStatus.generating => Row(
                children: [
                  const SizedBox.square(
                    dimension: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Generujemy Twoją roadmapę — to potrwa chwilę. Możesz wyjść z aplikacji, damy znać w powiadomieniach.',
                      style: AppTypography.label.copyWith(height: 1.45),
                    ),
                  ),
                ],
              ),
              GenerationStatus.failed => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    roadmap.failureReason.isNotEmpty
                        ? roadmap.failureReason
                        : 'Generowanie nie powiodło się — spróbuj ponownie albo usuń roadmapę.',
                    style: AppTypography.label.copyWith(
                      color: AppColors.danger,
                      height: 1.45,
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextButton.icon(
                    onPressed: busy ? null : onRetry,
                    icon: const Icon(Icons.refresh_rounded, size: 18),
                    label: const Text('Spróbuj ponownie'),
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.accent,
                      padding: EdgeInsets.zero,
                    ),
                  ),
                ],
              ),
            },
          ),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.roadmap});

  final RoadmapSummary roadmap;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (roadmap.generationStatus) {
      GenerationStatus.failed => ('Błąd generacji', AppColors.danger),
      GenerationStatus.pending ||
      GenerationStatus.generating => ('Generowanie…', AppColors.warning),
      GenerationStatus.ready => (
        lifecycleLabel(roadmap.status),
        roadmap.status == 'Completed' ? AppColors.success : AppColors.accent,
      ),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: color.withValues(alpha: 0.14),
      ),
      child: Text(
        label,
        style: AppTypography.label.copyWith(fontSize: 11.5, color: color),
      ),
    );
  }
}
