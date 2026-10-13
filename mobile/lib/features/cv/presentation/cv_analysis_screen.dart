import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_error.dart';
import '../../../core/network/result.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/buttons.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/generating_view.dart';
import '../../../core/widgets/glass_widgets.dart';
import '../../../core/widgets/pressable.dart';
import '../../billing/data/billing_repository.dart';
import '../../billing/presentation/service_cost_sheet.dart';
import '../../dashboard/presentation/widgets/progress_painters.dart';
import '../data/cv_models.dart';
import '../data/cv_repository.dart';
import 'widgets/cv_sections.dart';

/// What the editor should do when the audit closes.
class AuditJump {
  const AuditJump(this.section, {this.edit = false});

  final CvEditorSection section;

  /// Open the section's editor right away (e.g. to set the target position).
  final bool edit;
}

/// "Analiza jakości CV" — `.agents/instructions/cv-quality-audit-design.md`.
/// Mobile variant: a full-screen sheet with a sticky header.
class CvAnalysisScreen extends ConsumerStatefulWidget {
  const CvAnalysisScreen({super.key, required this.cvId});

  final String cvId;

  @override
  ConsumerState<CvAnalysisScreen> createState() => _CvAnalysisScreenState();
}

class _CvAnalysisScreenState extends ConsumerState<CvAnalysisScreen> {
  bool _analyzing = false;
  String? _error;

  /// Session-only "Do zrobienia" toggles (spec: not persisted).
  final _done = <int>{};

  Future<void> _analyze() async {
    final confirmed = await confirmServiceCost(
      context,
      title: 'Przeanalizować CV?',
      tokenCost: ServiceCosts.analyzeCv,
      icon: Icons.fact_check_outlined,
      actionLabel: 'Analizuj',
    );
    if (!confirmed || !mounted) return;
    // Analyse what the user sees — flush a pending autosave first.
    await ref.read(cvEditorProvider(widget.cvId).notifier).flush();
    setState(() {
      _analyzing = true;
      _error = null;
    });
    final result = await ref
        .read(cvAnalysisProvider(widget.cvId).notifier)
        .analyze();
    if (!mounted) return;
    setState(() => _analyzing = false);
    switch (result) {
      case Ok():
        _done.clear();
        SemanticsService.sendAnnouncement(
          View.of(context),
          'Analiza CV jest gotowa',
          TextDirection.ltr,
        );
      case Err(:final error):
        setState(
          () => _error = error.code == 'INSUFFICIENT_TOKENS'
              ? 'Masz za mało tokenów, aby przeanalizować CV.'
              : 'Nie udało się przeanalizować CV. ${error.message}',
        );
    }
  }

  void _jump(CvEditorSection section, {bool edit = false}) =>
      context.pop(AuditJump(section, edit: edit));

