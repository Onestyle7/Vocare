import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/glass/liquid_glass.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/buttons.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/glass_widgets.dart';
import '../../dashboard/presentation/widgets/progress_painters.dart';
import '../data/assistant_models.dart';
import '../../roadmap/data/roadmap_repository.dart';
import '../data/assistant_repository.dart';
import 'widgets/assistant_widgets.dart';
import 'widgets/job_offer_card.dart';

/// Everything the web shows inside an expanded career path: info cards,
/// SWOT and matched job offers.
class CareerPathScreen extends ConsumerWidget {
  const CareerPathScreen({super.key, required this.pathId, this.index});

  final String pathId;
  final int? index;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(assistantProvider).value;
    final path = data?.pathById(pathId);
    final top = MediaQuery.paddingOf(context).top;

    return Scaffold(
      body: Stack(
        children: [
          if (path == null)
            const Center(
              child: StateMessage(
                icon: Icons.search_off_rounded,
                title: 'Nie znaleziono ścieżki',
                message:
                    'Ta ścieżka nie należy już do Twojej aktualnej rekomendacji.',
              ),
            )
          else
            _Body(
              path: path,
              index: index,
              match: data!.matchFor(path),
              matchesError: data.matchesError,
            ),
          TopScrollFade(height: top + AppSpacing.navButton + 36),
          Positioned(
            top: top + 8,
            left: AppSpacing.gutter,
            child: const GlassBackButton(),
          ),
        ],
      ),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({
    required this.path,
    required this.index,
    required this.match,
    this.matchesError,
  });

  final CareerPath path;
  final int? index;
  final CareerPathMatch? match;
  final String? matchesError;

  @override
  Widget build(BuildContext context) {
    final probability = path.probability.clamp(0, 100).round();
    final media = MediaQuery.paddingOf(context);

    return ListView(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.gutter,
        media.top + AppSpacing.navButton + 24,
        AppSpacing.gutter,
        media.bottom + 32,
      ),
      children: [
        Row(
          children: [
            if (index != null) ...[
              PathNumber(index! + 1, size: 40),
              const SizedBox(width: 12),
            ],
            Text(
              index == 0 ? 'Najlepsza ścieżka' : 'Alternatywna ścieżka',
              style: AppTypography.label,
            ),
          ],
        ),
        const SizedBox(height: 12),
        Text(
          path.name,
          style: AppTypography.headline.copyWith(color: AppColors.accent),
        ),
        const SizedBox(height: 10),
        Text(
          path.description,
          style: AppTypography.caption.copyWith(
            color: AppColors.textMuted,
            height: 1.6,
          ),
        ),
        const SizedBox(height: 20),
        SurfaceCard(
          padding: const EdgeInsets.all(18),
          child: Row(
            children: [
              RingProgress(
                value: probability / 100,
                size: 76,
                stroke: 8,
                child: Text('$probability%', style: AppTypography.button),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Prawdopodobieństwo sukcesu',
                      style: AppTypography.button,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Ocena AI na podstawie Twojego profilu i sytuacji na rynku.',
                      style: AppTypography.label.copyWith(height: 1.45),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        _RoadmapButton(path: path),
        const SizedBox(height: 20),
        _InfoCarousel(path: path),
        if (!path.swot.isEmpty) ...[
          const SizedBox(height: 28),
          const SectionHeader(title: 'Analiza SWOT'),
          _SwotGrid(swot: path.swot),
        ],
        const SizedBox(height: 28),
        _OffersSection(match: match, error: matchesError),
      ],
    );
  }
}

/// The three web "ReusableCard"s, as a swipeable row.
class _InfoCarousel extends StatelessWidget {
  const _InfoCarousel({required this.path});

  final CareerPath path;

  @override
  Widget build(BuildContext context) {
    final cards = [
      (Icons.bolt_rounded, 'Wymagane umiejętności', path.requiredSkills),
      (Icons.school_outlined, 'Zalecane kursy', path.recommendedCourses),
      (Icons.insights_rounded, 'Analiza rynku', path.marketAnalysis),
    ].where((c) => c.$3.isNotEmpty).toList();
    if (cards.isEmpty) return const SizedBox.shrink();

    final width = MediaQuery.sizeOf(context).width;
    return SizedBox(
      height: 300,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        clipBehavior: Clip.none,
        physics: const PageScrollPhysics(parent: BouncingScrollPhysics()),
        itemCount: cards.length,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (context, i) {
          final (icon, title, items) = cards[i];
          return SizedBox(
            width: width - AppSpacing.gutter * 2 - 28,
            child: SurfaceCard(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 34,
                        height: 34,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: AppColors.brandGradient,
                        ),
                        child: Icon(icon, size: 18, color: Colors.white),
                      ),
                      const SizedBox(width: 10),
                      Expanded(child: Text(title, style: AppTypography.button)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: ListView(
                      padding: EdgeInsets.zero,
                      children: [
                        for (final item in items)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 5,
                                  height: 5,
                                  margin: const EdgeInsets.only(
                                    top: 8,
                                    right: 10,
                                  ),
                                  decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: AppColors.accent,
                                  ),
                                ),
                                Expanded(
                                  child: Text(
                                    item,
                                    style: AppTypography.caption.copyWith(
                                      height: 1.5,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

/// 2×2 SWOT with the web's tints: green, red, blue, orange.
class _SwotGrid extends StatelessWidget {
  const _SwotGrid({required this.swot});

  final Swot swot;

  @override
  Widget build(BuildContext context) {
    const green = Color(0xFF22C55E), red = Color(0xFFEF4444);
    const blue = Color(0xFF3B82F6), orange = Color(0xFFF97316);
    Widget cell(String title, List<String> items, Color tint) =>
        _SwotCell(title: title, items: items, tint: tint);

    return Column(
      children: [
        IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(child: cell('Mocne strony', swot.strengths, green)),
              const SizedBox(width: 10),
              Expanded(child: cell('Słabe strony', swot.weaknesses, red)),
            ],
          ),
        ),
        const SizedBox(height: 10),
        IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(child: cell('Możliwości', swot.opportunities, blue)),
              const SizedBox(width: 10),
              Expanded(child: cell('Zagrożenia', swot.threats, orange)),
            ],
          ),
        ),
      ],
    );
  }
}

class _SwotCell extends StatelessWidget {
  const _SwotCell({
    required this.title,
    required this.items,
    required this.tint,
  });

  final String title;
  final List<String> items;
  final Color tint;

  static const _radius = 22.0;

  @override
  Widget build(BuildContext context) {
    // Clear glass with a thin tinted rim: the colour names the quadrant
    // without washing the text in it. (An explicit exception to "glass is
    // for chrome only" — the SWOT grid is short and text stays high-contrast.)
    return Container(
      foregroundDecoration: ShapeDecoration(
        shape: RoundedSuperellipseBorder(
          borderRadius: BorderRadius.circular(_radius),
          side: BorderSide(color: tint.withValues(alpha: 0.55)),
        ),
      ),
      child: LiquidGlass(
        radius: _radius,
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: AppTypography.label.copyWith(
                color: tint,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            for (final item in items)
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(
                  '• $item',
                  style: AppTypography.label.copyWith(
                    color: AppColors.textPrimary,
                    height: 1.45,
                  ),
                ),
              ),
            if (items.isEmpty) Text('-', style: AppTypography.label),
          ],
        ),
      ),
    );
  }
}

class _OffersSection extends StatelessWidget {
  const _OffersSection({required this.match, this.error});

  final CareerPathMatch? match;
  final String? error;

  @override
  Widget build(BuildContext context) {
    final offers = match?.offers ?? const <ScoredJobOffer>[];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeader(title: 'Dopasowane oferty pracy'),
        Padding(
          padding: const EdgeInsets.fromLTRB(4, 0, 4, 12),
          child: Text(
            'Scoring: embeddingi, umiejętności, kategoria i seniority',
            style: AppTypography.label.copyWith(fontSize: 12),
          ),
        ),
        if (match != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                _StatChip('Średnio ${match!.averageMatchScore.round()}%'),
                _StatChip('Top ${match!.highQualityMatches}'),
                _StatChip('${match!.totalOffersInCategory} w kategorii'),
              ],
            ),
          ),
        if (error != null)
          _Note(
            icon: Icons.error_outline_rounded,
            color: AppColors.danger,
            text: error!,
          )
        else if (match?.dataQualityWarning != null)
          const _Note(
            icon: Icons.auto_awesome_rounded,
            color: AppColors.warning,
            text:
                'Zebrano zbyt mało danych o ofertach pracy, żeby wygenerować dodatkowe statystyki.',
          ),
        if (error == null && offers.isEmpty)
          const SurfaceCard(
            child: Text(
              'Na razie brak ofert dopasowanych do tej ścieżki. Nowe oferty synchronizujemy codziennie.',
              textAlign: TextAlign.center,
            ),
          ),
        for (final offer in offers) ...[
          JobOfferCard(offer: offer),
          const SizedBox(height: 12),
        ],
      ],
    );
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.hairline),
        color: AppColors.surface,
      ),
      child: Text(
        text,
        style: AppTypography.label.copyWith(
          fontSize: 12,
          color: AppColors.textMuted,
        ),
      ),
    );
  }
}

class _Note extends StatelessWidget {
  const _Note({required this.icon, required this.color, required this.text});

  final IconData icon;
  final Color color;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 0, 4, 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: AppTypography.label.copyWith(color: color, height: 1.45),
            ),
          ),
        ],
      ),
    );
  }
}

/// Web: the "Roadmapa" button on each career path.
class _RoadmapButton extends ConsumerWidget {
  const _RoadmapButton({required this.path});

  final CareerPath path;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return OutlinePillButton(
      label: 'Utwórz roadmapę dla tej ścieżki',
      leading: const Icon(
        Icons.map_outlined,
        size: 20,
        color: AppColors.textMuted,
      ),
      onPressed: () {
        ref.read(roadmapCreateIntentProvider.notifier).request(path.id);
        context.go(Routes.roadmap);
      },
    );
  }
}
