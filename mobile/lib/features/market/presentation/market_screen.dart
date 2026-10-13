import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_error.dart';
import '../../../core/network/result.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/buttons.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/generating_view.dart';
import '../../../core/widgets/glass_widgets.dart';
import '../../billing/data/billing_repository.dart';
import '../../billing/presentation/service_cost_sheet.dart';
import '../../shell/main_shell.dart';
import '../data/market_models.dart';
import '../data/market_repository.dart';
import 'widgets/market_widgets.dart';

/// "Analiza rynku" tab (web: /dashboard/market-analysis).
class MarketScreen extends ConsumerStatefulWidget {
  const MarketScreen({super.key});

  @override
  ConsumerState<MarketScreen> createState() => _MarketScreenState();
}

class _MarketScreenState extends ConsumerState<MarketScreen> {
  bool _generating = false;

  Future<void> _generate() async {
    final confirmed = await confirmServiceCost(
      context,
      title: 'Wygenerować analizę rynku?',
      tokenCost: ServiceCosts.marketAnalysis,
      icon: Icons.trending_up_rounded,
    );
    if (!confirmed || !mounted) return;

    setState(() => _generating = true);
    final result = await ref.read(marketProvider.notifier).generate();
    if (!mounted) return;
    setState(() => _generating = false);

    switch (result) {
      case Ok():
        showToast(
          context,
          'Nowa analiza rynku została wygenerowana pomyślnie',
          kind: ToastKind.success,
        );
      case Err(:final error):
        showToast(context, error.message, kind: ToastKind.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    final market = ref.watch(marketProvider);

    final Widget body = switch (market) {
      _ when _generating => const GeneratingView.marketAnalysis(
        key: ValueKey('generating'),
      ),
      AsyncValue(:final value?) => switch (value) {
        MarketNeedsRecommendation() => _HeroState(
          key: const ValueKey('no-recommendation'),
          icon: Icons.work_outline_rounded,
          title: 'Brak rekomendacji kariery',
          body:
              'Aby wygenerować analizę rynku, najpierw wygeneruj rekomendacje w Doradcy AI.',
          actionLabel: 'Przejdź do Doradcy',
          onAction: () => context.go(Routes.assistant),
        ),
        MarketReady(:final analysis) when analysis.isEmpty => _HeroState(
          key: const ValueKey('empty'),
          icon: Icons.insights_rounded,
          title: 'Twoja analiza rynku',
          body:
              'Wygeneruj szczegółową analizę rynku pracy na podstawie Twoich rekomendacji kariery.',
          actionLabel: 'Wygeneruj',
          onAction: _generate,
        ),
        MarketReady(:final analysis) => _Results(
          key: const ValueKey('results'),
          analysis: analysis,
          onRegenerate: _generate,
        ),
      },
      AsyncError(:final error) => StateMessage(
        key: const ValueKey('error'),
        icon: Icons.cloud_off_rounded,
        title: 'Nie udało się wczytać analizy',
        message: error is ApiError
            ? error.message
            : 'Spróbuj ponownie za chwilę.',
        actionLabel: 'Spróbuj ponownie',
        onAction: () => ref.invalidate(marketProvider),
      ),
      _ => const _Skeleton(key: ValueKey('loading')),
    };

    return RefreshIndicator.adaptive(
      edgeOffset: shellHeaderExtent(context),
      onRefresh: () => ref.read(marketProvider.notifier).refresh(),
      notificationPredicate: (_) => !_generating,
      child: ListView(
        padding: EdgeInsets.fromLTRB(
          AppSpacing.gutter,
          shellHeaderExtent(context) + 8,
          AppSpacing.gutter,
          shellBottomExtent(context),
        ),
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        children: [
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 350),
            child: body,
          ),
        ],
      ),
    );
  }
}

class _Results extends StatefulWidget {
  const _Results({
    super.key,
    required this.analysis,
    required this.onRegenerate,
  });

  final MarketAnalysis analysis;
  final VoidCallback onRegenerate;

  @override
  State<_Results> createState() => _ResultsState();
}

class _ResultsState extends State<_Results> {
  int _selected = 0;

  @override
  Widget build(BuildContext context) {
    final analysis = widget.analysis;
    final industries = analysis.industries;
    final selected = _selected.clamp(
      0,
      industries.isEmpty ? 0 : industries.length - 1,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const MarketHeader(),
        if (industries.isNotEmpty) ...[
          const SizedBox(height: 28),
          const SectionHeader(title: 'Ścieżki kariery'),
          IndustrySelector(
            industries: [for (final i in industries) i.industry],
            selected: selected,
            onSelect: (i) => setState(() => _selected = i),
          ),
          const SizedBox(height: 14),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            transitionBuilder: (child, animation) => FadeTransition(
              opacity: animation,
              child: SlideTransition(
                position: Tween(
                  begin: const Offset(0, 0.02),
                  end: Offset.zero,
                ).animate(animation),
                child: child,
              ),
            ),
            child: IndustryDetails(
              key: ValueKey(selected),
              industry: industries[selected],
              relatedSkills: analysis.skillsFor(industries[selected].industry),
            ),
          ),
        ],
        if (analysis.trends.isNotEmpty) ...[
          const SizedBox(height: 28),
          const SectionHeader(title: 'Trendy rynkowe'),
          for (final trend in analysis.trends) ...[
            TrendCard(trend: trend),
            const SizedBox(height: 10),
          ],
        ],
        if (analysis.skillDemand.isNotEmpty) ...[
          const SizedBox(height: 18),
          const SectionHeader(title: 'Popyt na umiejętności'),
          SkillDemandList(skills: analysis.skillDemand),
        ],
        const SizedBox(height: 28),
        OutlinePillButton(
          label: 'Wygeneruj nową analizę',
          leading: const Icon(
            Icons.refresh_rounded,
            size: 20,
            color: AppColors.textMuted,
          ),
          onPressed: widget.onRegenerate,
        ),
      ],
    );
  }
}

class _HeroState extends StatelessWidget {
  const _HeroState({
    super.key,
    required this.icon,
    required this.title,
    required this.body,
    required this.actionLabel,
    required this.onAction,
  });

  final IconData icon;
  final String title;
  final String body;
  final String actionLabel;
  final VoidCallback onAction;

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
        PrimaryButton(label: actionLabel, onPressed: onAction),
      ],
    );
  }
}

class _Skeleton extends StatelessWidget {
  const _Skeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return const Column(
      children: [
        SkeletonBox(height: 130, radius: AppSpacing.cardRadius),
        SizedBox(height: 28),
        SkeletonBox(height: 44, radius: 999),
        SizedBox(height: 14),
        SkeletonBox(height: 200, radius: AppSpacing.cardRadius),
        SizedBox(height: 12),
        SkeletonBox(height: 300, radius: AppSpacing.cardRadius),
      ],
    );
  }
}
