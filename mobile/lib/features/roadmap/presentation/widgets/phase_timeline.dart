import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/glass_widgets.dart';
import '../../../../core/widgets/pressable.dart';
import '../../../assistant/presentation/widgets/assistant_widgets.dart';
import '../../data/roadmap_models.dart';
import 'step_graph.dart';

/// Status colours: neutral → amber → green, as on the web node sheet.
Color stepStatusColor(StepStatus status) => switch (status) {
  StepStatus.notStarted => AppColors.textSubtle,
  StepStatus.inProgress => AppColors.warning,
  StepStatus.completed => AppColors.success,
};

String monthsLabel(int start, int end) {
  if (start <= 0 && end <= 0) return '';
  if (start == end) return 'Miesiąc $start';
  return 'Miesiące $start–$end';
}

/// One phase: header with progress and a vertical journey of its steps —
/// the mobile take on the web React Flow canvas.
class PhaseSection extends StatelessWidget {
  const PhaseSection({
    super.key,
    required this.phase,
    required this.index,
    required this.graph,
    required this.metrics,
    required this.onStepTap,
    required this.onMenu,
  });

  final RoadmapPhase phase;
  final int index;

  /// Built by the screen for all phases at once: one shared lane width keeps
  /// the step text aligned from phase to phase.
  final StepGraph graph;
  final GraphMetrics metrics;
  final ValueChanged<RoadmapStep> onStepTap;
  final VoidCallback onMenu;

  @override
  Widget build(BuildContext context) {
    final months = monthsLabel(phase.startMonth, phase.endMonth);
    final total = phase.steps.length;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SurfaceCard(
          padding: const EdgeInsets.fromLTRB(18, 14, 6, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    [
                      'Faza ${index + 1}',
                      if (months.isNotEmpty) months,
                    ].join(' · '),
                    style: AppTypography.label.copyWith(
                      color: AppColors.accent,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    tooltip: 'Opcje fazy',
                    visualDensity: VisualDensity.compact,
                    onPressed: onMenu,
                    icon: const Icon(
                      Icons.more_horiz_rounded,
                      color: AppColors.textSubtle,
                    ),
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Text(phase.title, style: AppTypography.titleSmall),
              ),
              if (total > 0) ...[
                const SizedBox(height: 10),
                Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: Row(
                    children: [
                      Expanded(
                        child: GradientBar(
                          value: phase.completedCount / total,
                          height: 5,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        '${phase.completedCount}/$total',
                        style: AppTypography.label,
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 6),
        if (phase.steps.isEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
            child: Text(
              'Ta faza nie ma jeszcze żadnych kroków.',
              style: AppTypography.label,
            ),
          ),
        for (final row in graph.rows)
          _StepRow(
            row: row,
            metrics: metrics,
            onTap: () => onStepTap(row.step),
          ),
      ],
    );
  }
}

class _StepRow extends StatelessWidget {
  const _StepRow({
    required this.row,
    required this.metrics,
    required this.onTap,
  });

  final GraphRow row;
  final GraphMetrics metrics;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final step = row.step;
    final color = stepStatusColor(step.status);
    final content = Padding(
      padding: const EdgeInsets.fromLTRB(0, 10, 8, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            step.title,
            style: AppTypography.button.copyWith(
              height: 1.35,
              color: step.status == StepStatus.completed
                  ? AppColors.textMuted
                  : AppColors.textPrimary,
              decoration: step.status == StepStatus.completed
                  ? TextDecoration.lineThrough
                  : null,
              decorationColor: AppColors.textSubtle,
            ),
          ),
          if (row.externalParent case final parent?)
            Text(
              parent,
              style: AppTypography.label.copyWith(
                fontSize: 12,
                color: laneColor(row.lane),
              ),
            ),
          if (step.subtitle.isNotEmpty)
            Text(
              step.subtitle,
              style: AppTypography.label.copyWith(height: 1.45),
            ),
          if (!step.required ||
              step.status != StepStatus.notStarted ||
              step.topics.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                if (step.status != StepStatus.notStarted)
                  _Tag(step.status.label, color: color),
                if (!step.required) const _Tag('Opcjonalny'),
                for (final topic in step.topics.take(3)) _Tag(topic),
                if (step.topics.length > 3) _Tag('+${step.topics.length - 3}'),
              ],
            ),
          ],
        ],
      ),
    );

    // The row never scales as a whole — that would pull its graph segment
    // away from the neighbours. The text presses in; the node leans towards
    // the finger and the lane line bends into it, staying attached.
    return Pressable.builder(
      onTap: onTap,
      semanticLabel: '${step.title}, ${step.status.label}',
      builder: (context, pressed) => IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TweenAnimationBuilder<double>(
              tween: Tween(end: pressed ? 1 : 0),
              duration: Duration(milliseconds: pressed ? 120 : 380),
              curve: pressed ? Curves.easeOut : Curves.easeOutBack,
              builder: (context, press, _) => CustomPaint(
                painter: GraphRowPainter(
                  row: row,
                  metrics: metrics,
                  press: press,
                ),
                child: SizedBox(width: metrics.width),
              ),
            ),
            Expanded(
              child: AnimatedScale(
                scale: pressed ? 0.985 : 1,
                alignment: Alignment.centerLeft,
                duration: Duration(milliseconds: pressed ? 90 : 220),
                curve: pressed ? Curves.easeOut : Curves.easeOutBack,
                child: content,
              ),
            ),
            const Padding(
              padding: EdgeInsets.only(top: 14, right: 4),
              child: Icon(
                Icons.chevron_right_rounded,
                size: 20,
                color: AppColors.textSubtle,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  const _Tag(this.text, {this.color});

  final String text;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: color?.withValues(alpha: 0.14) ?? AppColors.surface,
        border: Border.all(
          color: color?.withValues(alpha: 0.3) ?? AppColors.hairline,
        ),
      ),
      child: Text(
        text,
        style: AppTypography.label.copyWith(
          fontSize: 11.5,
          color: color ?? AppColors.textMuted,
        ),
      ),
    );
  }
}
