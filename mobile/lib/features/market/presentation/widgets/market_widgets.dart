import 'dart:math' as math;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/app_icon.dart';
import '../../../../core/widgets/glass_widgets.dart';
import '../../../../core/widgets/pressable.dart';
import '../../../dashboard/presentation/widgets/progress_painters.dart';
import '../../data/market_models.dart';

final _number = NumberFormat.decimalPattern('pl_PL');

String _pln(int value) => value <= 0 ? '-' : '${_number.format(value)} PLN';

/// Demand level of a skill: high → green, medium → amber, other → muted.
Color demandLevelColor(String level) {
  final l = level.toLowerCase();
  if (l.contains('wysok') || l.contains('high')) return AppColors.success;
  if (l.contains('średn') || l.contains('medium')) return AppColors.warning;
  return AppColors.textMuted;
}

/// Series colours of the web salary chart, nudged into the brand palette.
const _minColor = Color(0xFF38BDF8);
const _avgColor = AppColors.gradientMid;
const _maxColor = AppColors.gradientEnd;

/// Intro card — "Szczegółowa analiza rynku pracy".
class MarketHeader extends StatelessWidget {
  const MarketHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Analiza rynkowa AI', style: AppTypography.label),
          const SizedBox(height: 4),
          Text('Szczegółowa analiza rynku pracy', style: AppTypography.title),
          const SizedBox(height: 8),
          Text(
            'Dane o wynagrodzeniach, atrybutach pracy oraz trudności wejścia na podstawie najnowszej analizy.',
            style: AppTypography.caption.copyWith(
              color: AppColors.textMuted,
              height: 1.55,
            ),
          ),
        ],
      ),
    );
  }
}

/// Pill switcher between the analysed career paths.
class IndustrySelector extends StatelessWidget {
  const IndustrySelector({
    super.key,
    required this.industries,
    required this.selected,
    required this.onSelect,
  });

  final List<String> industries;
  final int selected;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        clipBehavior: Clip.none,
        itemCount: industries.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final active = i == selected;
          return Pressable(
            onTap: () => onSelect(i),
            semanticLabel: industries[i],
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeOutCubic,
              padding: const EdgeInsets.symmetric(horizontal: 18),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
                gradient: active ? AppColors.brandGradient : null,
                color: active ? null : AppColors.surface,
                border: Border.all(
                  color: active ? Colors.transparent : AppColors.hairline,
                ),
              ),
              child: Text(
                industries[i],
                style: AppTypography.caption.copyWith(
                  height: 1.2,
                  fontWeight: active ? FontWeight.w500 : FontWeight.w300,
                  color: active ? Colors.white : AppColors.textMuted,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Everything about one career path, following the web `IndustryCard`.
class IndustryDetails extends StatelessWidget {
  const IndustryDetails({
    super.key,
    required this.industry,
    required this.relatedSkills,
  });

  final IndustryStatistics industry;
  final List<SkillDemand> relatedSkills;

  @override
  Widget build(BuildContext context) {
    final difficulty = industry.entryDifficulty;
    final narrator = industry.narrator;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _IndustryOverview(industry: industry, relatedSkills: relatedSkills),
        const SizedBox(height: 12),
        _ChartCard(
          title: 'Progresja wynagrodzeń',
          subtitle: 'Junior → Lead/Expert',
          badge: 'PLN',
          child: SalaryProgressionChart(steps: industry.salaryProgression),
        ),
        if (industry.workAttributes case final attributes?
            when !attributes.isEmpty) ...[
          const SizedBox(height: 12),
          _ChartCard(
            title: 'Atrybuty pracy',
            badge: '0–10',
            child: WorkAttributesRadar(attributes: attributes),
          ),
        ],
        if (difficulty != null) ...[
          const SizedBox(height: 12),
          EntryDifficultyCard(difficulty: difficulty),
        ],
        if (narrator != null) ...[
          const SizedBox(height: 28),
          const SectionHeader(title: 'Narrator AI'),
          NarratorCards(narrator: narrator),
        ],
      ],
    );
  }
}

/// Snapshot of one path: pay range, how hard it is to get hired, the
/// forecast and the skills in demand — one column of clearly labelled facts
/// instead of a cloud of chips.
class _IndustryOverview extends StatelessWidget {
  const _IndustryOverview({
    required this.industry,
    required this.relatedSkills,
  });

