import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/buttons.dart';
import '../../../../core/widgets/glass_widgets.dart';
import '../../data/assistant_models.dart';

/// "Doradca kariery AI" pill above the results (web: outlined badge).
class AdvisorBadge extends StatelessWidget {
  const AdvisorBadge({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: AppColors.outline, width: 0.5),
        ),
        child: Text(
          'Doradca kariery AI',
          style: AppTypography.label.copyWith(color: AppColors.textPrimary),
        ),
      ),
    );
  }
}

/// The highlighted primary recommendation: brand-gradient frame with the
/// "Główna rekomendacja" strip, as on the web.
class PrimaryRecommendationCard extends StatefulWidget {
  const PrimaryRecommendationCard({super.key, required this.recommendation});

  final CareerRecommendation recommendation;

  @override
  State<PrimaryRecommendationCard> createState() =>
      _PrimaryRecommendationCardState();
}

class _PrimaryRecommendationCardState extends State<PrimaryRecommendationCard> {
  bool _expanded = true;

  @override
  Widget build(BuildContext context) {
    final rec = widget.recommendation;
    return Container(
      decoration: BoxDecoration(
        gradient: AppColors.brandGradient,
        borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
        boxShadow: const [
          BoxShadow(
            color: Color(0x33915EFF),
            blurRadius: 30,
            offset: Offset(0, 10),
          ),
        ],
      ),
      padding: const EdgeInsets.fromLTRB(4, 0, 4, 4),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.auto_awesome_rounded,
                  size: 18,
                  color: Colors.white,
                ),
                const SizedBox(width: 8),
                Text('Główna rekomendacja', style: AppTypography.button),
              ],
            ),
          ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 18, 12, 18),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppSpacing.cardRadius - 4),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Najlepsze dopasowanie',
                        style: AppTypography.label,
                      ),
                    ),
                    _CollapseButton(
                      expanded: _expanded,
                      onTap: () => setState(() => _expanded = !_expanded),
                    ),
                  ],
                ),
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: Text(
                    rec.primaryPath,
                    style: AppTypography.title.copyWith(
                      color: AppColors.accent,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: Text(
                    rec.justification,
                    style: AppTypography.caption.copyWith(
                      color: AppColors.textMuted,
                      height: 1.6,
                    ),
                  ),
                ),
                AnimatedSize(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOutCubic,
                  alignment: Alignment.topCenter,
                  child: !_expanded
                      ? const SizedBox(width: double.infinity)
                      : Padding(
                          padding: const EdgeInsets.only(right: 8, top: 20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (rec.nextSteps.isNotEmpty) ...[
                                Text(
                                  'Kolejne kroki',
                                  style: AppTypography.titleSmall,
                                ),
                                const SizedBox(height: 12),
                                StepsTimeline(steps: rec.nextSteps),
                              ],
                              if (rec.longTermGoal.isNotEmpty) ...[
                                const SizedBox(height: 16),
                                Text(
                                  'Cel długoterminowy',
                                  style: AppTypography.titleSmall,
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  rec.longTermGoal,
                                  style: AppTypography.caption.copyWith(
                                    color: AppColors.textMuted,
                                    height: 1.6,
                                  ),
                                ),
                              ],
                            ],
                          ),
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

class _CollapseButton extends StatelessWidget {
  const _CollapseButton({required this.expanded, required this.onTap});

  final bool expanded;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: onTap,
      tooltip: expanded ? 'Zwiń' : 'Rozwiń',
      icon: AnimatedRotation(
        turns: expanded ? 0.5 : 0,
        duration: const Duration(milliseconds: 250),
        child: const Icon(
          Icons.expand_more_rounded,
          color: AppColors.iconMuted,
        ),
      ),
    );
  }
}

/// "Kolejne kroki" — the first step is current, the rest upcoming.
class StepsTimeline extends StatelessWidget {
  const StepsTimeline({super.key, required this.steps});

