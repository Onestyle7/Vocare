import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/feedback.dart';
import '../../core/widgets/glass_widgets.dart';
import '../auth/application/session_controller.dart';
import '../onboarding/onboarding_state.dart';

/// Continues the native launch screen (same centred logo) with a short
/// "breath" of the brand glow, then hands off to the right entry point.
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1100),
  );

  @override
  void initState() {
    super.initState();
    _controller.forward().whenComplete(_continue);
  }

  void _continue() {
    if (!mounted) return;
    final target = landingFor(
      ref.read(sessionProvider),
      onboardingSeen: ref.read(onboardingSeenProvider),
    );
    context.go(target);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final glow = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0, 0.7, curve: Curves.easeOutCubic),
    );
    final logoScale = Tween(begin: 1.0, end: 1.06).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutSine),
    );

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Stack(
          alignment: Alignment.center,
          children: [
            FadeTransition(
              opacity: glow,
              child: const AmbientGlow(size: 180, opacity: 0.55, blur: 70),
            ),
            ScaleTransition(scale: logoScale, child: const VocareLogo()),
          ],
        ),
      ),
    );
  }
}
