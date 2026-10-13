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
            AnimatedPositioned(
              duration: const Duration(milliseconds: 420),
              curve: Curves.easeOutBack,
              left: _padding + slot * currentIndex + (slot - _puck) / 2,
              top: (height - _puck) / 2,
              width: _puck,
              height: _puck,
              child: const DecoratedBox(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: AppColors.brandGradient,
                  boxShadow: [
                    BoxShadow(
                      color: Color(0x40915EFF),
                      blurRadius: 18,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
              ),
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
