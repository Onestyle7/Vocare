import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:printing/printing.dart';

import '../../../core/glass/liquid_glass.dart';
import '../../../core/network/api_error.dart';
import '../../../core/network/result.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/form_sheets.dart';
import '../../../core/widgets/generating_view.dart';
import '../../../core/widgets/glass_widgets.dart';
import '../../../core/widgets/pressable.dart';
import '../../billing/data/billing_repository.dart';
import '../../billing/presentation/service_cost_sheet.dart';
import '../../dashboard/presentation/widgets/progress_painters.dart';
import '../../profile/data/profile_repository.dart';
import '../../profile/data/user_profile.dart';
import '../data/cv_document.dart';
import '../data/cv_models.dart';
import '../data/cv_profile_import.dart';
import '../data/cv_repository.dart';
import '../pdf/cv_pdf.dart';
import 'cv_analysis_screen.dart';
import 'widgets/cv_preview.dart';
import 'widgets/cv_sections.dart';
import 'widgets/offer_sheet.dart';

enum _Mode { edit, preview }

enum _MenuAction { rename, makeDefault, importProfile, print, delete }

/// The CV creator. The web editor is desktop-only; here the same document is
/// edited section by section in sheets, previewed as the real PDF and shared
/// straight from the phone.
class CvEditorScreen extends ConsumerStatefulWidget {
  const CvEditorScreen({
    super.key,
    required this.cvId,
    this.startInPreview = false,
  });

  final String cvId;

  /// Opens on the preview, e.g. right after AI tailoring.
  final bool startInPreview;

  @override
  ConsumerState<CvEditorScreen> createState() => _CvEditorScreenState();
}

class _CvEditorScreenState extends ConsumerState<CvEditorScreen> {
  late _Mode _mode = widget.startInPreview ? _Mode.preview : _Mode.edit;
  final _scroll = ScrollController();
  final _sectionKeys = {
    for (final section in CvEditorSection.values) section: GlobalKey(),
  };
  CvEditorSection? _highlighted;
  Timer? _highlightTimer;
  bool _exporting = false;

  CvDetails? _pdfCv;
  CvDocumentOptions? _pdfOptions;
  Future<Uint8List>? _pdf;

  String get _id => widget.cvId;
  CvEditorController get _editor => ref.read(cvEditorProvider(_id).notifier);

  @override
  void dispose() {
    _highlightTimer?.cancel();
    _scroll.dispose();
    super.dispose();
  }

  /// One render per (CV, options) pair — shared by preview, share and print.
  Future<Uint8List> _document(CvDetails cv, CvDocumentOptions options) {
    if (_pdf == null ||
        !identical(cv, _pdfCv) ||
        !identical(options, _pdfOptions)) {
      _pdfCv = cv;
      _pdfOptions = options;
      _pdf = buildCvPdf(cv, options);
    }
    return _pdf!;
  }

  double _headerExtent(BuildContext context) =>
      MediaQuery.paddingOf(context).top + 8 + AppSpacing.navButton;

  void _setMode(_Mode mode) {
    if (mode == _mode) return;
    HapticFeedback.selectionClick();
    setState(() => _mode = mode);
  }

  // ── Navigation inside the editor ──────────────────────────────────────

  /// Scrolls a section under the header and pulses its border.
  void _reveal(CvEditorSection section) {
    final box = _sectionKeys[section]?.currentContext?.findRenderObject();
    if (box == null || !_scroll.hasClients) return;
    final viewport = RenderAbstractViewport.maybeOf(box);
    if (viewport == null) return;
    final position = _scroll.position;
    final target =
        viewport.getOffsetToReveal(box, 0).offset - _headerExtent(context) - 12;
    _scroll.animateTo(
      target.clamp(position.minScrollExtent, position.maxScrollExtent),
      duration: const Duration(milliseconds: 550),
      curve: Curves.easeOutCubic,
    );
    setState(() => _highlighted = section);
    _highlightTimer?.cancel();
    _highlightTimer = Timer(const Duration(milliseconds: 2400), () {
      if (mounted) setState(() => _highlighted = null);
    });
  }

