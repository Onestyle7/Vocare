import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../glass/liquid_glass.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import 'pressable.dart';

/// Circular Liquid Glass button — the header avatar / bell from Figma.
class GlassIconButton extends StatelessWidget {
  const GlassIconButton({
    super.key,
    required this.child,
    required this.onPressed,
    required this.semanticLabel,
    this.size = AppSpacing.headerButton,
    this.badge = false,
  });

  final Widget child;
  final VoidCallback? onPressed;
  final String semanticLabel;
  final double size;

  /// Shows a small brand dot, e.g. unread notifications.
  final bool badge;

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: onPressed,
      scale: 0.92,
      semanticLabel: semanticLabel,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          LiquidGlass.circle(
            size: size,
            child: Center(child: child),
          ),
          if (badge)
            Positioned(
              top: size * 0.24,
              right: size * 0.26,
              child: Container(
                width: 9,
                height: 9,
                decoration: BoxDecoration(
                  gradient: AppColors.brandGradient,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.background, width: 1.5),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

extension SafePop on BuildContext {
  /// Pops when there is somewhere to go back to (deep links open screens
  /// without history), otherwise navigates to [fallback].
  void popOrGo(String fallback) => canPop() ? pop() : go(fallback);
}

/// Glass back button for pushed screens.
class GlassBackButton extends StatelessWidget {
  const GlassBackButton({
    super.key,
    this.onPressed,
    this.icon = Icons.arrow_back_rounded,
  });

  final VoidCallback? onPressed;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return GlassIconButton(
      size: AppSpacing.navButton,
      semanticLabel: 'Wstecz',
      onPressed: onPressed ?? () => context.popOrGo('/home'),
      child: Icon(icon, size: 22, color: AppColors.textPrimary),
    );
  }
}

/// Soft brand glow — the blurred "Ellipse 50" from the onboarding frames.
/// It also gives the glass surfaces something to refract.
class AmbientGlow extends StatelessWidget {
  const AmbientGlow({
    super.key,
    this.size = 142,
    this.opacity = 0.4,
    this.blur = 90,
  });

  final double size;
  final double opacity;
  final double blur;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Opacity(
        opacity: opacity,
        child: ImageFiltered(
          imageFilter: ui.ImageFilter.blur(
            sigmaX: blur,
            sigmaY: blur,
            tileMode: TileMode.decal,
          ),
          child: Container(
            width: size,
            height: size,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: AppColors.brandGradient,
            ),
          ),
        ),
      ),
    );
  }
}

/// Scroll edge effect: content fades out under floating chrome at the top
/// instead of colliding with it. Place as a `Stack` child above the content.
class TopScrollFade extends StatelessWidget {
  const TopScrollFade({super.key, required this.height, this.solidHeight});

  final double height;

  /// Opaque down to this offset, then fades out until [height]. Defaults to
  /// 70% of [height]; set it when a control row needs a fully solid backdrop.
  final double? solidHeight;

  @override
  Widget build(BuildContext context) {
    final solid = solidHeight == null
        ? 0.7
        : (solidHeight! / height).clamp(0.0, 1.0);
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      height: height,
      child: IgnorePointer(
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: const [
                AppColors.background,
                Color(0xF216171B),
                Color(0x0016171B),
              ],
              stops: [0, solid, 1],
            ),
          ),
        ),
      ),
    );
  }
}

/// Opaque content card. Content stays opaque so text is always readable;
/// glass is reserved for chrome.
class SurfaceCard extends StatelessWidget {
  const SurfaceCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.onTap,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final card = Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
        border: Border.all(color: AppColors.hairline),
      ),
      child: child,
    );
    return onTap == null
        ? card
        : Pressable(onTap: onTap, scale: 0.985, child: card);
  }
}

/// Title row used above dashboard / profile cards.
class SectionHeader extends StatelessWidget {
  const SectionHeader({super.key, required this.title, this.trailing});

  final String title;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 0, 4, 12),
      child: Row(
        children: [
          Expanded(child: Text(title, style: AppTypography.titleSmall)),
          ?trailing,
        ],
      ),
    );
  }
}

/// Bottom sheet floating above the content with an inset glass panel —
/// the iOS 26 sheet silhouette.
Future<T?> showGlassSheet<T>({
  required BuildContext context,
  required WidgetBuilder builder,
  bool isScrollControlled = true,
}) {
  return showModalBottomSheet<T>(
    context: context,
    // Above the shell's floating tab bar, which lives outside branch navigators.
    useRootNavigator: true,
    isScrollControlled: isScrollControlled,
    backgroundColor: Colors.transparent,
    barrierColor: Colors.black.withValues(alpha: 0.45),
    elevation: 0,
    useSafeArea: true,
    builder: (sheetContext) {
      final bottomInset = MediaQuery.viewInsetsOf(sheetContext).bottom;
      final safeBottom = MediaQuery.paddingOf(sheetContext).bottom;
      return Padding(
        padding: EdgeInsets.fromLTRB(
          8,
          0,
          8,
          bottomInset + (safeBottom > 0 ? safeBottom : 8),
        ),
        child: LiquidGlass(
          radius: AppSpacing.sheetRadius,
          // Forms live in sheets, so the tint keeps text readable over
          // whatever the glass refracts.
          tint: AppColors.surface.withValues(alpha: 0.78),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 10),
              Container(
                width: 40,
                height: 5,
                decoration: BoxDecoration(
                  color: AppColors.textSubtle,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              Flexible(child: builder(sheetContext)),
            ],
          ),
        ),
      );
    },
  );
}

/// Skeleton block shown while cards load.
class SkeletonBox extends StatefulWidget {
  const SkeletonBox({
    super.key,
    required this.height,
    this.width,
    this.radius = 20,
  });

  final double height;
  final double? width;
  final double radius;

  @override
  State<SkeletonBox> createState() => _SkeletonBoxState();
}

class _SkeletonBoxState extends State<SkeletonBox>
    with SingleTickerProviderStateMixin {
  late final _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1100),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: Tween(
        begin: 0.45,
        end: 0.9,
      ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut)),
      child: Container(
        height: widget.height,
        width: widget.width ?? double.infinity,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(widget.radius),
        ),
      ),
    );
  }
}

/// Yes / no question in a glass sheet; resolves to `true` on confirm.
Future<bool> confirmAction(
  BuildContext context, {
  required String title,
  required String message,
  required String confirmLabel,
  String cancelLabel = 'Anuluj',
  bool destructive = false,
}) async {
  final confirmed = await showGlassSheet<bool>(
    context: context,
    builder: (sheet) => Padding(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(title, style: AppTypography.title, textAlign: TextAlign.center),
          const SizedBox(height: 8),
          Text(
            message,
            style: AppTypography.caption.copyWith(
              color: AppColors.textMuted,
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 22),
          Pressable(
            onTap: () => Navigator.pop(sheet, true),
            semanticLabel: confirmLabel,
            child: Container(
              height: AppSpacing.control,
              width: double.infinity,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
                gradient: destructive ? null : AppColors.brandGradient,
                color: destructive
                    ? AppColors.danger.withValues(alpha: 0.16)
                    : null,
                border: destructive
                    ? Border.all(color: AppColors.danger.withValues(alpha: 0.4))
                    : null,
              ),
              child: Text(
                confirmLabel,
                style: AppTypography.button.copyWith(
                  color: destructive ? AppColors.danger : Colors.white,
                ),
              ),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(sheet, false),
            child: Text(cancelLabel, style: AppTypography.caption),
          ),
        ],
      ),
    ),
  );
  return confirmed ?? false;
}