  @override
  Widget build(BuildContext context) {
    final analysis = ref.watch(cvAnalysisProvider(widget.cvId));
    final cv = ref.watch(
      cvEditorProvider(widget.cvId).select((s) => s.value?.cv),
    );
    final top = MediaQuery.paddingOf(context).top;
    final bottom = MediaQuery.paddingOf(context).bottom;

    final Widget body = switch (analysis) {
      AsyncValue(:final value?) => _Results(
        analysis: value,
        targetPosition: cv?.targetPosition ?? '',
        done: _done,
        onToggleDone: (i) =>
            setState(() => _done.contains(i) ? _done.remove(i) : _done.add(i)),
        onJump: _jump,
      ),
      AsyncData() => _EmptyState(onAnalyze: _analyzing ? null : _analyze),
      AsyncError(:final error) => StateMessage(
        icon: Icons.cloud_off_rounded,
        title: 'Nie udało się pobrać ostatniej analizy',
        message: error is ApiError ? error.message : 'Spróbuj ponownie.',
        actionLabel: 'Spróbuj ponownie',
        onAction: () => ref.invalidate(cvAnalysisProvider(widget.cvId)),
      ),
      _ => Padding(
        padding: const EdgeInsets.only(top: 60),
        child: Column(
          children: [
            const CircularProgressIndicator.adaptive(),
            const SizedBox(height: 14),
            Text('Pobieramy ostatnią analizę…', style: AppTypography.label),
          ],
        ),
      ),
    };

    return Scaffold(
      body: Stack(
        children: [
          ListView(
            padding: EdgeInsets.fromLTRB(
              AppSpacing.gutter,
              top + AppSpacing.navButton + 24,
              AppSpacing.gutter,
              bottom + 32,
            ),
            children: [
              Text('Analiza jakości CV', style: AppTypography.headline),
              const SizedBox(height: 4),
              Text(
                [
                  if (cv != null) cv.name,
                  if (cv != null && cv.targetPosition.isNotEmpty)
                    'Cel: ${cv.targetPosition}',
                ].join(' · '),
                style: AppTypography.label,
              ),
              const SizedBox(height: 20),
              if (_analyzing) ...[
                const _AnalyzingCard(),
                const SizedBox(height: 16),
              ],
              if (_error != null) ...[
                _ErrorCard(message: _error!, onRetry: _analyze),
                const SizedBox(height: 16),
              ],
              body,
              if (analysis.value != null) ...[
                const SizedBox(height: 20),
                OutlinePillButton(
                  label: 'Analizuj ponownie',
                  loading: _analyzing,
                  leading: const Icon(
                    Icons.refresh_rounded,
                    size: 20,
                    color: AppColors.textMuted,
                  ),
                  onPressed: _analyze,
                ),
                const SizedBox(height: 10),
                const _CostNote(),
              ],
            ],
          ),
          TopScrollFade(height: top + AppSpacing.navButton + 30),
          Positioned(
            top: top + 8,
            left: AppSpacing.gutter,
            child: const GlassBackButton(icon: Icons.close_rounded),
          ),
        ],
      ),
    );
  }
}

// ── Tiers ───────────────────────────────────────────────────────────────

/// Score tiers from the spec. Violet shades — never alarm red; the label
/// and icon always accompany the colour.
({String label, IconData icon, Color color}) cvScoreTier(int score) =>
    switch (score) {
      < 40 => (
        label: 'Wymaga uzupełnienia',
        icon: Icons.edit_note_rounded,
        color: const Color(0xFFC4B5FD),
      ),
      < 70 => (
        label: 'Dobry fundament',
        icon: Icons.foundation_rounded,
        color: const Color(0xFFA78BFA),
      ),
      < 85 => (
        label: 'Dobre CV',
        icon: Icons.thumb_up_alt_outlined,
        color: const Color(0xFF8B5CF6),
      ),
      _ => (
        label: 'Bardzo mocne CV',
        icon: Icons.workspace_premium_outlined,
        color: const Color(0xFF915EFF),
      ),
    };

// ── States ──────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onAnalyze});

  final VoidCallback? onAnalyze;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SurfaceCard(
          child: Column(
            children: [
              const SizedBox(
                height: 110,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    AmbientGlow(size: 100, opacity: 0.5, blur: 40),
                    Icon(
                      Icons.fact_check_outlined,
                      size: 44,
                      color: Colors.white,
                    ),
                  ],
                ),
              ),
              Text(
                'Sprawdź jakość swojego CV',
                style: AppTypography.title,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Sprawdź mocne strony CV i zobacz, co warto poprawić w pierwszej kolejności. '
                'Ocenimy kompletność, doświadczenie, umiejętności i pozostałe sekcje oraz wskażemy trzy najważniejsze poprawki.',
                style: AppTypography.caption.copyWith(
                  color: AppColors.textMuted,
                  height: 1.6,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                alignment: WrapAlignment.center,
                children: [
                  for (final s in CvSection.values)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(999),
                        color: AppColors.surfaceRaised,
                      ),
                      child: Text(
                        s.label,
                        style: AppTypography.label.copyWith(fontSize: 12),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        PrimaryButton(
          label: 'Analizuj CV',
          onPressed: onAnalyze,
          loading: onAnalyze == null,
        ),
        const SizedBox(height: 12),
        const _CostNote(),
      ],
    );
  }
}

