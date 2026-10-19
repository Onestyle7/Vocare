import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../core/router/app_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/app_icon.dart';
import '../../../../core/widgets/buttons.dart';
import '../../../../core/widgets/glass_widgets.dart';
import '../../../../core/widgets/pressable.dart';
import '../../../billing/data/billing_repository.dart';
import '../../data/dashboard_repository.dart';
import 'progress_painters.dart';

final _pln = NumberFormat.currency(
  locale: 'pl_PL',
  symbol: 'zł',
  decimalDigits: 0,
);

/// Shown instead of the stats until the profile exists (backend 404).
class StartProfileCard extends StatelessWidget {
  const StartProfileCard({
    super.key,
    required this.onFillProfile,
    required this.onImportCv,
  });

  final VoidCallback onFillProfile;
  final VoidCallback onImportCv;

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 20),
      child: Column(
        children: [
          const SizedBox(
            height: 96,
            child: Stack(
              alignment: Alignment.center,
              children: [
                AmbientGlow(size: 90, opacity: 0.5, blur: 40),
                Icon(Icons.auto_awesome_rounded, size: 40, color: Colors.white),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Zacznij od profilu',
            style: AppTypography.title,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Uzupełnij profil, aby zobaczyć statystyki i otrzymać spersonalizowane ścieżki kariery.',
            style: AppTypography.caption.copyWith(
              color: AppColors.textMuted,
              height: 1.6,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          PrimaryButton(label: 'Uzupełnij profil', onPressed: onFillProfile),
          const SizedBox(height: 12),
          OutlinePillButton(
            label: 'Uzupełnij profil z CV',
            leading: const Icon(
              Icons.upload_file_rounded,
              size: 20,
              color: AppColors.textMuted,
            ),
            onPressed: onImportCv,
          ),
        ],
      ),
    );
  }
}

/// "Uzupełnienie profilu" ring + token balance, side by side.
class ProfileAndBalanceRow extends StatelessWidget {
  const ProfileAndBalanceRow({
    super.key,
    required this.completion,
    required this.access,
    required this.onOpenProfile,
  });

  final int completion;
  final AccessStatus? access;
  final VoidCallback onOpenProfile;

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: SurfaceCard(
              onTap: onOpenProfile,
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Uzupełnienie profilu', style: AppTypography.label),
                  const SizedBox(height: 14),
                  Center(
                    child: RingProgress(
                      value: completion / 100,
                      size: 104,
                      child: Text('$completion%', style: AppTypography.metric),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    completion >= 100
                        ? 'Profil kompletny'
                        : 'Uzupełnij brakujące dane',
                    style: AppTypography.label.copyWith(
                      color: completion >= 100
                          ? AppColors.success
                          : AppColors.accent,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(child: _BalanceTile(access: access)),
        ],
      ),
    );
  }
}

class _BalanceTile extends StatelessWidget {
  const _BalanceTile({required this.access});

  final AccessStatus? access;

  @override
  Widget build(BuildContext context) {
    final balance = access?.tokenBalance;
    return SurfaceCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Saldo tokenów', style: AppTypography.label),
          const Spacer(),
          ShaderMask(
            shaderCallback: AppColors.brandGradient.createShader,
            child: Text(
              balance == null
                  ? '-'
                  : NumberFormat.decimalPattern('pl_PL').format(balance),
              style: AppTypography.metric.copyWith(fontSize: 34),
            ),
          ),
          Text('dostępnych tokenów', style: AppTypography.label),
          const Spacer(),
          if (access != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
                color: access!.hasActiveSubscription
                    ? AppColors.success.withValues(alpha: 0.14)
                    : AppColors.surfaceRaised,
              ),
              child: Text(
                access!.hasActiveSubscription
                    ? 'Subskrypcja aktywna'
                    : 'Pakiet podstawowy',
                style: AppTypography.label.copyWith(
                  fontSize: 12,
                  color: access!.hasActiveSubscription
                      ? AppColors.success
                      : AppColors.textMuted,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// One stop of [JourneyCard]; a step counts as done once it has been used.
class JourneyStep {
  const JourneyStep({
    required this.icon,
    required this.iconFrame,
    required this.title,
    required this.count,
    required this.doneLabel,
    required this.todoLabel,
    required this.route,
  });

  final AppIcons icon;

  /// Size of the icon's exported frame (see [AppIcons]).
  final double iconFrame;
  final String title;
  final int count;
  final String doneLabel;
  final String todoLabel;
  final String route;

  bool get done => count > 0;

  /// The four dashboard counters in tab-bar order, which is also the order
  /// the product is meant to be used in.
  static List<JourneyStep> fromSummary(DashboardSummary s) => [
    JourneyStep(
      icon: AppIcons.briefcase,
      iconFrame: 62,
      title: 'Rekomendacje',
      count: s.recommendations,
      doneLabel:
          '${s.recommendations} ${polishPlural(s.recommendations, 'analiza', 'analizy', 'analiz')} profilu',
      todoLabel: 'Poznaj ścieżki kariery dopasowane do Ciebie',
      route: Routes.assistant,
    ),
    JourneyStep(
      icon: AppIcons.trendingUp,
      iconFrame: 29,
      title: 'Analiza rynku',
      count: s.analyses,
      doneLabel:
          '${s.analyses} ${polishPlural(s.analyses, 'raport', 'raporty', 'raportów')} rynku pracy',
      todoLabel: 'Sprawdź zarobki i popyt',
      route: Routes.market,
    ),
    JourneyStep(
      icon: AppIcons.map,
      iconFrame: 62,
      title: 'Roadmapa',
      count: s.roadmaps,
      doneLabel:
          '${s.roadmaps} ${polishPlural(s.roadmaps, 'plan', 'plany', 'planów')} rozwoju',
      todoLabel: 'Zaplanuj kolejne kroki rozwoju',
      route: Routes.roadmap,
    ),
    JourneyStep(
      icon: AppIcons.cv,
      iconFrame: 62,
      title: 'CV',
      count: s.cvs,
      doneLabel:
          '${s.cvs} ${polishPlural(s.cvs, 'wersja', 'wersje', 'wersji')} CV',
      todoLabel: 'Stwórz CV pod wybrane stanowisko',
      route: Routes.cv,
    ),
  ];
}

/// `1 raport`, `2 raporty`, `5 raportów`, `22 raporty`, `12 raportów`.
String polishPlural(int n, String one, String few, String many) {
  if (n == 1) return one;
  final units = n % 10;
  final tens = n % 100;
  if (units >= 2 && units <= 4 && (tens < 12 || tens > 14)) return few;
  return many;
}

/// "3 z 4" next to the section title; hidden once every step is done.
class JourneyProgress extends StatelessWidget {
  const JourneyProgress({super.key, required this.summary});

  final DashboardSummary summary;

  @override
  Widget build(BuildContext context) {
    final steps = JourneyStep.fromSummary(summary);
    final done = steps.where((s) => s.done).length;
    if (done == steps.length) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: AppColors.surfaceRaised,
      ),
      child: Text(
        '$done z ${steps.length}',
        style: AppTypography.label.copyWith(
          fontSize: 12,
          color: AppColors.textMuted,
        ),
      ),
    );
  }
}

/// "Twoje postępy": the dashboard counters as a path through the app instead
/// of four bare numbers. Each step says what its number means, the line
/// lights up behind finished steps and the first untouched one is offered as
/// the next step.
class JourneyCard extends StatelessWidget {
  const JourneyCard({super.key, required this.summary});

  final DashboardSummary summary;

  @override
  Widget build(BuildContext context) {
    final steps = JourneyStep.fromSummary(summary);
    final next = steps.indexWhere((s) => !s.done);
    return SurfaceCard(
      padding: const EdgeInsets.fromLTRB(16, 20, 14, 4),
      // The lit line draws itself top to bottom once, on first build.
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: 1),
        duration: const Duration(milliseconds: 900),
        curve: Curves.easeInOutCubic,
        builder: (context, t, _) => Column(
          children: [
            for (var i = 0; i < steps.length; i++)
              _JourneyRow(
                step: steps[i],
                isNext: i == next,
                isLast: i == steps.length - 1,
                lineFill: (t * (steps.length - 1) - i).clamp(0.0, 1.0),
              ),
          ],
        ),
      ),
    );
  }
}

class _JourneyRow extends StatelessWidget {
  const _JourneyRow({
    required this.step,
    required this.isNext,
    required this.isLast,
    required this.lineFill,
  });

  static const _node = 40.0;

  final JourneyStep step;
  final bool isNext;
  final bool isLast;
  final double lineFill;

  @override
  Widget build(BuildContext context) {
    final subtitle = step.done ? step.doneLabel : step.todoLabel;
    return Pressable.builder(
      onTap: () => context.go(step.route),
      semanticLabel: '${step.title}. $subtitle',
      // Only the text moves on press, so the line stays connected.
      builder: (context, pressed) => Stack(
        children: [
          if (!isLast)
            Positioned(
              left: _node / 2 - 1,
              width: 2,
              top: _node,
              bottom: 0,
              child: _JourneyLine(lit: step.done, fill: lineFill),
            ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _JourneyNode(step: step, isNext: isNext, size: _node),
              const SizedBox(width: 14),
              Expanded(
                child: AnimatedScale(
                  scale: pressed ? 0.97 : 1,
                  alignment: Alignment.centerLeft,
                  duration: Duration(milliseconds: pressed ? 90 : 220),
                  curve: pressed ? Curves.easeOut : Curves.easeOutBack,
                  child: Padding(
                    padding: EdgeInsets.only(bottom: isLast ? 16 : 26),
                    child: ExcludeSemantics(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(minHeight: _node),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    step.title,
                                    style: AppTypography.button.copyWith(
                                      fontSize: 15,
                                      height: 1.3,
                                      color: step.done || isNext
                                          ? AppColors.textPrimary
                                          : AppColors.textMuted,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    subtitle,
                                    style: AppTypography.label,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 10),
                            if (isNext)
                              const _StartPill()
                            else
                              const Icon(
                                Icons.chevron_right_rounded,
                                size: 22,
                                color: AppColors.textSubtle,
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Done steps are filled with the brand gradient; the next step is ringed and
/// glowing; later steps stay quiet.
class _JourneyNode extends StatelessWidget {
  const _JourneyNode({
    required this.step,
    required this.isNext,
    required this.size,
  });

  final JourneyStep step;
  final bool isNext;
  final double size;

  @override
  Widget build(BuildContext context) {
    final done = step.done;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: done ? AppColors.brandGradient : null,
        color: done ? null : AppColors.surfaceRaised,
        border: isNext ? Border.all(color: AppColors.accent, width: 1.5) : null,
        boxShadow: [
          if (done)
            BoxShadow(
              color: AppColors.gradientMid.withValues(alpha: 0.3),
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          if (isNext)
            BoxShadow(
              color: AppColors.accent.withValues(alpha: 0.35),
              blurRadius: 16,
            ),
        ],
      ),
      child: OverflowBox(
        minWidth: 0,
        minHeight: 0,
        maxWidth: 62,
        maxHeight: 62,
        child: Transform.scale(
          scale: 0.85,
          child: AppIcon(
            step.icon,
            size: step.iconFrame,
            color: done
                ? Colors.white
                : isNext
                ? AppColors.accent
                : AppColors.textSubtle,
          ),
        ),
      ),
    );
  }
}

/// Segment between two nodes: a hairline track, filled with the brand
/// gradient below a finished step.
class _JourneyLine extends StatelessWidget {
  const _JourneyLine({required this.lit, required this.fill});

  final bool lit;
  final double fill;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Center(
        child: SizedBox(
          width: 2,
          height: double.infinity,
          child: Stack(
            fit: StackFit.expand,
            children: [
              const DecoratedBox(
                decoration: BoxDecoration(
                  color: AppColors.divider,
                  borderRadius: BorderRadius.all(Radius.circular(1)),
                ),
              ),
              if (lit)
                Align(
                  alignment: Alignment.topCenter,
                  child: FractionallySizedBox(
                    heightFactor: fill,
                    widthFactor: 1,
                    child: const DecoratedBox(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.all(Radius.circular(1)),
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            AppColors.gradientMid,
                            AppColors.gradientEnd,
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StartPill extends StatelessWidget {
  const _StartPill();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 32,
      padding: const EdgeInsets.symmetric(horizontal: 14),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        gradient: AppColors.brandGradient,
        borderRadius: BorderRadius.circular(999),
        boxShadow: AppColors.buttonGlow,
      ),
      child: Text(
        'Zacznij',
        style: AppTypography.label.copyWith(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: Colors.white,
        ),
      ),
    );
  }
}

/// "Atrybuty profilu" radar, as on the web.
class AttributesRadarCard extends StatelessWidget {
  const AttributesRadarCard({super.key, required this.attributes});

  final List<ProfileAttribute> attributes;

  /// Two-line labels so the eight axes fit a phone-width card.
  static const _shortLabels = [
    'Doświadczenie\npraktyczne',
    'Kompetencje\ntwarde',
    'Kreatywność',
    'Zespół',
    'Samodzielność',
    'Kompetencje\nmiękkie',
    'Certyfikacja',
    'Umiejętności\ntechniczne',
  ];

  @override
  Widget build(BuildContext context) {
    final maxScore = attributes.fold<int>(
      0,
      (m, a) => a.score > m ? a.score : m,
    );
    final scale = maxScore <= 10 ? 10.0 : 100.0;

    return SurfaceCard(
      padding: const EdgeInsets.fromLTRB(28, 24, 28, 16),
      child: AspectRatio(
        aspectRatio: 1.1,
        child: RadarChart(
          RadarChartData(
            radarShape: RadarShape.polygon,
            tickCount: 4,
            ticksTextStyle: const TextStyle(
              color: Colors.transparent,
              fontSize: 1,
            ),
            radarBorderData: const BorderSide(color: AppColors.divider),
            gridBorderData: const BorderSide(color: AppColors.hairline),
            tickBorderData: const BorderSide(color: AppColors.hairline),
            titlePositionPercentageOffset: 0.12,
            titleTextStyle: AppTypography.label.copyWith(
              fontSize: 10.5,
              height: 1.25,
            ),
            getTitle: (index, _) => RadarChartTitle(text: _shortLabels[index]),
            radarTouchData: RadarTouchData(enabled: false),
            dataSets: [
              // Invisible set pinning the scale, so scores read in absolute terms.
              RadarDataSet(
                dataEntries: [
                  for (final _ in attributes) RadarEntry(value: scale),
                ],
                fillColor: Colors.transparent,
                borderColor: Colors.transparent,
                entryRadius: 0,
              ),
              RadarDataSet(
                dataEntries: [
                  for (final a in attributes)
                    RadarEntry(value: a.score.toDouble()),
                ],
                fillColor: AppColors.gradientSoft.withValues(alpha: 0.28),
                borderColor: AppColors.gradientSoft,
                borderWidth: 2,
                entryRadius: 2.5,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// "Postęp w wynagrodzeniu": half gauge + current / expected tiles.
class SalaryProgressCard extends StatelessWidget {
  const SalaryProgressCard({super.key, required this.salary});

  final SalaryProgress? salary;

  @override
  Widget build(BuildContext context) {
    final percent = salary?.goalPercent ?? 0;
    return SurfaceCard(
      child: Column(
        children: [
          GaugeProgress(
            value: percent / 100,
            width: 210,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('$percent%', style: AppTypography.metric),
                Text('Realizacja celu', style: AppTypography.label),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(child: _amountTile('Obecnie', salary?.current)),
              const SizedBox(width: 12),
              Expanded(child: _amountTile('Cel', salary?.expected)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _amountTile(String label, double? amount) => Container(
    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
    decoration: BoxDecoration(
      color: AppColors.surfaceRaised,
      borderRadius: BorderRadius.circular(16),
    ),
    child: Column(
      children: [
        Text(
          amount == null || amount == 0 ? '-' : _pln.format(amount),
          style: AppTypography.button,
        ),
        Text(label, style: AppTypography.label),
      ],
    ),
  );
}