  Future<void> _openAnalysis() async {
    final jump = await context.push<AuditJump>(Routes.cvAnalysis(_id));
    if (jump == null || !mounted) return;
    setState(() => _mode = _Mode.edit);
    await WidgetsBinding.instance.endOfFrame;
    if (!mounted) return;
    _reveal(jump.section);
    if (jump.edit) {
      await Future<void>.delayed(const Duration(milliseconds: 500));
      if (mounted) await editBasics(context, _editor);
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────

  Future<void> _rename() async {
    final cv = _editor.current;
    if (cv == null) return;
    final action = await showEntrySheet(
      context: context,
      title: 'Nazwa CV',
      fields: const [
        FieldSpec(
          'name',
          'Nazwa (widzisz ją tylko Ty)',
          required: true,
          maxLength: 100,
        ),
      ],
      initial: {'name': cv.name},
    );
    if (action is! EntrySaved) return;
    final name = action.values['name']?.trim() ?? '';
    if (name.isEmpty || name == cv.name) return;
    _editor.edit((cv) => cv.copyWith(name: name));
  }

  Future<void> _makeDefault() async {
    final result = await ref.read(cvListProvider.notifier).setDefault(_id);
    if (!mounted) return;
    if (result.isOk) {
      _editor.patch((cv) => cv.copyWith(isDefault: true));
      showToast(context, 'Ustawiono jako domyślne CV', kind: ToastKind.success);
    } else {
      showToast(
        context,
        'Nie udało się ustawić domyślnego CV',
        kind: ToastKind.error,
      );
    }
  }

  Future<void> _importProfile() async {
    final confirmed = await confirmAction(
      context,
      title: 'Wczytać dane z profilu?',
      message:
          'Dane osobowe, profil osobisty, doświadczenie, edukacja, certyfikaty, umiejętności i języki '
          'zostaną zastąpione danymi z Twojego profilu Vocare. Projekty, linki i zainteresowania zostaną bez zmian.',
      confirmLabel: 'Wczytaj dane',
    );
    if (!confirmed || !mounted) return;
    UserProfile? profile;
    try {
      profile = await ref.refresh(profileProvider.future);
    } on Object {
      profile = null;
    }
    if (!mounted) return;
    if (profile == null || !profileHasCvData(profile)) {
      showToast(
        context,
        'Najpierw uzupełnij profil, żeby przenieść z niego dane.',
        kind: ToastKind.error,
      );
      return;
    }
    final source = profile;
    _editor.editData((data) => cvDataFromProfile(source, current: data));
    showToast(context, 'Wczytano dane z profilu', kind: ToastKind.success);
  }

  Future<void> _print() async {
    final cv = _editor.current;
    if (cv == null) return;
    final options = ref.read(cvOptionsProvider(_id));
    try {
      await Printing.layoutPdf(
        name: cvPdfFileName(cv),
        onLayout: (_) => _document(cv, options),
      );
    } on Object {
      if (mounted) {
        showToast(
          context,
          'Nie udało się otworzyć drukowania',
          kind: ToastKind.error,
        );
      }
    }
  }

  Future<void> _delete() async {
    final confirmed = await confirmAction(
      context,
      title: 'Usunąć CV?',
      message: 'Ta akcja nie może być cofnięta.',
      confirmLabel: 'Tak, chcę usunąć',
      cancelLabel: 'Zachowaj CV',
      destructive: true,
    );
    if (!confirmed || !mounted) return;
    _editor.discard();
    final result = await ref.read(cvListProvider.notifier).delete(_id);
    if (!mounted) return;
    if (result.isOk) {
      showToast(context, 'CV zostało usunięte', kind: ToastKind.success);
      context.popOrGo(Routes.cv);
    } else {
      showToast(context, 'Nie udało się usunąć CV', kind: ToastKind.error);
    }
  }

  Future<void> _export(BuildContext anchor) async {
    final cv = _editor.current;
    if (cv == null || _exporting) return;
    if (cv.data.isEmpty) {
      showToast(context, 'Uzupełnij CV, zanim je pobierzesz.');
      return;
    }
    // iPad needs an anchor for the share popover.
    final box = anchor.findRenderObject() as RenderBox?;
    final bounds = box == null
        ? null
        : box.localToGlobal(Offset.zero) & box.size;
    setState(() => _exporting = true);
    try {
      final bytes = await _document(cv, ref.read(cvOptionsProvider(_id)));
      await Printing.sharePdf(
        bytes: bytes,
        filename: cvPdfFileName(cv),
        bounds: bounds,
      );
    } on Object {
      if (mounted) {
        showToast(
          context,
          'Nie udało się przygotować PDF. Spróbuj ponownie.',
          kind: ToastKind.error,
        );
      }
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  Future<void> _tailor() async {
    final cv = _editor.current;
    if (cv == null) return;
    final limits = ref.read(cvListProvider).value?.limits;
    final offer = await showOfferSheet(
      context,
      title: 'Dopasuj CV do oferty',
      subtitle:
          'Wklej ogłoszenie, a AI dopasuje treść CV do wymagań tej oferty na podstawie tego, co już zawiera.',
      actionLabel: 'Dalej',
      initialPosition: cv.targetPosition,
      tailoring: true,
      canCreateCopy: limits?.canCreateNew ?? true,
    );
    if (offer == null || !mounted) return;
    final confirmed = await confirmServiceCost(
      context,
      title: 'Dopasować CV do oferty?',
      tokenCost: ServiceCosts.tailorCv,
      icon: Icons.auto_awesome_rounded,
      actionLabel: 'Dopasuj',
    );
    if (!confirmed || !mounted) return;

    // The AI reads the stored CV, so pending edits go out first.
    await _editor.flush();
    if (!mounted) return;
    if (ref.read(cvEditorProvider(_id)).value?.status == SaveStatus.failed) {
      showToast(
        context,
        'Nie udało się zapisać zmian. Spróbuj ponownie, zanim dopasujesz CV.',
        kind: ToastKind.error,
      );
      return;
    }
    final source = _editor.current!;
    final list = ref.read(cvListProvider.notifier);
    final result = await runWithProgress(
      context,
      () => offer.replace
          ? _editor.tailorInPlace(
              position: offer.position,
              jobDescription: offer.description,
            )
          : list.tailorAsCopy(
              source: source,
              position: offer.position,
              jobDescription: offer.description,
            ),
      progress: const GeneratingView.cvTailor(),
    );
    if (!mounted) return;
    switch (result) {
      case Ok() when offer.replace:
        showToast(
          context,
          'CV zostało dopasowane do oferty',
          kind: ToastKind.success,
        );
        setState(() => _mode = _Mode.preview);
      case Ok(:final value):
        showToast(
          context,
          'Zapisano nowe CV dopasowane do oferty',
          kind: ToastKind.success,
        );
        context.pushReplacement(Routes.cvEditor(value.id), extra: true);
      case Err(:final error):
        showToast(context, error.message, kind: ToastKind.error);
    }
  }

  Future<void> _menu() async {
    final cv = _editor.current;
    if (cv == null) return;
    Widget tile(
      _MenuAction action,
      IconData icon,
      String label,
      BuildContext sheet,
    ) {
      final destructive = action == _MenuAction.delete;
      final color = destructive ? AppColors.danger : AppColors.textPrimary;
      return ListTile(
        leading: Icon(icon, color: color),
        title: Text(label, style: AppTypography.body.copyWith(color: color)),
        onTap: () => Navigator.pop(sheet, action),
      );
    }

    final action = await showGlassSheet<_MenuAction>(
      context: context,
      builder: (sheet) => Padding(
        padding: const EdgeInsets.fromLTRB(12, 14, 12, 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              cv.name.isEmpty ? 'Moje CV' : cv.name,
              style: AppTypography.titleSmall,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
            tile(
              _MenuAction.rename,
              Icons.drive_file_rename_outline_rounded,
              'Zmień nazwę',
              sheet,
            ),
            if (!cv.isDefault)
              tile(
                _MenuAction.makeDefault,
                Icons.star_outline_rounded,
                'Ustaw jako domyślne',
                sheet,
              ),
            tile(
              _MenuAction.importProfile,
              Icons.person_outline_rounded,
              'Wczytaj dane z profilu',
              sheet,
            ),
            tile(_MenuAction.print, Icons.print_outlined, 'Drukuj', sheet),
            tile(
              _MenuAction.delete,
              Icons.delete_outline_rounded,
              'Usuń CV',
              sheet,
            ),
          ],
        ),
      ),
    );
    if (!mounted || action == null) return;
    switch (action) {
      case _MenuAction.rename:
        await _rename();
      case _MenuAction.makeDefault:
        await _makeDefault();
      case _MenuAction.importProfile:
        await _importProfile();
      case _MenuAction.print:
        await _print();
      case _MenuAction.delete:
        await _delete();
    }
  }

  // ── Build ─────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final editor = ref.watch(cvEditorProvider(_id));
    final top = MediaQuery.paddingOf(context).top;
    final bottom = MediaQuery.paddingOf(context).bottom;
    final header = _headerExtent(context);
    final barBottom = math.max(bottom, 16.0) + 4;
    final contentBottom = barBottom + _ActionBar.height + 28;
    final ready = editor.value != null;
    final preview = ready && _mode == _Mode.preview;

    final Widget content = switch (editor) {
      AsyncValue(:final value?) => Stack(
        children: [
          // Kept mounted: scroll position and section keys survive a switch.
          Offstage(
            offstage: preview,
            child: TickerMode(
              enabled: !preview,
              child: _EditPane(
                state: value,
                cvId: _id,
                controller: _scroll,
                sectionKeys: _sectionKeys,
                highlighted: _highlighted,
                padding: EdgeInsets.fromLTRB(
                  AppSpacing.gutter,
                  header + 22,
                  AppSpacing.gutter,
                  contentBottom,
                ),
                onRename: _rename,
                onRetrySave: _editor.save,
                onOpenAnalysis: _openAnalysis,
              ),
            ),
          ),
          if (preview)
            _FadeIn(
              child: CvPdfPreview(
                document: _document(
                  value.cv,
                  ref.watch(cvOptionsProvider(_id)),
                ),
                padding: EdgeInsets.only(
                  top: header + _AppearanceBar.height + 26,
                  bottom: contentBottom - 14,
                ),
              ),
            ),
        ],
      ),
      AsyncError(:final error) => Center(
        child: StateMessage(
          icon: Icons.cloud_off_rounded,
          title: 'Nie udało się otworzyć CV',
          message: error is ApiError
              ? error.message
              : 'Spróbuj ponownie za chwilę.',
          actionLabel: 'Spróbuj ponownie',
          onAction: () => ref.invalidate(cvEditorProvider(_id)),
        ),
      ),
      _ => _EditorSkeleton(top: header + 22),
    };

    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(child: content),
          // Solid behind the whole control row (section titles must not show
          // between the buttons), then a short fade that ends where the
          // content starts at rest, so nothing is veiled before scrolling.
          TopScrollFade(
            solidHeight: preview ? header + 12 + _AppearanceBar.height : header,
            height: preview ? header + _AppearanceBar.height + 26 : header + 22,
          ),
          Positioned(
            top: top + 8,
            left: AppSpacing.gutter,
            right: AppSpacing.gutter,
            child: Row(
              children: [
                GlassBackButton(onPressed: () => context.popOrGo(Routes.cv)),
                Expanded(
                  child: Center(
                    child: ready
                        ? _ModeSwitch(mode: _mode, onChanged: _setMode)
                        : null,
                  ),
                ),
                GlassIconButton(
                  size: AppSpacing.navButton,
                  semanticLabel: 'Więcej opcji',
                  onPressed: ready ? _menu : null,
                  child: const Icon(
                    Icons.more_horiz_rounded,
                    size: 24,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          if (preview)
            Positioned(
              top: header + 12,
              left: 0,
              right: 0,
              child: _FadeIn(child: _AppearanceBar(cvId: _id)),
            ),
          if (ready)
            Positioned(
              left: AppSpacing.gutter,
              right: AppSpacing.gutter,
              bottom: barBottom,
              child: Center(
                child: _ActionBar(
                  overPage: preview,
                  exporting: _exporting,
                  onTailor: _tailor,
                  onAnalysis: _openAnalysis,
                  onExport: _export,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ── Edit pane ───────────────────────────────────────────────────────────

class _EditPane extends StatelessWidget {
  const _EditPane({
    required this.state,
    required this.cvId,
    required this.controller,
    required this.sectionKeys,
    required this.highlighted,
    required this.padding,
    required this.onRename,
    required this.onRetrySave,
    required this.onOpenAnalysis,
  });

  final CvEditorState state;
  final String cvId;
  final ScrollController controller;
  final Map<CvEditorSection, GlobalKey> sectionKeys;
  final CvEditorSection? highlighted;
  final EdgeInsets padding;
  final VoidCallback onRename;
  final VoidCallback onRetrySave;
  final VoidCallback onOpenAnalysis;

  @override
  Widget build(BuildContext context) {
    final cv = state.cv;
    return ListView(
      controller: controller,
      padding: padding,
      physics: const AlwaysScrollableScrollPhysics(
        parent: BouncingScrollPhysics(),
      ),
      children: [
        Pressable(
          onTap: onRename,
          scale: 0.99,
          semanticLabel: 'Zmień nazwę CV: ${cv.name}',
          child: ExcludeSemantics(
            child: Row(
              children: [
                Flexible(
                  child: Text(
                    cv.name.isEmpty ? 'Moje CV' : cv.name,
                    style: AppTypography.headline,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(
                  Icons.edit_outlined,
                  size: 18,
                  color: AppColors.textSubtle,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 6),
        Row(
          children: [
            _SaveIndicator(status: state.status, onRetry: onRetrySave),
            if (cv.isDefault) ...[
              const _Dot(),
              Text(
                'Domyślne CV',
                style: AppTypography.label.copyWith(color: AppColors.accent),
              ),
            ],
          ],
        ),
        const SizedBox(height: 18),
        _AuditCard(cvId: cvId, onOpen: onOpenAnalysis),
        const SizedBox(height: 22),
        CvSectionsList(
          cvId: cvId,
          sectionKeys: sectionKeys,
          highlighted: highlighted,
        ),
        const SizedBox(height: 4),
        Text(
          'Zmiany zapisują się automatycznie.',
          style: AppTypography.label.copyWith(fontSize: 12),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

class _Dot extends StatelessWidget {
  const _Dot();

  @override
  Widget build(BuildContext context) => Container(
    width: 3,
    height: 3,
    margin: const EdgeInsets.symmetric(horizontal: 8),
    decoration: const BoxDecoration(
      shape: BoxShape.circle,
      color: AppColors.textSubtle,
    ),
  );
}

class _SaveIndicator extends StatelessWidget {
  const _SaveIndicator({required this.status, required this.onRetry});

  final SaveStatus status;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final Widget child = switch (status) {
      SaveStatus.saved => _row(
        const Icon(
          Icons.cloud_done_outlined,
          size: 15,
          color: AppColors.textSubtle,
        ),
        Text('Zapisano', style: AppTypography.label),
      ),
      SaveStatus.pending || SaveStatus.saving => _row(
        const SizedBox.square(
          dimension: 11,
          child: CircularProgressIndicator(
            strokeWidth: 1.6,
            color: AppColors.textSubtle,
          ),
        ),
        Text('Zapisywanie…', style: AppTypography.label),
      ),
      SaveStatus.failed => Pressable(
        onTap: onRetry,
        semanticLabel: 'Nie udało się zapisać. Ponów zapis',
        child: _row(
          const Icon(
            Icons.error_outline_rounded,
            size: 15,
            color: AppColors.danger,
          ),
          Text.rich(
            TextSpan(
              text: 'Nie udało się zapisać · ',
              style: AppTypography.label.copyWith(color: AppColors.danger),
              children: [
                TextSpan(
                  text: 'Ponów',
                  style: AppTypography.label.copyWith(
                    color: AppColors.accent,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    };
    return Semantics(
      liveRegion: true,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 200),
        child: KeyedSubtree(
          key: ValueKey(
            status == SaveStatus.pending ? SaveStatus.saving : status,
          ),
          child: child,
        ),
      ),
    );
  }

  static Widget _row(Widget icon, Widget text) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [icon, const SizedBox(width: 6), text],
  );
}

/// Entry point to the audit. Reading the stored result is free; analysing
/// happens only on the audit screen, after an explicit tap.
class _AuditCard extends ConsumerWidget {
  const _AuditCard({required this.cvId, required this.onOpen});

  final String cvId;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final analysis = ref.watch(cvAnalysisProvider(cvId)).value;
    final tier = analysis == null ? null : cvScoreTier(analysis.overallScore);
    return SurfaceCard(
      onTap: onOpen,
      padding: const EdgeInsets.fromLTRB(16, 14, 12, 14),
      child: Row(
        children: [
          if (analysis != null)
            Semantics(
              label: 'Wynik ogólny ${analysis.overallScore} na 100',
              excludeSemantics: true,
              child: RingProgress(
                value: analysis.overallScore / 100,
                size: 54,
                stroke: 5,
                child: Text(
                  '${analysis.overallScore}',
                  style: AppTypography.button,
                ),
              ),
            )
          else
            Container(
              width: 50,
              height: 50,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppColors.brandGradient,
              ),
              child: const Icon(
                Icons.fact_check_outlined,
                color: Colors.white,
                size: 23,
              ),
            ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Analiza jakości CV',
                  style: AppTypography.button.copyWith(height: 1.3),
                ),
                const SizedBox(height: 2),
                if (tier != null)
                  Row(
                    children: [
                      Icon(tier.icon, size: 15, color: tier.color),
                      const SizedBox(width: 5),
                      Flexible(
                        child: Text(
                          tier.label,
                          style: AppTypography.label.copyWith(
                            color: tier.color,
                          ),
                        ),
                      ),
                    ],
                  )
                else
                  Text(
                    'Sprawdź mocne strony CV i zobacz, co warto poprawić w pierwszej kolejności.',
                    style: AppTypography.label.copyWith(height: 1.45),
                  ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: AppColors.textSubtle),
        ],
      ),
    );
  }
}

class _EditorSkeleton extends StatelessWidget {
  const _EditorSkeleton({required this.top});

  final double top;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.fromLTRB(
        AppSpacing.gutter,
        top,
        AppSpacing.gutter,
        0,
      ),
      children: const [
        SkeletonBox(height: 34, width: 190, radius: 10),
        SizedBox(height: 10),
        SkeletonBox(height: 14, width: 90, radius: 6),
        SizedBox(height: 22),
        SkeletonBox(height: 82, radius: AppSpacing.cardRadius),
        SizedBox(height: 22),
        SkeletonBox(height: 150, radius: AppSpacing.cardRadius),
        SizedBox(height: 12),
        SkeletonBox(height: 110, radius: AppSpacing.cardRadius),
        SizedBox(height: 12),
        SkeletonBox(height: 110, radius: AppSpacing.cardRadius),
      ],
    );
  }
}

class _FadeIn extends StatelessWidget {
  const _FadeIn({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 240),
      curve: Curves.easeOutCubic,
      builder: (_, t, child) => Opacity(opacity: t, child: child),
      child: child,
    );
  }
}

// ── Header & bars ───────────────────────────────────────────────────────

/// "Edycja | Podgląd" — a glass capsule with the tab bar's gradient puck.
class _ModeSwitch extends StatelessWidget {
  const _ModeSwitch({required this.mode, required this.onChanged});

  final _Mode mode;
  final ValueChanged<_Mode> onChanged;

  static const _width = 200.0;
  static const _height = AppSpacing.navButton;
  static const _inset = 5.0;

  @override
  Widget build(BuildContext context) {
    const slot = (_width - _inset * 2) / 2;
    return SizedBox(
      width: _width,
      height: _height,
      child: LiquidGlass(
        radius: _height / 2,
        tint: const Color(0x7320232D),
        child: Stack(
          children: [
            AnimatedPositioned(
              duration: const Duration(milliseconds: 380),
              curve: Curves.easeOutBack,
              left: _inset + slot * mode.index,
              top: _inset,
              width: slot,
              height: _height - _inset * 2,
              child: const DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.all(Radius.circular(999)),
                  gradient: AppColors.brandGradient,
                  boxShadow: [
                    BoxShadow(
                      color: Color(0x40915EFF),
                      blurRadius: 14,
                      offset: Offset(0, 3),
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: _inset),
              child: Row(
                children: [
                  for (final m in _Mode.values)
                    Expanded(
                      child: Semantics(
                        button: true,
                        selected: m == mode,
                        child: GestureDetector(
                          behavior: HitTestBehavior.opaque,
                          onTap: () => onChanged(m),
                          child: Center(
                            child: AnimatedDefaultTextStyle(
                              duration: const Duration(milliseconds: 200),
                              style: AppTypography.button.copyWith(
                                fontSize: 14,
                                color: m == mode
                                    ? Colors.white
                                    : AppColors.textMuted,
                              ),
                              child: Text(
                                m == _Mode.edit ? 'Edycja' : 'Podgląd',
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Floating glass toolbar: the three things you do with a finished CV.
class _ActionBar extends StatelessWidget {
  const _ActionBar({
    required this.overPage,
    required this.exporting,
    required this.onTailor,
    required this.onAnalysis,
    required this.onExport,
  });

  /// Over the white PDF page the glass needs a dark tint, or the white
  /// labels vanish in the light refraction.
  final bool overPage;
  final bool exporting;
  final VoidCallback onTailor;
  final VoidCallback onAnalysis;
  final ValueChanged<BuildContext> onExport;

  static const height = 64.0;

  @override
  Widget build(BuildContext context) {
    final width = math.min(MediaQuery.sizeOf(context).width - 32, 400.0);
    return SizedBox(
      width: width,
      height: height,
      child: LiquidGlass(
        radius: height / 2,
        tint: Color(overPage ? 0xE61C1E26 : 0x7320232D),
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Row(
            children: [
              Expanded(
                child: _BarAction(
                  icon: Icons.auto_awesome_rounded,
                  label: 'Dopasuj',
                  onTap: onTailor,
                ),
              ),
              Expanded(
                child: _BarAction(
                  icon: Icons.fact_check_outlined,
                  label: 'Analiza',
                  onTap: onAnalysis,
                ),
              ),
              Builder(
                builder: (anchor) => Pressable(
                  onTap: exporting ? null : () => onExport(anchor),
                  scale: 0.96,
                  semanticLabel: 'Pobierz PDF',
                  child: ExcludeSemantics(
                    child: Container(
                      height: height - 16,
                      padding: const EdgeInsets.symmetric(horizontal: 18),
                      decoration: const BoxDecoration(
                        borderRadius: BorderRadius.all(Radius.circular(999)),
                        gradient: AppColors.brandGradient,
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (exporting)
                            const SizedBox.square(
                              dimension: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          else
                            const Icon(
                              Icons.ios_share_rounded,
                              size: 18,
                              color: Colors.white,
                            ),
                          const SizedBox(width: 8),
                          Text(
                            'Pobierz PDF',
                            style: AppTypography.button.copyWith(
                              fontSize: 14,
                              color: Colors.white,
                            ),
                          ),
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

class _BarAction extends StatelessWidget {
  const _BarAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: onTap,
      scale: 0.92,
      semanticLabel: label,
      child: ExcludeSemantics(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 21, color: AppColors.textPrimary),
            const SizedBox(height: 2),
            Text(
              label,
              style: AppTypography.label.copyWith(
                fontSize: 11,
                color: AppColors.textMuted,
                height: 1.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Document options above the preview — language, date format, colour.
/// The GDPR clause is content, so it lives with the sections in "Edycja".
class _AppearanceBar extends ConsumerWidget {
  const _AppearanceBar({required this.cvId});

  final String cvId;

  static const height = 40.0;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final options = ref.watch(cvOptionsProvider(cvId));
    void update(CvDocumentOptions Function(CvDocumentOptions) change) {
      HapticFeedback.selectionClick();
      ref.read(cvOptionsProvider(cvId).notifier).update(change);
    }

    // Everything stays visible; narrow phones scale the row down a little
    // instead of hiding options behind a horizontal scroll.
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.gutter),
      child: SizedBox(
        height: height,
        child: FittedBox(
          fit: BoxFit.scaleDown,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _Capsule(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    for (final locale in CvLocale.values)
                      _Segment(
                        label: locale.code,
                        semanticLabel: 'Język CV: ${locale.label}',
                        selected: options.locale == locale,
                        onTap: () => update((o) => o.copyWith(locale: locale)),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              _Capsule(
                onTap: () => update(
                  (o) => o.copyWith(
                    dateStyle: o.dateStyle == CvDateStyle.monthYear
                        ? CvDateStyle.year
                        : CvDateStyle.monthYear,
                  ),
                ),
                semanticLabel: 'Format dat: ${options.dateStyle.label}',
                child: _ChipContent(
                  icon: Icons.calendar_month_outlined,
                  label: options.dateStyle.label,
                ),
              ),
              const SizedBox(width: 8),
              _Capsule(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    for (final accent in CvAccent.values)
                      _AccentDot(
                        accent: accent,
                        selected: options.accent == accent,
                        onTap: () => update((o) => o.copyWith(accent: accent)),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Capsule extends StatelessWidget {
  const _Capsule({required this.child, this.onTap, this.semanticLabel});

  final Widget child;
  final VoidCallback? onTap;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final capsule = Container(
      height: _AppearanceBar.height,
      padding: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        color: AppColors.surfaceRaised,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.hairline),
      ),
      child: child,
    );
    return onTap == null
        ? capsule
        : Pressable(
            onTap: onTap,
            scale: 0.96,
            semanticLabel: semanticLabel,
            child: ExcludeSemantics(child: capsule),
          );
  }
}

class _ChipContent extends StatelessWidget {
  const _ChipContent({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: AppColors.textMuted),
          const SizedBox(width: 6),
          Text(
            label,
            style: AppTypography.label.copyWith(color: AppColors.textPrimary),
          ),
        ],
      ),
    );
  }
}

class _Segment extends StatelessWidget {
  const _Segment({
    required this.label,
    required this.semanticLabel,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final String semanticLabel;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: selected,
      label: semanticLabel,
      excludeSemantics: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          height: _AppearanceBar.height - 10,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            gradient: selected ? AppColors.brandGradient : null,
          ),
          child: Text(
            label,
            style: AppTypography.label.copyWith(
              fontWeight: FontWeight.w600,
              color: selected ? Colors.white : AppColors.textMuted,
            ),
          ),
        ),
      ),
    );
  }
}

class _AccentDot extends StatelessWidget {
  const _AccentDot({
    required this.accent,
    required this.selected,
    required this.onTap,
  });

  final CvAccent accent;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    // "Klasyczny" is the multi-colour web look; the rest are monochrome.
    final fill = accent == CvAccent.classic
        ? SweepGradient(
            colors: [
              accent.skillFg,
              accent.languageFg,
              accent.hobbyFg,
              accent.skillFg,
            ],
          )
        : LinearGradient(colors: [accent.skillFg, accent.title]);
    return Semantics(
      button: true,
      selected: selected,
      label: 'Kolor: ${accent.label}',
      excludeSemantics: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 3),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 24,
            height: 24,
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: selected ? Colors.white : Colors.transparent,
                width: 1.6,
              ),
            ),
            child: DecoratedBox(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: fill,
                border: Border.all(color: const Color(0x33FFFFFF)),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
