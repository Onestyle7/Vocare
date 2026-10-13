import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import '../glass/liquid_glass.dart';
import 'buttons.dart';

enum ToastKind { info, success, error }

OverlayEntry? _currentToast;

/// Glass banner sliding in under the status bar, iOS style. It sits at the
/// top so it never covers the floating tab bar or a sheet's primary action.
void showToast(
  BuildContext context,
  String message, {
  ToastKind kind = ToastKind.info,
}) {
  if (kind == ToastKind.error) {
    HapticFeedback.mediumImpact();
  } else if (kind == ToastKind.success) {
    HapticFeedback.lightImpact();
  }
  final overlay = Overlay.maybeOf(context, rootOverlay: true);
  if (overlay == null) return;

  _currentToast?.remove();
  late final OverlayEntry entry;
  entry = OverlayEntry(
    builder: (_) => _ToastBanner(
      message: message,
      kind: kind,
      onDismissed: () {
        if (_currentToast == entry) _currentToast = null;
        if (entry.mounted) entry.remove();
      },
    ),
  );
  _currentToast = entry;
  overlay.insert(entry);
}

class _ToastBanner extends StatefulWidget {
  const _ToastBanner({
    required this.message,
    required this.kind,
    required this.onDismissed,
  });

  final String message;
  final ToastKind kind;
  final VoidCallback onDismissed;

  @override
  State<_ToastBanner> createState() => _ToastBannerState();
}

class _ToastBannerState extends State<_ToastBanner>
    with SingleTickerProviderStateMixin {
  late final _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 420),
    reverseDuration: const Duration(milliseconds: 260),
  )..forward();
  late final Timer _timer;
  bool _dismissing = false;

  @override
  void initState() {
    super.initState();
    _timer = Timer(
      Duration(milliseconds: widget.kind == ToastKind.error ? 4200 : 3200),
      _dismiss,
    );
  }

  Future<void> _dismiss() async {
    if (_dismissing || !mounted) return;
    _dismissing = true;
    await _controller.reverse();
    widget.onDismissed();
  }

  @override
  void dispose() {
    _timer.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final (icon, color) = switch (widget.kind) {
      ToastKind.info => (Icons.info_outline_rounded, AppColors.accent),
      ToastKind.success => (Icons.check_circle_rounded, AppColors.success),
      ToastKind.error => (Icons.error_outline_rounded, AppColors.danger),
    };
    final curved = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutBack,
      reverseCurve: Curves.easeInCubic,
    );

    return Positioned(
      top: MediaQuery.paddingOf(context).top + 6,
      left: 12,
      right: 12,
      child: SafeArea(
        top: false,
        bottom: false,
        child: SlideTransition(
          position: Tween(
            begin: const Offset(0, -1.4),
            end: Offset.zero,
          ).animate(curved),
          child: FadeTransition(
            opacity: _controller,
            child: GestureDetector(
              onTap: _dismiss,
              onVerticalDragEnd: (d) {
                if ((d.primaryVelocity ?? 0) < 0) _dismiss();
              },
              child: Semantics(
                liveRegion: true,
                child: Material(
                  type: MaterialType.transparency,
                  child: LiquidGlass(
                    radius: 24,
                    tint: AppColors.surfaceRaised.withValues(alpha: 0.82),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    child: Row(
                      children: [
                        Icon(icon, color: color, size: 22),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            widget.message,
                            style: AppTypography.caption.copyWith(
                              height: 1.4,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The round brand badge with the Vocare mark (exported from Figma).
class VocareLogo extends StatelessWidget {
  const VocareLogo({super.key, this.size = AppSpacing.logo});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      'assets/images/logo.png',
      width: size,
      height: size,
      semanticLabel: 'Vocare',
      filterQuality: FilterQuality.medium,
    );
  }
}

/// Full-area message with an optional action — empty and error states.
class StateMessage extends StatelessWidget {
  const StateMessage({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.surfaceRaised,
              border: Border.all(color: AppColors.hairline),
            ),
            child: Icon(icon, color: AppColors.accent, size: 28),
          ),
          const SizedBox(height: 20),
          Text(
            title,
            style: AppTypography.titleSmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: AppTypography.caption.copyWith(
              color: AppColors.textMuted,
              height: 1.6,
            ),
            textAlign: TextAlign.center,
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 24),
            PrimaryButton(label: actionLabel!, onPressed: onAction, width: 220),
          ],
        ],
      ),
    );
  }
}

/// Rounded gradient checkbox with a rich-text label.
class AppCheckbox extends StatelessWidget {
  const AppCheckbox({
    super.key,
    required this.value,
    required this.onChanged,
    required this.label,
    this.error,
  });

  final bool value;
  final ValueChanged<bool> onChanged;
  final Widget label;
  final String? error;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      checked: value,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          HapticFeedback.selectionClick();
          onChanged(!value);
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                width: 22,
                height: 22,
                margin: const EdgeInsets.only(top: 1),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(7),
                  gradient: value ? AppColors.brandGradient : null,
                  color: value ? null : AppColors.surface,
                  border: Border.all(
                    color: error != null
                        ? AppColors.danger
                        : value
                        ? Colors.transparent
                        : AppColors.outline,
                    width: 1,
                  ),
                ),
                child: value
                    ? const Icon(
                        Icons.check_rounded,
                        size: 16,
                        color: Colors.white,
                      )
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DefaultTextStyle(
                  style: AppTypography.caption.copyWith(
                    color: AppColors.textMuted,
                    height: 1.5,
                  ),
                  child: label,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