  final IndustryStatistics industry;
  final List<SkillDemand> relatedSkills;

  @override
  Widget build(BuildContext context) {
    final hasSalary = industry.minSalary > 0 || industry.maxSalary > 0;
    final sections = <Widget>[
      if (hasSalary)
        _OverviewFact(
          icon: Icons.payments_outlined,
          label: 'Widełki wynagrodzeń',
          child: _SalaryRange(min: industry.minSalary, max: industry.maxSalary),
        ),
      if (industry.employmentRate > 0)
        _HiringChance(value: industry.employmentRate),
      if (industry.growthForecast.isNotEmpty)
        _OverviewFact(
          icon: Icons.trending_up_rounded,
          label: 'Prognoza',
          child: Text(
            industry.growthForecast,
            style: AppTypography.caption.copyWith(
              color: AppColors.textSecondary,
              height: 1.55,
            ),
          ),
        ),
      if (relatedSkills.isNotEmpty)
        _OverviewFact(
          icon: Icons.auto_awesome_outlined,
          label: 'Poszukiwane umiejętności',
          child: Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              for (final skill in relatedSkills.take(4))
                _Chip(skill.skill, dot: demandLevelColor(skill.level)),
            ],
          ),
        ),
    ];

    return SurfaceCard(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // The selector above already says "which path"; the name stays
          // as the card title so charts below keep their context on scroll.
          Text(industry.industry, style: AppTypography.title),
          for (final section in sections) ...[
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Divider(
                height: 1,
                thickness: 1,
                color: AppColors.hairline,
              ),
            ),
            section,
          ],
        ],
      ),
    );
  }
}

/// Small caption with an icon above a fact's value.
class _OverviewFact extends StatelessWidget {
  const _OverviewFact({
    required this.icon,
    required this.label,
    required this.child,
    this.trailing,
  });

  final IconData icon;
  final String label;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: AppColors.textSubtle),
            const SizedBox(width: 8),
            Expanded(child: Text(label, style: AppTypography.label)),
            ?trailing,
          ],
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}

/// "5 500 – 8 500 PLN", counting up on first show.
class _SalaryRange extends StatelessWidget {
  const _SalaryRange({required this.min, required this.max});

  final int min;
  final int max;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 1100),
      curve: Curves.easeOutCubic,
      builder: (_, t, _) {
        final from = (min * t).round(), to = (max * t).round();
        final text = switch ((min > 0, max > 0)) {
          (true, true) => '${_number.format(from)} – ${_number.format(to)} PLN',
          (true, false) => 'od ${_number.format(from)} PLN',
          _ => 'do ${_number.format(to)} PLN',
        };
        return Semantics(
          label: 'Widełki wynagrodzeń: ${_pln(min)} do ${_pln(max)}',
          excludeSemantics: true,
          child: FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              text,
              style: AppTypography.metric.copyWith(fontSize: 26, height: 1.2),
            ),
          ),
        );
      },
    );
  }
}

/// `employmentRate` is an *ease of getting hired* index (100 = anyone is
/// hired, 20 = fierce competition — see the market analysis prompt), so it
/// is shown as a 0–100 meter with words, not as "employment %".
class _HiringChance extends StatelessWidget {
  const _HiringChance({required this.value});

  final int value;

