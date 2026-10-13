import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/buttons.dart';
import '../../../../core/widgets/glass_widgets.dart';
import '../../../../core/widgets/pressable.dart';
import '../../../assistant/data/assistant_models.dart';
import '../../../assistant/data/assistant_repository.dart';
import '../../data/roadmap_repository.dart';

/// What the create sheet asks the caller to do.
sealed class CreateRoadmapAction {
  const CreateRoadmapAction();
}

class CreateRoadmap extends CreateRoadmapAction {
  const CreateRoadmap(this.careerPathId, this.months);
  final String careerPathId;
  final int months;
}

class OpenExistingRoadmap extends CreateRoadmapAction {
  const OpenExistingRoadmap(this.roadmapId);
  final String roadmapId;
}

class OpenAssistant extends CreateRoadmapAction {
  const OpenAssistant();
}

/// "Utwórz roadmapę": career path from the latest recommendation + horizon.
Future<CreateRoadmapAction?> showCreateRoadmapSheet(
  BuildContext context, {
  required RoadmapListState list,
  String? preselectedPathId,
}) {
  return showGlassSheet<CreateRoadmapAction>(
    context: context,
    builder: (_) =>
        _CreateRoadmapSheet(list: list, preselectedPathId: preselectedPathId),
  );
}

class _CreateRoadmapSheet extends ConsumerStatefulWidget {
  const _CreateRoadmapSheet({required this.list, this.preselectedPathId});

  final RoadmapListState list;
  final String? preselectedPathId;

  @override
  ConsumerState<_CreateRoadmapSheet> createState() =>
      _CreateRoadmapSheetState();
}

class _CreateRoadmapSheetState extends ConsumerState<_CreateRoadmapSheet> {
  late String? _pathId = widget.preselectedPathId;
  int _months = 9;

  @override
  Widget build(BuildContext context) {
    final assistant = ref.watch(assistantProvider);
    final paths =
        assistant.value?.recommendation?.careerPaths ?? const <CareerPath>[];
    CareerPath? selected;
    for (final p in paths) {
      if (p.id == _pathId) selected = p;
    }
    final existing = selected == null
        ? null
        : widget.list.existingFor(selected.name);
    final limitReached = widget.list.limitReached;
    final canCreate = selected != null && existing == null && !limitReached;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Utwórz roadmapę',
            style: AppTypography.title,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            'Wybierz ścieżkę kariery i horyzont czasowy.',
            style: AppTypography.caption.copyWith(color: AppColors.textMuted),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 18),
          Flexible(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _Label('Ścieżka kariery'),
                  if (assistant.isLoading && !assistant.hasValue)
                    const Padding(
                      padding: EdgeInsets.all(20),
                      child: Center(
                        child: CircularProgressIndicator.adaptive(),
                      ),
                    )
                  else if (paths.isEmpty)
                    _NoPaths(
                      onOpenAssistant: () =>
                          Navigator.pop(context, const OpenAssistant()),
                    )
                  else
                    for (final path in paths)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: _PathOption(
                          path: path,
                          selected: path.id == _pathId,
                          onTap: () => setState(() => _pathId = path.id),
                        ),
                      ),
                  const SizedBox(height: 14),
                  _Label('Horyzont czasowy'),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final months in roadmapHorizons)
                        ChoiceChip(
                          label: Text('$months mies.'),
                          selected: months == _months,
                          onSelected: (_) => setState(() => _months = months),
                          showCheckmark: false,
                          labelStyle: AppTypography.caption.copyWith(
                            height: 1.2,
                            color: months == _months
                                ? Colors.white
                                : AppColors.textMuted,
                          ),
                          backgroundColor: AppColors.surface,
                          selectedColor: AppColors.gradientMid.withValues(
                            alpha: 0.45,
                          ),
                          side: BorderSide(
                            color: months == _months
                                ? AppColors.gradientSoft
                                : AppColors.hairline,
                          ),
                          shape: const StadiumBorder(),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (limitReached)
                    _Note(
                      color: AppColors.warning,
                      text:
                          'Osiągnięto limit roadmap dla obecnego planu (${widget.list.usedSlots}/${widget.list.limit}). Usuń roadmapę, aby utworzyć nową.',
                    )
                  else if (existing != null)
                    _Note(
                      color: AppColors.accent,
                      text:
                          'Masz już roadmapę dla tej ścieżki. Otwórz istniejącą roadmapę zamiast tworzyć duplikat.',
                    )
                  else
                    const _Note(
                      color: AppColors.textMuted,
                      text:
                          'Ta akcja nie wykorzysta żadnych tokenów. Roadmapa wygeneruje się w tle.',
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          if (existing != null && !limitReached)
            PrimaryButton(
              label: 'Otwórz istniejącą roadmapę',
              onPressed: () =>
                  Navigator.pop(context, OpenExistingRoadmap(existing.id)),
            )
          else
            PrimaryButton(
              label: 'Stwórz roadmapę',
              onPressed: canCreate
                  ? () => Navigator.pop(
                      context,
                      CreateRoadmap(selected!.id, _months),
                    )
                  : null,
            ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Anuluj', style: AppTypography.caption),
          ),
        ],
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(text, style: AppTypography.label),
    );
  }
}

class _PathOption extends StatelessWidget {
  const _PathOption({
    required this.path,
    required this.selected,
    required this.onTap,
  });

  final CareerPath path;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: onTap,
      scale: 0.985,
      semanticLabel: path.name,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppColors.gradientSoft : AppColors.hairline,
            width: selected ? 1.4 : 1,
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    path.name,
                    style: AppTypography.button.copyWith(height: 1.35),
                  ),
                  if (path.description.isNotEmpty)
                    Text(
                      path.description,
                      style: AppTypography.label.copyWith(fontSize: 12),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: selected ? AppColors.brandGradient : null,
                border: selected ? null : Border.all(color: AppColors.outline),
              ),
              child: selected
                  ? const Icon(
                      Icons.check_rounded,
                      size: 15,
                      color: Colors.white,
                    )
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}

class _NoPaths extends StatelessWidget {
  const _NoPaths({required this.onOpenAssistant});

  final VoidCallback onOpenAssistant;

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      child: Column(
        children: [
          Text('Brak ścieżek kariery do wyboru.', style: AppTypography.button),
          const SizedBox(height: 6),
          Text(
            'Najpierw wygeneruj rekomendacje w asystencie, żeby mieć z czego utworzyć roadmapę.',
            style: AppTypography.label.copyWith(height: 1.5),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          OutlinePillButton(
            label: 'Przejdź do asystenta',
            onPressed: onOpenAssistant,
          ),
        ],
      ),
    );
  }
}

class _Note extends StatelessWidget {
  const _Note({required this.color, required this.text});

  final Color color;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: color.withValues(alpha: 0.08),
        border: Border.all(color: color.withValues(alpha: 0.22)),
      ),
      child: Text(
        text,
        style: AppTypography.label.copyWith(
          color: color == AppColors.textMuted ? null : color,
          height: 1.5,
        ),
      ),
    );
  }
}
