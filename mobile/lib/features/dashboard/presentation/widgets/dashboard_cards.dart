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
                  ? '—'
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

/// "Podsumowanie" — the four counters from the web summary card.
class SummaryGrid extends StatelessWidget {
  const SummaryGrid({super.key, required this.summary});

  final DashboardSummary summary;

  @override
  Widget build(BuildContext context) {
    final items = [
      (
        AppIcons.briefcase,
        62.0,
        'Rekomendacje',
        summary.recommendations,
        Routes.assistant,
      ),
      (
        AppIcons.trendingUp,
        29.0,
        'Analizy rynku',
        summary.analyses,
        Routes.market,
      ),
      (AppIcons.map, 62.0, 'Roadmapy', summary.roadmaps, Routes.roadmap),
      (AppIcons.cv, 62.0, 'Wersje CV', summary.cvs, Routes.cv),
    ];
    return GridView.count(
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.45,
      shrinkWrap: true,
      padding: EdgeInsets.zero,
      physics: const NeverScrollableScrollPhysics(),
      children: [
        for (final (icon, size, label, value, route) in items)
          SurfaceCard(
            onTap: () => context.go(route),
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.surfaceRaised,
                  ),
                  child: OverflowBox(
                    minWidth: 0,
                    minHeight: 0,
                    maxWidth: 62,
                    maxHeight: 62,
                    child: Transform.scale(
                      scale: 0.8,
                      child: AppIcon(icon, size: size),
                    ),
                  ),
                ),
                const Spacer(),
                TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0, end: value.toDouble()),
                  duration: const Duration(milliseconds: 700),
                  curve: Curves.easeOutCubic,
                  builder: (_, v, _) =>
                      Text('${v.round()}', style: AppTypography.metric),
                ),
                Text(
                  label,
                  style: AppTypography.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
      ],
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
          amount == null || amount == 0 ? '—' : _pln.format(amount),
          style: AppTypography.button,
        ),
        Text(label, style: AppTypography.label),
      ],
    ),
  );
}