  @override
  Widget build(BuildContext context) {
    final v = value.clamp(0, 100);
    final (label, color) = switch (v) {
      < 40 => ('Duża konkurencja na start', AppColors.warning),
      < 70 => ('Umiarkowana konkurencja', AppColors.accent),
      _ => ('Dobre szanse na pierwszą pracę', AppColors.success),
    };
    return Semantics(
      label: 'Szanse na zatrudnienie: $v na 100. $label',
      excludeSemantics: true,
      child: _OverviewFact(
        icon: Icons.groups_2_outlined,
        label: 'Szanse na zatrudnienie',
        trailing: Text.rich(
          TextSpan(
            text: '$v',
            style: AppTypography.button.copyWith(height: 1.2),
            children: [
              TextSpan(
                text: '/100',
                style: AppTypography.label.copyWith(fontSize: 12),
              ),
            ],
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: SizedBox(
                height: 6,
                child: Stack(
                  children: [
                    const Positioned.fill(
                      child: ColoredBox(color: AppColors.surfaceRaised),
                    ),
                    Positioned.fill(
                      child: TweenAnimationBuilder<double>(
                        tween: Tween(begin: 0, end: v / 100),
                        duration: const Duration(milliseconds: 900),
                        curve: Curves.easeOutCubic,
                        builder: (_, t, _) => FractionallySizedBox(
                          alignment: Alignment.centerLeft,
                          widthFactor: t,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(4),
                              color: color,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(label, style: AppTypography.label.copyWith(color: color)),
          ],
        ),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip(this.text, {this.color, this.dot});

  final String text;
  final Color? color;

  /// Leading status dot, e.g. demand level of a skill.
  final Color? dot;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: color?.withValues(alpha: 0.12) ?? AppColors.surfaceRaised,
        border: Border.all(
          color: color?.withValues(alpha: 0.3) ?? AppColors.hairline,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (dot != null) ...[
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(shape: BoxShape.circle, color: dot),
            ),
            const SizedBox(width: 7),
          ],
          Flexible(
            child: Text(
              text,
              style: AppTypography.label.copyWith(
                fontSize: 12.5,
                height: 1.3,
                color: color ?? AppColors.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChartCard extends StatelessWidget {
  const _ChartCard({
    required this.title,
    required this.badge,
    required this.child,
    this.subtitle,
  });

  final String title;
  final String? subtitle;
  final String badge;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
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
                    Text(title, style: AppTypography.titleSmall),
                    if (subtitle != null)
                      Text(subtitle!, style: AppTypography.label),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.surfaceRaised,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  badge,
                  style: AppTypography.label.copyWith(fontSize: 11),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}

/// Min / average / max salary per career level (web: Recharts area chart).
class SalaryProgressionChart extends StatelessWidget {
  const SalaryProgressionChart({super.key, required this.steps});

  final List<SalaryStep> steps;

  @override
  Widget build(BuildContext context) {
    if (steps.isEmpty) {
      return Text(
        'Brak danych o progresji wynagrodzeń.',
        style: AppTypography.label,
      );
    }
    final top = steps.fold<int>(
      0,
      (m, s) => math.max(m, math.max(s.max, s.average)),
    );
    final maxY = (top * 1.12 / 1000).ceil() * 1000.0;

    LineChartBarData line(
      int Function(SalaryStep) value,
      Color color, {
      bool filled = false,
    }) => LineChartBarData(
      spots: [
        for (var i = 0; i < steps.length; i++)
          FlSpot(i.toDouble(), value(steps[i]).toDouble()),
      ],
      isCurved: true,
      preventCurveOverShooting: true,
      color: color,
      barWidth: filled ? 3 : 2,
      dotData: FlDotData(
        getDotPainter: (_, _, _, _) => FlDotCirclePainter(
          radius: filled ? 3.5 : 2.5,
          color: color,
          strokeWidth: 0,
        ),
      ),
      belowBarData: BarAreaData(
        show: filled,
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            color.withValues(alpha: 0.35),
            color.withValues(alpha: 0.02),
          ],
        ),
      ),
    );

    return Column(
      children: [
        SizedBox(
          height: 220,
          child: LineChart(
            LineChartData(
              minY: 0,
              maxY: maxY,
              minX: -0.15,
              maxX: steps.length - 0.85,
              gridData: FlGridData(
                drawVerticalLine: false,
                horizontalInterval: maxY / 4,
                getDrawingHorizontalLine: (_) => const FlLine(
                  color: AppColors.hairline,
                  strokeWidth: 1,
                  dashArray: [4, 4],
                ),
              ),
              borderData: FlBorderData(show: false),
              titlesData: FlTitlesData(
                topTitles: const AxisTitles(),
                rightTitles: const AxisTitles(),
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 38,
                    interval: maxY / 4,
                    getTitlesWidget: (value, meta) => SideTitleWidget(
                      meta: meta,
                      child: Text(
                        value == 0 ? '0' : '${(value / 1000).round()}k',
                        style: AppTypography.label.copyWith(fontSize: 10),
                      ),
                    ),
                  ),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    interval: 1,
                    reservedSize: 28,
                    getTitlesWidget: (value, meta) {
                      final i = value.round();
                      if (i < 0 ||
                          i >= steps.length ||
                          (value - i).abs() > 0.01) {
                        return const SizedBox.shrink();
                      }
                      return SideTitleWidget(
                        meta: meta,
                        child: Text(
                          steps[i].level,
                          style: AppTypography.label.copyWith(fontSize: 10.5),
                        ),
                      );
                    },
                  ),
                ),
              ),
              lineTouchData: LineTouchData(
                touchTooltipData: LineTouchTooltipData(
                  getTooltipColor: (_) => AppColors.surfaceRaised,
                  tooltipBorderRadius: BorderRadius.circular(12),
                  fitInsideHorizontally: true,
                  fitInsideVertically: true,
                  getTooltipItems: (spots) => [
                    for (final spot in spots)
                      LineTooltipItem(
                        _pln(spot.y.round()),
                        AppTypography.label.copyWith(
                          color: spot.bar.color,
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
              ),
              lineBarsData: [
                line((s) => s.min, _minColor),
                line((s) => s.average, _avgColor, filled: true),
                line((s) => s.max, _maxColor),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _Legend(color: _minColor, label: 'Min'),
            SizedBox(width: 16),
            _Legend(color: _avgColor, label: 'Średnia'),
            SizedBox(width: 16),
            _Legend(color: _maxColor, label: 'Max'),
          ],
        ),
      ],
    );
  }
}

class _Legend extends StatelessWidget {
  const _Legend({required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(label, style: AppTypography.label.copyWith(fontSize: 12)),
      ],
    );
  }
}

/// 0–10 work attributes (web: "Atrybuty pracy" radar).
class WorkAttributesRadar extends StatelessWidget {
  const WorkAttributesRadar({super.key, required this.attributes});

  final WorkAttributes attributes;

  static const _shortLabels = {
    'Kontakt z klientem': 'Kontakt\nz klientem',
    'Głębokość techniczna': 'Głębokość\ntechniczna',
  };

  @override
  Widget build(BuildContext context) {
    final scores = attributes.scores;
    return AspectRatio(
      aspectRatio: 1.15,
      child: RadarChart(
        RadarChartData(
          radarShape: RadarShape.polygon,
          tickCount: 5,
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
          getTitle: (index, _) => RadarChartTitle(
            text: _shortLabels[scores[index].$1] ?? scores[index].$1,
          ),
          radarTouchData: RadarTouchData(enabled: false),
          dataSets: [
            RadarDataSet(
              dataEntries: [
                for (final _ in scores) const RadarEntry(value: 10),
              ],
              fillColor: Colors.transparent,
              borderColor: Colors.transparent,
              entryRadius: 0,
            ),
            RadarDataSet(
              dataEntries: [
                for (final s in scores) RadarEntry(value: s.$2.toDouble()),
              ],
              fillColor: AppColors.gradientSoft.withValues(alpha: 0.3),
              borderColor: AppColors.gradientSoft,
              borderWidth: 2,
              entryRadius: 2.5,
            ),
          ],
        ),
      ),
    );
  }
}

/// "Trudność wejścia": score gauge, level, time to ready, missing skills.
class EntryDifficultyCard extends StatelessWidget {
  const EntryDifficultyCard({super.key, required this.difficulty});

  final EntryDifficulty difficulty;

  /// Same bands as the web `difficultyBand`.
  Color get _band => difficulty.score >= 70
      ? AppColors.warning
      : difficulty.score >= 40
      ? const Color(0xFF60A5FA)
      : AppColors.success;

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Trudność wejścia',
                  style: AppTypography.titleSmall,
                ),
              ),
              if (difficulty.level.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: _band.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    difficulty.level,
                    style: AppTypography.label.copyWith(
                      fontSize: 12,
                      color: _band,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              RingProgress(
                value: difficulty.score / 100,
                size: 96,
                stroke: 9,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('${difficulty.score}', style: AppTypography.metric),
                    Text(
                      '/100',
                      style: AppTypography.label.copyWith(fontSize: 11),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _Fact(
                      icon: Icons.schedule_rounded,
                      label: 'Szacowany czas',
                      value: difficulty.estimatedTime.isEmpty
                          ? '-'
                          : difficulty.estimatedTime,
                    ),
                    const SizedBox(height: 10),
                    _Fact(
                      icon: Icons.extension_outlined,
                      label: 'Brakujące umiejętności',
                      value: '${difficulty.missingSkillsCount}',
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (difficulty.missingSkills.isNotEmpty) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                for (final skill in difficulty.missingSkills)
                  _Chip(skill, color: AppColors.warning),
              ],
            ),
          ],
          if (difficulty.explanation.isNotEmpty) ...[
            const SizedBox(height: 14),
            Text(
              difficulty.explanation,
              style: AppTypography.caption.copyWith(
                color: AppColors.textMuted,
                height: 1.55,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _Fact extends StatelessWidget {
  const _Fact({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: AppColors.textSubtle),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: AppTypography.label.copyWith(fontSize: 12)),
              Text(value, style: AppTypography.button.copyWith(height: 1.35)),
            ],
          ),
        ),
      ],
    );
  }
}

/// The five AI narrator insights with the web icons.
class NarratorCards extends StatelessWidget {
  const NarratorCards({super.key, required this.narrator});

  final AiNarrator narrator;

  @override
  Widget build(BuildContext context) {
    final cards = [
      (AppIcons.marketSalary, 'Wynagrodzenia', narrator.salary),
      (AppIcons.marketWorkStyle, 'Styl pracy', narrator.workStyle),
      (AppIcons.marketEntry, 'Wejście', narrator.entry),
      (AppIcons.marketMotivation, 'Motywacja', narrator.motivation),
      (AppIcons.marketRecommendation, 'Rekomendacja', narrator.recommendation),
    ];
    return Column(
      children: [
        for (final (icon, title, text) in cards) ...[
          SurfaceCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(10),
                        color: AppColors.surfaceRaised,
                        border: Border.all(color: AppColors.hairline),
                      ),
                      child: Center(child: AppIcon(icon, size: 18)),
                    ),
                    const SizedBox(width: 10),
                    Text(title, style: AppTypography.button),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  text.isEmpty ? 'Brak danych od narratora AI.' : text,
                  style: AppTypography.caption.copyWith(height: 1.55),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
        ],
      ],
    );
  }
}

/// "Trendy rynkowe" with the impact for the candidate.
class TrendCard extends StatelessWidget {
  const TrendCard({super.key, required this.trend});

  final MarketTrend trend;

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.only(top: 2),
                child: Icon(
                  Icons.trending_up_rounded,
                  size: 18,
                  color: AppColors.accent,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  trend.name,
                  style: AppTypography.button.copyWith(height: 1.4),
                ),
              ),
            ],
          ),
          if (trend.description.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              trend.description,
              style: AppTypography.caption.copyWith(
                color: AppColors.textMuted,
                height: 1.55,
              ),
            ),
          ],
          if (trend.impact.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.surfaceRaised,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text.rich(
                TextSpan(
                  children: [
                    TextSpan(
                      text: 'Wpływ: ',
                      style: AppTypography.label.copyWith(
                        color: AppColors.accent,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    TextSpan(text: trend.impact),
                  ],
                ),
                style: AppTypography.label.copyWith(
                  color: AppColors.textPrimary,
                  height: 1.5,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// "Popyt na umiejętności" — the web "Ściągawka".
class SkillDemandList extends StatelessWidget {
  const SkillDemandList({super.key, required this.skills});

  final List<SkillDemand> skills;

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Column(
        children: [
          for (var i = 0; i < skills.length; i++) ...[
            if (i > 0) const Divider(height: 1, color: AppColors.hairline),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Row(
                children: [
                  const Icon(
                    Icons.auto_awesome_rounded,
                    size: 16,
                    color: AppColors.accent,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          skills[i].skill,
                          style: AppTypography.button.copyWith(height: 1.35),
                        ),
                        if (skills[i].industry.isNotEmpty)
                          Text(
                            skills[i].industry,
                            style: AppTypography.label.copyWith(fontSize: 12),
                          ),
                      ],
                    ),
                  ),
                  if (skills[i].level.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(999),
                        color: demandLevelColor(
                          skills[i].level,
                        ).withValues(alpha: 0.14),
                      ),
                      child: Text(
                        skills[i].level,
                        style: AppTypography.label.copyWith(
                          fontSize: 12,
                          color: demandLevelColor(skills[i].level),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
