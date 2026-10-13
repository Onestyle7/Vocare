import 'dart:async';

import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import 'feedback.dart';
import 'glass_widgets.dart';

/// Shown while a long AI generation runs. Mirrors the web "terminal" with
/// progressive steps, in the app's visual language.
class GeneratingView extends StatefulWidget {
  const GeneratingView({
    super.key,
    required this.title,
    required this.steps,
    this.subtitle = 'To zwykle trwa do minuty — możesz zostać na tym ekranie.',
    this.stepInterval = const Duration(seconds: 7),
  });

  /// Recommendations in the AI assistant.
  const GeneratingView.recommendations({super.key})
    : title = 'Tworzę Twoje rekomendacje',
      subtitle = 'To zwykle trwa do minuty — możesz zostać na tym ekranie.',
      stepInterval = const Duration(seconds: 7),
      steps = const [
        'Analizuję Twój profil',
        'Sprawdzam zapotrzebowanie na rynku pracy',
        'Dobieram ścieżki kariery',
        'Oceniam szanse i ryzyka (SWOT)',
        'Przygotowuję plan działania',
      ];

  /// Market analysis for the recommended career paths.
  const GeneratingView.marketAnalysis({super.key})
    : title = 'Analizuję rynek pracy',
      subtitle = 'To zwykle trwa do minuty — możesz zostać na tym ekranie.',
      stepInterval = const Duration(seconds: 7),
      steps = const [
        'Zbieram dane o Twoich ścieżkach kariery',
        'Sprawdzam widełki wynagrodzeń',
        'Oceniam popyt na umiejętności',
        'Szacuję trudność wejścia',
        'Przygotowuję wnioski narratora AI',
      ];

  /// AI CV written for a job offer.
  const GeneratingView.cvForOffer({super.key})
    : title = 'Tworzę CV pod ofertę',
      subtitle = 'To zwykle trwa do minuty — nie zamykaj aplikacji.',
      stepInterval = const Duration(seconds: 6),
      steps = const [
        'Czytam ogłoszenie',
        'Dobieram Twoje doświadczenie',
        'Piszę podsumowanie i obowiązki',
        'Układam CV',
      ];

  /// Existing CV rewritten for a job offer.
  const GeneratingView.cvTailor({super.key})
    : title = 'Dopasowuję CV do oferty',
      subtitle = 'To zwykle trwa do minuty — nie zamykaj aplikacji.',
      stepInterval = const Duration(seconds: 6),
      steps = const [
        'Czytam ogłoszenie',
        'Porównuję je z Twoim CV',
        'Przepisuję opisy i umiejętności',
        'Zapisuję nową wersję',
      ];

  final String title;
  final String subtitle;
  final List<String> steps;

  /// The last step stays "in progress" until the response arrives.
  final Duration stepInterval;

  @override
  State<GeneratingView> createState() => _GeneratingViewState();
}

class _GeneratingViewState extends State<GeneratingView>
    with SingleTickerProviderStateMixin {
  late final _pulse = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  )..repeat(reverse: true);
  late final Timer _timer;
  int _current = 0;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(widget.stepInterval, (_) {
      if (_current < widget.steps.length - 1) setState(() => _current++);
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      liveRegion: true,
      label: widget.title,
      child: Column(
        children: [
          SizedBox(
            height: 200,
            child: Stack(
              alignment: Alignment.center,
              children: [
                FadeTransition(
                  opacity: Tween(begin: 0.35, end: 0.8).animate(_pulse),
                  child: const AmbientGlow(size: 170, opacity: 1, blur: 60),
                ),
                ScaleTransition(
                  scale: Tween(begin: 0.96, end: 1.04).animate(
                    CurvedAnimation(
                      parent: _pulse,
                      curve: Curves.easeInOutSine,
                    ),
                  ),
                  child: const VocareLogo(size: 84),
                ),
              ],
            ),
          ),
          Text(
            widget.title,
            style: AppTypography.title,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            widget.subtitle,
            style: AppTypography.caption.copyWith(color: AppColors.textMuted),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 28),
          SurfaceCard(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
            child: Column(
              children: [
                for (var i = 0; i < widget.steps.length; i++)
                  AnimatedOpacity(
                    duration: const Duration(milliseconds: 400),
                    opacity: i <= _current ? 1 : 0.3,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(
                        children: [
                          SizedBox.square(
                            dimension: 20,
                            child: i < _current
                                ? const Icon(
                                    Icons.check_circle_rounded,
                                    size: 20,
                                    color: AppColors.success,
                                  )
                                : i == _current
                                ? const CircularProgressIndicator(
                                    strokeWidth: 2,
                                  )
                                : const Icon(
                                    Icons.circle_outlined,
                                    size: 18,
                                    color: AppColors.textSubtle,
                                  ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              widget.steps[i],
                              style: AppTypography.caption.copyWith(
                                height: 1.4,
                              ),
                            ),
                          ),
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

/// Runs [task] behind a full-screen, non-dismissible progress view — for AI
/// operations whose result the next screen depends on.
Future<T> runWithProgress<T>(
  BuildContext context,
  Future<T> Function() task, {
  required Widget progress,
}) async {
  final navigator = Navigator.of(context, rootNavigator: true);
  var open = true;
  showGeneralDialog<void>(
    context: context,
    barrierDismissible: false,
    barrierColor: AppColors.background.withValues(alpha: 0.96),
    transitionDuration: const Duration(milliseconds: 260),
    pageBuilder: (context, _, _) => PopScope(
      canPop: false,
      child: Material(
        type: MaterialType.transparency,
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: progress,
            ),
          ),
        ),
      ),
    ),
    transitionBuilder: (_, animation, _, child) =>
        FadeTransition(opacity: animation, child: child),
  ).whenComplete(() => open = false);
  try {
    return await task();
  } finally {
    if (open) navigator.pop();
  }
}
