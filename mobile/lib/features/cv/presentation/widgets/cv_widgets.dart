import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/glass_widgets.dart';
import '../../../../core/widgets/pressable.dart';
import '../../data/cv_models.dart';

final _edited = DateFormat("d MMM, HH:mm", 'pl');

/// A tiny A4 sheet — the CV glyph used on cards and empty states.
class CvThumbnail extends StatelessWidget {
  const CvThumbnail({
    super.key,
    this.width = 44,
    this.accent = AppColors.gradientMid,
  });

  final double width;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    final height = width * 1.414;
    final unit = width / 44;
    Widget line(
      double w, {
      Color color = const Color(0xFFD9DCE3),
      double h = 2.2,
    }) => Container(
      width: w * unit,
      height: h * unit,
      margin: EdgeInsets.only(bottom: 3 * unit),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(2),
      ),
    );
    return Container(
      width: width,
      height: height,
      padding: EdgeInsets.fromLTRB(6 * unit, 7 * unit, 6 * unit, 6 * unit),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(5 * unit),
        boxShadow: const [
          BoxShadow(
            color: Color(0x40000000),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          line(20, color: const Color(0xFF1F2937), h: 3.2),
          line(14, color: accent),
          SizedBox(height: 2 * unit),
          line(32),
          line(28),
          line(30),
          SizedBox(height: 2 * unit),
          line(12, color: accent),
          line(31),
          line(26),
        ],
      ),
    );
  }
}

class CvCard extends StatelessWidget {
  const CvCard({
    super.key,
    required this.cv,
    required this.onOpen,
    required this.onMenu,
    this.busy = false,
  });

  final CvListItem cv;
  final VoidCallback onOpen;
  final VoidCallback onMenu;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      onTap: onOpen,
      padding: const EdgeInsets.fromLTRB(16, 16, 6, 16),
      child: Row(
        children: [
          const CvThumbnail(),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        cv.name.isEmpty ? 'Moje CV' : cv.name,
                        style: AppTypography.titleSmall,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (cv.isDefault) ...[
                      const SizedBox(width: 8),
                      const _DefaultBadge(),
                    ],
                  ],
                ),
                Text(
                  cv.targetPosition.isEmpty
                      ? 'Nie określono stanowiska docelowego'
                      : cv.targetPosition,
                  style: AppTypography.label.copyWith(
                    color: cv.targetPosition.isEmpty
                        ? AppColors.textSubtle
                        : AppColors.textMuted,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (cv.lastModifiedAt != null)
                  Text(
                    'Edytowano ${_edited.format(cv.lastModifiedAt!)}',
                    style: AppTypography.label.copyWith(fontSize: 11.5),
                  ),
              ],
            ),
          ),
          busy
              ? const Padding(
                  padding: EdgeInsets.all(14),
                  child: SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                )
              : IconButton(
                  tooltip: 'Opcje CV',
                  onPressed: onMenu,
                  icon: const Icon(
                    Icons.more_vert_rounded,
                    color: AppColors.textSubtle,
                  ),
                ),
        ],
      ),
    );
  }
}

class _DefaultBadge extends StatelessWidget {
  const _DefaultBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: AppColors.gradientSoft.withValues(alpha: 0.16),
      ),
      child: Text(
        'Domyślne',
        style: AppTypography.label.copyWith(
          fontSize: 11,
          color: AppColors.accent,
        ),
      ),
    );
  }
}

enum CreateCvMethod { fromProfile, forOffer, blank }

/// "Jak chcesz utworzyć CV?" — the web chooser plus a free "from profile" path.
Future<CreateCvMethod?> showCreateCvSheet(
  BuildContext context, {
  required CvLimits? limits,
}) {
  return showGlassSheet<CreateCvMethod>(
    context: context,
    builder: (sheet) {
      final blocked = limits != null && !limits.canCreateNew;
      return Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Jak chcesz utworzyć CV?',
              style: AppTypography.title,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              'Wybierz sposób, w jaki chcesz rozpocząć tworzenie swojego CV.',
              style: AppTypography.caption.copyWith(
                color: AppColors.textMuted,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 18),
            if (blocked) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  color: AppColors.warning.withValues(alpha: 0.08),
                  border: Border.all(
                    color: AppColors.warning.withValues(alpha: 0.25),
                  ),
                ),
                child: Text(
                  'Osiągnąłeś limit CV dla swojego planu (${limits.currentCount}/${limits.maxLimit}). '
                  'Usuń nieaktualne CV, aby utworzyć nowe.',
                  style: AppTypography.label.copyWith(
                    color: AppColors.warning,
                    height: 1.5,
                  ),
                ),
              ),
              const SizedBox(height: 14),
            ],
            _MethodTile(
              icon: Icons.person_outline_rounded,
              title: 'Z mojego profilu',
              subtitle:
                  'Przeniesiemy dane z profilu Vocare. Bezpłatnie i od razu.',
              badge: 'Szybko',
              enabled: !blocked,
              onTap: () => Navigator.pop(sheet, CreateCvMethod.fromProfile),
            ),
            const SizedBox(height: 10),
            _MethodTile(
              icon: Icons.auto_awesome_rounded,
              title: 'Pod konkretną ofertę',
              subtitle:
                  'AI napisze CV pod wklejone ogłoszenie na podstawie Twojego profilu.',
              badge: 'AI',
              enabled: !blocked,
              onTap: () => Navigator.pop(sheet, CreateCvMethod.forOffer),
            ),
            const SizedBox(height: 10),
            _MethodTile(
              icon: Icons.note_add_outlined,
              title: 'Puste CV',
              subtitle: 'Zacznij od zera i uzupełnij sekcje samodzielnie.',
              enabled: !blocked,
              onTap: () => Navigator.pop(sheet, CreateCvMethod.blank),
            ),
            const SizedBox(height: 6),
            TextButton(
              onPressed: () => Navigator.pop(sheet),
              child: Text('Anuluj', style: AppTypography.caption),
            ),
          ],
        ),
      );
    },
  );
}

class _MethodTile extends StatelessWidget {
  const _MethodTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.enabled,
    required this.onTap,
    this.badge,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String? badge;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1 : 0.45,
      child: Pressable(
        onTap: enabled ? onTap : null,
        scale: 0.985,
        semanticLabel: title,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: AppColors.hairline),
          ),
          child: Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: AppColors.brandGradient,
                ),
                child: Icon(icon, color: Colors.white, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            title,
                            style: AppTypography.button.copyWith(height: 1.3),
                          ),
                        ),
                        if (badge != null) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 7,
                              vertical: 1,
                            ),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(999),
                              color: AppColors.gradientSoft.withValues(
                                alpha: 0.16,
                              ),
                            ),
                            child: Text(
                              badge!,
                              style: AppTypography.label.copyWith(
                                fontSize: 11,
                                color: AppColors.accent,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: AppTypography.label.copyWith(height: 1.45),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right_rounded,
                color: AppColors.textSubtle,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
