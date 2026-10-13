import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

/// Track colour of the web donuts (`#1f1f2e`).
const _track = Color(0xFF1F1F2E);

/// Full ring — "Uzupełnienie profilu" on the web dashboard.
class RingProgress extends StatelessWidget {
  const RingProgress({
    super.key,
    required this.value,
    required this.size,
    required this.child,
    this.stroke = 10,
  });

  /// 0–1.
  final double value;
  final double size;
  final double stroke;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: value.clamp(0, 1)),
      duration: const Duration(milliseconds: 900),
      curve: Curves.easeOutCubic,
      builder: (context, v, child) => CustomPaint(
        painter: _ArcPainter(
          value: v,
          stroke: stroke,
          sweep: 2 * math.pi,
          start: -math.pi / 2,
        ),
        child: SizedBox.square(
          dimension: size,
          child: Center(child: child),
        ),
      ),
      child: child,
    );
  }
}

/// Half gauge — "Postęp w wynagrodzeniu" on the web dashboard.
class GaugeProgress extends StatelessWidget {
  const GaugeProgress({
    super.key,
    required this.value,
    required this.width,
    required this.child,
    this.stroke = 12,
  });

  final double value;
  final double width;
  final double stroke;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: value.clamp(0, 1)),
      duration: const Duration(milliseconds: 900),
      curve: Curves.easeOutCubic,
      builder: (context, v, child) => CustomPaint(
        painter: _ArcPainter(
          value: v,
          stroke: stroke,
          sweep: math.pi,
          start: math.pi,
          halfHeight: true,
        ),
        child: SizedBox(
          width: width,
          height: width / 2 + stroke / 2,
          child: Align(alignment: const Alignment(0, 0.85), child: child),
        ),
      ),
      child: child,
    );
  }
}

class _ArcPainter extends CustomPainter {
  _ArcPainter({
    required this.value,
    required this.stroke,
    required this.sweep,
    required this.start,
    this.halfHeight = false,
  });

  final double value;
  final double stroke;
  final double sweep;
  final double start;
  final bool halfHeight;

  @override
  void paint(Canvas canvas, Size size) {
    final diameter = size.width;
    final rect = Rect.fromLTWH(
      stroke / 2,
      stroke / 2,
      diameter - stroke,
      (halfHeight ? diameter : size.height) - stroke,
    );

    final track = Paint()
      ..color = _track
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(rect, start, sweep, false, track);

    if (value <= 0) return;
    final progress = Paint()
      ..shader = SweepGradient(
        endAngle: sweep,
        colors: const [
          AppColors.gradientStart,
          AppColors.gradientMid,
          AppColors.gradientSoft,
          AppColors.gradientEnd,
        ],
        stops: const [0, 0.5, 0.77, 1],
        transform: GradientRotation(start),
      ).createShader(rect)
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(rect, start, sweep * value, false, progress);
  }

  @override
  bool shouldRepaint(_ArcPainter old) => old.value != value;
}
