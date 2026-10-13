import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/buttons.dart';
import '../../core/widgets/glass_widgets.dart';
import '../../core/widgets/pressable.dart';
import 'onboarding_state.dart';

class _Slide {
  const _Slide(this.title, this.body, this.art);
  final String title;
  final String body;
  final Widget art;
}

/// "Entry Screen 01–3" from Figma: art on the canvas, copy on a raised sheet.
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen>
    with SingleTickerProviderStateMixin {
  final _pages = PageController();
  late final _float = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 4),
  )..repeat(reverse: true);
  double _page = 0;

  static const _slides = [
    _Slide(
      'Doradca Zawodowy\nw Twoim telefonie',
      'AI analizuje Twój profil i tworzy ścieżki\nkariery, CV pod ATS i plan działania.',
      _PuzzleArt(),
    ),
    _Slide(
      'Kreator CV\ni Roadmapy',
      'Vocare zamienia Twój profil w plan:\npokazuje dokąd możesz pójść i ile na tym zarobisz',
      _ImageArt('assets/images/onboarding_magnifier.png', size: 277, angle: 36),
    ),
    _Slide(
      'Spersonalizowane\nścieżki kariery',
      'Algorytm analizuje scenariusze, by stworzyć dla Ciebie precyzyjny i wieloletni plan',
      _ImageArt('assets/images/onboarding_fork.png', size: 282),
    ),
  ];

  int get _index => _page.round();

  @override
  void initState() {
    super.initState();
    _pages.addListener(() => setState(() => _page = _pages.page ?? 0));
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Decode the large art up front so swiping never shows a blank frame.
    for (final path in const [
      'assets/images/onboarding_puzzle_top.png',
      'assets/images/onboarding_puzzle_bottom.png',
      'assets/images/onboarding_magnifier.png',
      'assets/images/onboarding_fork.png',
    ]) {
      precacheImage(AssetImage(path), context);
    }
  }

  @override
  void dispose() {
    _pages.dispose();
    _float.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    await ref.read(onboardingSeenProvider.notifier).markSeen();
    if (mounted) context.go(Routes.signIn);
  }

  void _next() {
    if (_index == _slides.length - 1) {
      _finish();
    } else {
      _pages.nextPage(
        duration: const Duration(milliseconds: 520),
        curve: Curves.easeOutCubic,
      );
    }
  }

  void _back() => _pages.previousPage(
    duration: const Duration(milliseconds: 520),
    curve: Curves.easeOutCubic,
  );

  @override
  Widget build(BuildContext context) {
    final padding = MediaQuery.paddingOf(context);

    return Scaffold(
      body: LayoutBuilder(
        builder: (context, constraints) {
          // The Figma frame is 874pt tall; the sheet starts at 451pt.
          final sheetHeight = math.max(
            380.0,
            constraints.maxHeight * 423 / 874,
          );
          final artHeight = constraints.maxHeight - sheetHeight;

          return Stack(
            children: [
              Positioned(
                top: artHeight * 0.4 - 71,
                left: 0,
                right: 0,
                child: const Center(child: AmbientGlow(blur: 110)),
              ),
              Positioned(
                top: padding.top,
                left: 0,
                right: 0,
                height: artHeight - padding.top + 24,
                child: PageView.builder(
                  controller: _pages,
                  itemCount: _slides.length,
                  itemBuilder: (context, i) => _ArtPage(
                    offset: _page - i,
                    float: _float,
                    child: _slides[i].art,
                  ),
                ),
              ),
              Positioned(
                top: padding.top + 8,
                right: AppSpacing.gutter,
                child: AnimatedOpacity(
                  duration: const Duration(milliseconds: 250),
                  opacity: _index < _slides.length - 1 ? 1 : 0,
                  child: Pressable(
                    onTap: _index < _slides.length - 1 ? _finish : null,
                    child: Padding(
                      padding: const EdgeInsets.all(8),
                      child: Text(
                        'Pomiń',
                        style: AppTypography.caption.copyWith(
                          color: AppColors.textMuted,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                height: sheetHeight,
                child: _CopySheet(
                  slides: _slides,
                  page: _page,
                  onNext: _next,
                  onBack: _index > 0 ? _back : null,
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _CopySheet extends StatelessWidget {
  const _CopySheet({
    required this.slides,
    required this.page,
    required this.onNext,
    required this.onBack,
  });

  final List<_Slide> slides;
  final double page;
  final VoidCallback onNext;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    final index = page.round();
    final slide = slides[index];
    final bottom = MediaQuery.paddingOf(context).bottom;

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppSpacing.sheetRadius),
        ),
      ),
      padding: EdgeInsets.fromLTRB(19, 48, 19, math.max(bottom, 24)),
      child: Column(
        children: [
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 320),
            transitionBuilder: (child, animation) => FadeTransition(
              opacity: animation,
              child: SlideTransition(
                position: Tween(
                  begin: const Offset(0, 0.08),
                  end: Offset.zero,
                ).animate(animation),
                child: child,
              ),
            ),
            child: Column(
              key: ValueKey(index),
              children: [
                Text(
                  slide.title,
                  style: AppTypography.headline,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  slide.body,
                  style: AppTypography.body.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          const Spacer(),
          _ProgressDots(count: slides.length, page: page),
          const Spacer(),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 17),
            child: Row(
              children: [
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 250),
                  transitionBuilder: (child, animation) =>
                      ScaleTransition(scale: animation, child: child),
                  child: onBack == null
                      ? const SizedBox(
                          key: ValueKey('none'),
                          width: AppSpacing.control,
                        )
                      : GradientBackButton(
                          key: const ValueKey('back'),
                          onPressed: onBack!,
                        ),
                ),
                const Spacer(),
                PrimaryButton(
                  label: 'Kontynuuj',
                  onPressed: onNext,
                  width: 176,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Filled up to the current step, outlined after it — as in the frames.
class _ProgressDots extends StatelessWidget {
  const _ProgressDots({required this.count, required this.page});

  final int count;
  final double page;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Krok ${page.round() + 1} z $count',
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          for (var i = 0; i < count; i++)
            Padding(
              padding: EdgeInsets.only(left: i == 0 ? 0 : 10),
              child: _Dot(fill: (page - i + 1).clamp(0.0, 1.0)),
            ),
        ],
      ),
    );
  }
}

class _Dot extends StatelessWidget {
  const _Dot({required this.fill});

  final double fill;

  @override
  Widget build(BuildContext context) {
    const color = Color(0xFFD9D9D9);
    return Container(
      width: 8,
      height: 8,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: color),
        color: color.withValues(alpha: fill),
      ),
    );
  }
}

/// Parallax + gentle float for the glass illustrations.
class _ArtPage extends StatelessWidget {
  const _ArtPage({
    required this.offset,
    required this.float,
    required this.child,
  });

  final double offset;
  final Animation<double> float;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final visibility = (1 - offset.abs()).clamp(0.0, 1.0);
    return AnimatedBuilder(
      animation: float,
      builder: (context, child) {
        final t = Curves.easeInOutSine.transform(float.value);
        return Transform.translate(
          offset: Offset(offset * -80, (t - 0.5) * 12),
          child: Transform.scale(
            scale: 0.85 + 0.15 * visibility,
            child: Opacity(opacity: visibility, child: child),
          ),
        );
      },
      child: Center(child: child),
    );
  }
}

class _ImageArt extends StatelessWidget {
  const _ImageArt(this.asset, {required this.size, this.angle = 0});

  final String asset;
  final double size;

  /// Rotation in degrees, as set on the Figma layer.
  final double angle;

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: angle * math.pi / 180,
      child: Image.asset(asset, width: size, height: size, fit: BoxFit.contain),
    );
  }
}

/// Two puzzle pieces, rotated 179° in Figma, drifting toward each other.
class _PuzzleArt extends StatelessWidget {
  const _PuzzleArt();

  @override
  Widget build(BuildContext context) {
    const rotation = 179 * math.pi / 180;
    return SizedBox(
      width: 200,
      height: 330,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Positioned(
            top: 0,
            child: Transform.rotate(
              angle: rotation,
              child: Image.asset(
                'assets/images/onboarding_puzzle_top.png',
                width: 179,
                height: 180,
              ),
            ),
          ),
          Positioned(
            top: 156,
            child: Transform.rotate(
              angle: rotation,
              child: Image.asset(
                'assets/images/onboarding_puzzle_bottom.png',
                width: 105,
                height: 160,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
