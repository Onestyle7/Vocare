import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/buttons.dart';
import '../../../../core/widgets/glass_widgets.dart';
import '../../data/assistant_models.dart';
import 'assistant_widgets.dart';

final _amount = NumberFormat.decimalPattern('pl_PL');
final _date = DateFormat('d MMM yyyy', 'pl');

/// Matched offer, following the web offer card: company, title, salary,
/// location, match score with confidence, matched / missing skills.
class JobOfferCard extends StatelessWidget {
  const JobOfferCard({super.key, required this.offer});

  final ScoredJobOffer offer;

  String get _salary {
    final min = offer.salaryMin, max = offer.salaryMax;
    final currency = offer.salaryCurrency == null
        ? ''
        : ' ${offer.salaryCurrency}';
    if (min != null && max != null) {
      return '${_amount.format(min)}–${_amount.format(max)}$currency';
    }
    if (min != null) return 'od ${_amount.format(min)}$currency';
    if (max != null) return 'do ${_amount.format(max)}$currency';
    return 'Brak widełek';
  }

  @override
  Widget build(BuildContext context) {
    final location = offer.locations.isEmpty
        ? null
        : offer.locations.first +
              (offer.locations.length > 1
                  ? ' +${offer.locations.length - 1}'
                  : '');

    return SurfaceCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      offer.companyName.toUpperCase(),
                      style: AppTypography.label.copyWith(
                        fontSize: 11,
                        letterSpacing: 0.6,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      offer.title,
                      style: AppTypography.button.copyWith(height: 1.35),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'Widełki',
                    style: AppTypography.label.copyWith(fontSize: 11),
                  ),
                  Text(
                    _salary,
                    style: AppTypography.label.copyWith(
                      color: AppColors.accent,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (offer.publishedAt != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      _date.format(offer.publishedAt!),
                      style: AppTypography.label.copyWith(fontSize: 11),
                    ),
                  ],
                ],
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 14,
            runSpacing: 4,
            children: [
              if (location != null)
                _Meta(icon: Icons.place_outlined, text: location),
              if (offer.category.isNotEmpty)
                _Meta(icon: Icons.work_outline_rounded, text: offer.category),
            ],
          ),
          if (offer.description.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              offer.description,
              style: AppTypography.label.copyWith(height: 1.5),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: 14),
          Row(
            children: [
              _Pill(text: '${offer.matchScore}% dopasowania', strong: true),
              const SizedBox(width: 6),
              _Pill(text: offer.confidence.label),
            ],
          ),
          const SizedBox(height: 10),
          GradientBar(value: offer.matchScore / 100, height: 4),
          if (offer.matchedSkills.isNotEmpty ||
              offer.missingSkills.isNotEmpty) ...[
            const SizedBox(height: 12),
            _SkillLine(
              label: 'Masz',
              skills: offer.matchedSkills,
              color: AppColors.success,
            ),
            _SkillLine(
              label: 'Braki',
              skills: offer.missingSkills,
              color: AppColors.warning,
            ),
          ],
          if (offer.url.isNotEmpty) ...[
            const SizedBox(height: 14),
            OutlinePillButton(
              label: 'Zobacz ofertę',
              leading: const Icon(
                Icons.open_in_new_rounded,
                size: 18,
                color: AppColors.textMuted,
              ),
              onPressed: () => launchUrl(
                Uri.parse(offer.url),
                mode: LaunchMode.inAppBrowserView,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _Meta extends StatelessWidget {
  const _Meta({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.textSubtle),
        const SizedBox(width: 4),
        Text(text, style: AppTypography.label.copyWith(fontSize: 12)),
      ],
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.text, this.strong = false});

  final String text;
  final bool strong;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: strong
            ? AppColors.gradientSoft.withValues(alpha: 0.2)
            : AppColors.surfaceRaised,
      ),
      child: Text(
        text,
        style: AppTypography.label.copyWith(
          fontSize: 11.5,
          color: strong ? AppColors.textPrimary : AppColors.textMuted,
        ),
      ),
    );
  }
}

class _SkillLine extends StatelessWidget {
  const _SkillLine({
    required this.label,
    required this.skills,
    required this.color,
  });

  final String label;
  final List<String> skills;
  final Color color;

  @override
  Widget build(BuildContext context) {
    if (skills.isEmpty) return const SizedBox.shrink();
    final shown = skills.take(5).join(', ');
    final more = skills.length > 5 ? ' +${skills.length - 5}' : '';
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Text.rich(
        TextSpan(
          children: [
            TextSpan(
              text: '$label: ',
              style: TextStyle(color: color, fontWeight: FontWeight.w500),
            ),
            TextSpan(text: '$shown$more'),
          ],
        ),
        style: AppTypography.label.copyWith(fontSize: 12, height: 1.5),
      ),
    );
  }
}
