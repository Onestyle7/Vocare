import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/glass/liquid_glass.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_icon.dart';

class GlassTab {
  const GlassTab({required this.label, required this.icon});
  final String label;
  final Widget Function(bool active) icon;
}

/// The floating bottom bar from "Main page screen": a Liquid Glass capsule
/// with a gradient puck that slides to the active tab.
class GlassTabBar extends StatelessWidget {
  const GlassTabBar({
    super.key,
    required this.tabs,
    required this.currentIndex,
    required this.onSelect,
  });

  final List<GlassTab> tabs;
  final int currentIndex;
  final ValueChanged<int> onSelect;

  static const height = 69.0;
  static const _maxWidth = 311.0;
  static const _padding = 8.0;
  static const _puck = 54.0;

  /// Native glass tint matching the #20232D bar in Figma, translucent enough
  /// for content to show through.
  static const _tint = Color(0x7320232D);

  @override
  Widget build(BuildContext context) {
    final width = math.min(_maxWidth, MediaQuery.sizeOf(context).width - 32);
    final slot = (width - _padding * 2) / tabs.length;

    return SizedBox(
      width: width,
      height: height,
      child: LiquidGlass(
        radius: height / 2,
        tint: _tint,
        child: Stack(
          children: [
            _Puck(
              left: _padding + slot * currentIndex + (slot - _puck) / 2,
              size: _puck,
              barWidth: width,
              barHeight: height,
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: _padding),
              child: Row(
                children: [
                  for (var i = 0; i < tabs.length; i++)
                    Expanded(
                      child: Semantics(
                        button: true,
                        selected: i == currentIndex,
                        label: tabs[i].label,
                        child: GestureDetector(
                          behavior: HitTestBehavior.opaque,
                          onTap: () {
                            if (i != currentIndex) {
                              HapticFeedback.selectionClick();
                            }
                            onSelect(i);
                          },
                          child: Center(
                            child: AnimatedScale(
                              duration: const Duration(milliseconds: 250),
                              scale: i == currentIndex ? 1 : 0.94,
                              child: tabs[i].icon(i == currentIndex),
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

/// The gradient puck behind the active tab. It slides with the same springy
/// overshoot as before, but a long jump to the first or last tab would fling
/// it past the end of the bar — there it squashes against the capsule's end
/// instead (flatter and a little taller, still inside the bar) and springs
/// back into a circle as the overshoot settles.
class _Puck extends StatefulWidget {
  const _Puck({
    required this.left,
    required this.size,
    required this.barWidth,
    required this.barHeight,
  });

  /// Resting x of the puck for the active tab.
  final double left;
  final double size;
  final double barWidth;
  final double barHeight;

  @override
  State<_Puck> createState() => _PuckState();
}

class _PuckState extends State<_Puck> with SingleTickerProviderStateMixin {
  static const _curve = Curves.easeOutBack;

  late final _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 420),
    value: 1,
  )..addListener(_onTick);
  late double _from = widget.left;
  bool _hitWall = false;

  /// Gap to the top and bottom of the bar.
  double get _inset => (widget.barHeight - widget.size) / 2;

  /// The puck may travel right up to the capsule's rounded end — its circle
  /// still fits inside the end cap there — so ordinary hops (whose overshoot
  /// stays within the end tab's margin) never squash; only long flings do.
  static const _wallGap = 2.0;
  double get _minLeft => _wallGap;
  double get _maxLeft => widget.barWidth - _wallGap - widget.size;

  /// Where the spring alone would put the puck, ignoring the bar's ends.
  double _freeLeft(double target) =>
      _from + (target - _from) * _curve.transform(_controller.value);

  /// How far past the bar's end the spring is pushing the puck.
  double get _overflow {
    final x = _freeLeft(widget.left);
    if (x < _minLeft) return _minLeft - x;
    if (x > _maxLeft) return x - _maxLeft;
    return 0;
  }

  void _onTick() {
    // A soft tap when the puck meets the wall.
    if (!_hitWall && _overflow > 0.5) {
      _hitWall = true;
      HapticFeedback.lightImpact();
    }
  }

  @override
  void didUpdateWidget(_Puck old) {
    super.didUpdateWidget(old);
    if (old.left == widget.left) return;
    // Start from where the puck is now, also mid-flight.
    _from = _freeLeft(old.left);
    _hitWall = false;
    _controller.forward(from: 0);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        final size = widget.size;
        final x = _freeLeft(widget.left);
        final over = _overflow;
        // Squash: flatter against the wall, a bit taller — kept inside the
        // capsule's rounded end, never thinner than about half a circle.
        final width = math.max(size * 0.55, size - over * 0.9);
        final height = size + math.min(over * 0.45, _inset * 2 - 7);
        final left = x < _minLeft
            ? _minLeft
            : x > _maxLeft
            ? _maxLeft + size - width
            : x;
        return Positioned(
          left: left,
          top: (widget.barHeight - height) / 2,
          width: width,
          height: height,
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: AppColors.brandGradient,
              borderRadius: BorderRadius.all(
                Radius.elliptical(width / 2, height / 2),
              ),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x40915EFF),
                  blurRadius: 18,
                  offset: Offset(0, 4),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Figma icons for the five tabs. The 62pt exports are drawn at 62 so their
/// 22pt glyph stays the size it has in the design.
abstract final class TabIcons {
  static Widget dashboard(bool active) => const _GridGlyph();

  static Widget trending(bool active) =>
      _tinted(const AppIcon(AppIcons.trendingUp, size: 29), active);

  static Widget map(bool active) =>
      _tinted(const AppIcon(AppIcons.map, size: 62), active);

  static Widget assistant(bool active) =>
      _tinted(const AppIcon(AppIcons.briefcase, size: 62), active);

  static Widget cv(bool active) =>
      _tinted(const AppIcon(AppIcons.cv, size: 62), active);

  static Widget _tinted(Widget icon, bool active) => SizedBox.square(
    dimension: 54,
    child: OverflowBox(
      minWidth: 0,
      minHeight: 0,
      maxWidth: 62,
      maxHeight: 62,
      child: Opacity(opacity: active ? 0.85 : 1, child: icon),
    ),
  );
}

/// The 2×2 "Frame 71" glyph: four 9pt rounded squares, the diagonal pair drawn
/// with a heavier stroke.
class _GridGlyph extends StatelessWidget {
  const _GridGlyph();

  @override
  Widget build(BuildContext context) {
    const color = Color(0xBFFFF2F2);
    Widget square(double stroke) => Container(
      width: 9,
      height: 9,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(2.7),
        border: Border.all(color: color, width: stroke),
      ),
    );
    return SizedBox(
      width: 19,
      height: 19,
      child: Wrap(
        spacing: 1,
        runSpacing: 1,
        children: [square(1.3), square(0.8), square(0.8), square(1.3)],
      ),
    );
  }
}