class _CostNote extends StatelessWidget {
  const _CostNote();

  @override
  Widget build(BuildContext context) {
    return Text(
      'Analiza może wykorzystać środki z Twojego planu. '
      'Ocena dotyczy treści CV. Nie jest gwarancją przejścia przez konkretny system ATS.',
      style: AppTypography.label.copyWith(fontSize: 12, height: 1.5),
      textAlign: TextAlign.center,
    );
  }
}

class _AnalyzingCard extends StatelessWidget {
  const _AnalyzingCard();

  @override
  Widget build(BuildContext context) {
    return const SurfaceCard(
      child: GeneratingView(
        title: 'Analizujemy Twoje CV',
        subtitle: 'Zajmie to do minuty. Możesz w tym czasie przeglądać wyniki.',
        stepInterval: Duration(seconds: 8),
        steps: [
          'Sprawdzamy kompletność sekcji',
          'Oceniamy doświadczenie i osiągnięcia',
          'Sprawdzamy umiejętności i języki',
          'Wybieramy najważniejsze poprawki',
        ],
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: AppColors.danger.withValues(alpha: 0.08),
        border: Border.all(color: AppColors.danger.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              message,
              style: AppTypography.label.copyWith(
                color: AppColors.textPrimary,
                height: 1.5,
              ),
            ),
          ),
          TextButton(onPressed: onRetry, child: const Text('Spróbuj ponownie')),
        ],
      ),
    );
  }
}

// ── Results ─────────────────────────────────────────────────────────────

class _Results extends StatelessWidget {
  const _Results({
    required this.analysis,
    required this.targetPosition,
    required this.done,
    required this.onToggleDone,
    required this.onJump,
  });

  final CvAnalysis analysis;
  final String targetPosition;
  final Set<int> done;
  final ValueChanged<int> onToggleDone;
  final void Function(CvEditorSection section, {bool edit}) onJump;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _OverallCard(score: analysis.overallScore),
        const SizedBox(height: 12),
        _TargetCard(
          targetPosition: targetPosition,
          score: analysis.targetPositionScore,
          onSetTarget: () => onJump(CvEditorSection.basics, edit: true),
        ),
        if (analysis.topImprovements.isNotEmpty) ...[
          const SizedBox(height: 28),
          const SectionHeader(title: 'Największy wpływ'),
          for (var i = 0; i < analysis.topImprovements.length; i++) ...[
            _ImprovementCard(
              index: i,
              text: analysis.topImprovements[i],
              done: done.contains(i),
              onToggle: () => onToggleDone(i),
              target: _resolveSection(analysis.topImprovements[i]),
              onJump: onJump,
            ),
            const SizedBox(height: 10),
          ],
        ],
        if (analysis.sections.isNotEmpty) ...[
          const SizedBox(height: 18),
          const SectionHeader(title: 'Ocena sekcji'),
          for (final section in analysis.sectionsByPriority) ...[
            _SectionScoreCard(score: section, onJump: onJump),
            const SizedBox(height: 10),
          ],
        ],
        const SizedBox(height: 8),
        Text(
          'Ocena dotyczy treści CV. Nie jest gwarancją przejścia przez konkretny system ATS.',
          style: AppTypography.label.copyWith(fontSize: 12, height: 1.5),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  /// Improvements are free text; link them to a section only on a clear match.
  static CvEditorSection? _resolveSection(String text) {
    final t = text.toLowerCase();
    const rules = [
      (
        CvEditorSection.experience,
        ['doświadcz', 'obowiąz', 'osiągnię', 'stanowisk'],
      ),
      (
        CvEditorSection.summary,
        ['podsumowan', 'profil osobist', 'opis siebie', 'summary'],
      ),
      (CvEditorSection.education, ['edukac', 'wykształc', 'studi', 'uczel']),
      (CvEditorSection.certificates, ['certyfik', 'kurs']),
      (CvEditorSection.skills, ['umiejętn', 'kompetenc', 'technolog']),
      (CvEditorSection.languages, ['język', 'angielsk']),
      (CvEditorSection.projects, ['projekt']),
      (CvEditorSection.links, ['linkedin', 'github', 'portfolio', 'link']),
      (
        CvEditorSection.basics,
        ['kontakt', 'e-mail', 'telefon', 'dane osobowe'],
      ),
    ];
    for (final (section, stems) in rules) {
      if (stems.any(t.contains)) return section;
    }
    return null;
  }
}

class _OverallCard extends StatefulWidget {
  const _OverallCard({required this.score});