  final List<String> steps;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (var i = 0; i < steps.length; i++)
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(
                  width: 28,
                  child: Column(
                    children: [
                      Container(
                        width: 28,
                        height: 28,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: i == 0 ? AppColors.brandGradient : null,
                          color: i == 0 ? null : AppColors.surfaceRaised,
                          border: i == 0
                              ? null
                              : Border.all(color: AppColors.divider),
                        ),
                        child: Text(
                          '${i + 1}',
                          style: AppTypography.label.copyWith(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      if (i < steps.length - 1)
                        Expanded(
                          child: Container(
                            width: 1.5,
                            margin: const EdgeInsets.symmetric(vertical: 4),
                            color: AppColors.divider,
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(
                      bottom: i < steps.length - 1 ? 18 : 0,
                      top: 3,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Krok ${i + 1}',
                          style: AppTypography.label.copyWith(
                            color: i == 0
                                ? AppColors.accent
                                : AppColors.textSubtle,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          steps[i],
                          style: AppTypography.caption.copyWith(height: 1.5),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

/// Bordered number tile from the web cards (thicker right/bottom edge).
class PathNumber extends StatelessWidget {
  const PathNumber(this.number, {super.key, this.size = 44});

  final int number;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.3),
        color: AppColors.surfaceRaised,
        border: const Border(
          top: BorderSide(color: AppColors.outline),
          left: BorderSide(color: AppColors.outline),
          right: BorderSide(color: AppColors.outline, width: 3),
          bottom: BorderSide(color: AppColors.outline, width: 3),
        ),
      ),
      child: Text(
        '$number',
        style: AppTypography.titleSmall.copyWith(fontWeight: FontWeight.w600),
      ),
    );
  }
}

/// Summary of one career path in the list; opens the detail screen.
class CareerPathCard extends StatelessWidget {
  const CareerPathCard({
    super.key,
    required this.path,
    required this.index,
    required this.offerCount,
    required this.onTap,
  });

  final CareerPath path;
  final int index;
  final int? offerCount;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final probability = path.probability.clamp(0, 100).round();
    return SurfaceCard(
      onTap: onTap,
      padding: const EdgeInsets.fromLTRB(18, 18, 12, 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              PathNumber(index + 1),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      index == 0 ? 'Najlepsza ścieżka' : 'Alternatywna ścieżka',
                      style: AppTypography.label,
                    ),
                    Text(
                      path.name,
                      style: AppTypography.titleSmall.copyWith(
                        color: AppColors.accent,
                      ),
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
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.only(right: 6),
            child: Text(
              path.description,
              style: AppTypography.caption.copyWith(
                color: AppColors.textMuted,
                height: 1.55,
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(height: 14),
          Padding(
            padding: const EdgeInsets.only(right: 6),
            child: Row(
              children: [
                Text('Prawdopodobieństwo sukcesu', style: AppTypography.label),
                const Spacer(),
                Text(
                  '$probability%',
                  style: AppTypography.button.copyWith(height: 1.2),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.only(right: 6),
            child: GradientBar(value: probability / 100),
          ),
          if (offerCount != null && offerCount! > 0) ...[
            const SizedBox(height: 14),
            Row(
              children: [
                const Icon(
                  Icons.work_outline_rounded,
                  size: 16,
                  color: AppColors.accent,
                ),
                const SizedBox(width: 6),
                Text(
                  _offersLabel(offerCount!),
                  style: AppTypography.label.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  static String _offersLabel(int n) {
    if (n == 1) return '1 dopasowana oferta pracy';
    final mod10 = n % 10, mod100 = n % 100;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
      return '$n dopasowane oferty pracy';
    }
    return '$n dopasowanych ofert pracy';
  }
}

/// Thin progress bar in the brand gradient.
class GradientBar extends StatelessWidget {
  const GradientBar({super.key, required this.value, this.height = 6});

  final double value;
  final double height;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(height),
      child: SizedBox(
        height: height,
        child: Stack(
          children: [
            const Positioned.fill(child: ColoredBox(color: Color(0xFF1F1F2E))),
            Positioned.fill(
              child: TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: value.clamp(0, 1)),
                duration: const Duration(milliseconds: 800),
                curve: Curves.easeOutCubic,
                builder: (_, v, _) => FractionallySizedBox(
                  alignment: Alignment.centerLeft,
                  widthFactor: v,
                  child: const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: AppColors.brandGradient,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Before the profile exists — web `GenerateRecommendationFail`.
class AssistantNoProfile extends StatelessWidget {
  const AssistantNoProfile({super.key, required this.onOpenProfile});

  final VoidCallback onOpenProfile;

  @override
  Widget build(BuildContext context) {
    return _HeroState(
      icon: Icons.person_search_rounded,
      title: 'Znajdź idealny zawód\ndla siebie w 60 sekund.',
      body:
          'Rozpocznij od uzupełnienia swojego profilu - po tym zyskasz dostęp do narzędzi AI.',
      action: PrimaryButton(
        label: 'Przejdź do profilu',
        onPressed: onOpenProfile,
      ),
    );
  }
}

/// Profile ready, nothing generated yet — web `NoRecommendationsState`.
class AssistantNoRecommendation extends StatelessWidget {
  const AssistantNoRecommendation({super.key, required this.onGenerate});

  final VoidCallback onGenerate;

  @override
  Widget build(BuildContext context) {
    return _HeroState(
      icon: Icons.auto_awesome_rounded,
      title: 'Twoje rekomendacje',
      body:
          'Wygeneruj rekomendacje kariery AI i odkryj idealną ścieżkę zawodową dopasowaną do Twojego profilu.',
      action: PrimaryButton(label: 'Wygeneruj', onPressed: onGenerate),
    );
  }
}

class _HeroState extends StatelessWidget {
  const _HeroState({
    required this.icon,
    required this.title,
    required this.body,
    required this.action,
  });

  final IconData icon;
  final String title;
  final String body;
  final Widget action;

  @override
  Widget build(BuildContext context) {
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
                child: Icon(icon, size: 42, color: Colors.white),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Text(title, style: AppTypography.headline, textAlign: TextAlign.center),
        const SizedBox(height: 10),
        Text(
          body,
          style: AppTypography.body.copyWith(color: AppColors.textSecondary),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 28),
        action,
      ],
    );
  }
}

/// Outline action at the end of the results.
class RegenerateButton extends StatelessWidget {
  const RegenerateButton({super.key, required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return OutlinePillButton(
      label: 'Wygeneruj nową rekomendację',
      leading: const Icon(
        Icons.refresh_rounded,
        size: 20,
        color: AppColors.textMuted,
      ),
      onPressed: onPressed,
    );
  }
}