  final int score;

  @override
  State<_OverallCard> createState() => _OverallCardState();
}

class _OverallCardState extends State<_OverallCard> {
  bool _explain = false;

  @override
  Widget build(BuildContext context) {
    final tier = cvScoreTier(widget.score);
    return SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Semantics(
                label: 'Wynik ogólny: ${widget.score} na 100. ${tier.label}',
                excludeSemantics: true,
                child: RingProgress(
                  value: widget.score / 100,
                  size: 104,
                  stroke: 10,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '${widget.score}',
                        style: AppTypography.metric.copyWith(fontSize: 30),
                      ),
                      Text(
                        '/100',
                        style: AppTypography.label.copyWith(fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Wynik ogólny', style: AppTypography.label),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(tier.icon, size: 20, color: tier.color),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            tier.label,
                            style: AppTypography.titleSmall.copyWith(
                              color: tier.color,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Pressable(
            onTap: () => setState(() => _explain = !_explain),
            child: Row(
              children: [
                Text(
                  'Jak działa ten wynik?',
                  style: AppTypography.label.copyWith(color: AppColors.accent),
                ),
                Icon(
                  _explain
                      ? Icons.expand_less_rounded
                      : Icons.expand_more_rounded,
                  size: 18,
                  color: AppColors.accent,
                ),
              ],
            ),
          ),
          AnimatedSize(
            duration: const Duration(milliseconds: 250),
            alignment: Alignment.topCenter,
            child: !_explain
                ? const SizedBox(width: double.infinity)
                : Padding(
                    padding: const EdgeInsets.only(top: 10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'AI ocenia kompletność CV, jakość opisów doświadczenia, umiejętności oraz pozostałe sekcje. '
                          'Wynik ogólny jest prezentowany w skali od 0 do 100.',
                          style: AppTypography.label.copyWith(height: 1.5),
                        ),
                        const SizedBox(height: 10),
                        for (final (range, sample) in const [
                          ('0–39', 10),
                          ('40–69', 50),
                          ('70–84', 75),
                          ('85–100', 90),
                        ])
                          Padding(
                            padding: const EdgeInsets.only(bottom: 6),
                            child: Row(
                              children: [
                                Icon(
                                  cvScoreTier(sample).icon,
                                  size: 16,
                                  color: cvScoreTier(sample).color,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    cvScoreTier(sample).label,
                                    style: AppTypography.label.copyWith(
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                ),
                                Text(range, style: AppTypography.label),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _TargetCard extends StatelessWidget {
  const _TargetCard({
    required this.targetPosition,
    required this.score,
    required this.onSetTarget,
  });

  final String targetPosition;
  final int score;
  final VoidCallback onSetTarget;

  @override
  Widget build(BuildContext context) {
    // CRITICAL (spec): no target position → no "0%", an actionable card instead.
    if (targetPosition.trim().isEmpty) {
      return Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
          color: AppColors.surface,
          border: Border.all(
            color: AppColors.gradientSoft.withValues(alpha: 0.4),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Dopasowanie do stanowiska', style: AppTypography.titleSmall),
            const SizedBox(height: 4),
            Text(
              'Ustaw stanowisko docelowe, aby sprawdzić dopasowanie CV.',
              style: AppTypography.label.copyWith(height: 1.5),
            ),
            const SizedBox(height: 10),
            Pressable(
              onTap: onSetTarget,
              child: Text(
                'Ustaw stanowisko docelowe →',
                style: AppTypography.button.copyWith(
                  color: AppColors.accent,
                  height: 1.4,
                ),
              ),
            ),
          ],
        ),
      );
    }
    return SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Dopasowanie do stanowiska', style: AppTypography.label),
          const SizedBox(height: 2),
          Row(
            children: [
              Expanded(
                child: Text(targetPosition, style: AppTypography.titleSmall),
              ),
              Text('$score/100', style: AppTypography.button),
            ],
          ),
          const SizedBox(height: 10),
          _ScoreBar(value: score),
        ],
      ),
    );
  }
}

class _ScoreBar extends StatelessWidget {
  const _ScoreBar({required this.value});

  final int value;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      value: '$value',
      label: 'Wynik $value na 100',
      child: ClipRRect(
        borderRadius: BorderRadius.circular(4),
        child: SizedBox(
          height: 6,
          child: Stack(
            children: [
              const Positioned.fill(
                child: ColoredBox(color: Color(0xFF1F1F2E)),
              ),
              Positioned.fill(
                child: FractionallySizedBox(
                  alignment: Alignment.centerLeft,
                  widthFactor: value.clamp(0, 100) / 100,
                  child: const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: AppColors.brandGradient,
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

class _ImprovementCard extends StatelessWidget {
  const _ImprovementCard({
    required this.index,
    required this.text,
    required this.done,
    required this.onToggle,
    required this.target,
    required this.onJump,
  });

  final int index;
  final String text;
  final bool done;
  final VoidCallback onToggle;
  final CvEditorSection? target;
  final void Function(CvEditorSection section, {bool edit}) onJump;

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: AppColors.brandGradient,
            ),
            child: Text(
              '${index + 1}',
              style: AppTypography.label.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  text,
                  style: AppTypography.caption.copyWith(
                    height: 1.5,
                    color: done ? AppColors.textSubtle : AppColors.textPrimary,
                    decoration: done ? TextDecoration.lineThrough : null,
                    decorationColor: AppColors.textSubtle,
                  ),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    _SmallAction(
                      label: done ? 'Zrobione' : 'Do zrobienia',
                      icon: done
                          ? Icons.check_circle_rounded
                          : Icons.radio_button_unchecked_rounded,
                      color: done ? AppColors.success : AppColors.textMuted,
                      onTap: onToggle,
                    ),
                    if (target != null)
                      _SmallAction(
                        label: 'Przejdź do sekcji',
                        icon: Icons.arrow_forward_rounded,
                        color: AppColors.accent,
                        onTap: () => onJump(target!),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SmallAction extends StatelessWidget {
  const _SmallAction({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: onTap,
      semanticLabel: label,
      child: ExcludeSemantics(
        child: Container(
          constraints: const BoxConstraints(minHeight: 36),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            color: AppColors.surfaceRaised,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 6),
              Text(label, style: AppTypography.label.copyWith(color: color)),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionScoreCard extends StatelessWidget {
  const _SectionScoreCard({required this.score, required this.onJump});

  final CvSectionScore score;
  final void Function(CvEditorSection section, {bool edit}) onJump;

  @override
  Widget build(BuildContext context) {
    final section = score.section;
    return SurfaceCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text(score.label, style: AppTypography.button)),
              Text(
                '${score.score}/100',
                style: AppTypography.label.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          _ScoreBar(value: score.score),
          if (score.insights.isNotEmpty) ...[
            const SizedBox(height: 10),
            for (final insight in score.insights)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 4,
                      height: 4,
                      margin: const EdgeInsets.only(top: 8, right: 8),
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.accent,
                      ),
                    ),
                    Expanded(
                      child: Text(
                        insight,
                        style: AppTypography.label.copyWith(
                          color: AppColors.textMuted,
                          height: 1.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
          if (section != null) ...[
            const SizedBox(height: 8),
            _SmallAction(
              label: score.score == 0 ? 'Uzupełnij' : 'Popraw sekcję',
              icon: Icons.edit_outlined,
              color: AppColors.accent,
              onTap: () => onJump(CvEditorSection.forAudit(section)),
            ),
          ],
        ],
      ),
    );
  }
}
