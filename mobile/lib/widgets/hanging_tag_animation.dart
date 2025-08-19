import 'package:flutter/material.dart';
import 'dart:math' as math;
import 'dart:ui' as ui;

class HangingTagAnimation extends StatefulWidget {
  final String? logoPath;
  final double width;
  final double height;
  final Color bandColor;
  final Color cardColor;

  const HangingTagAnimation({
    super.key,
    this.logoPath,
    this.width = 300,
    this.height = 400,
    this.bandColor = const Color(0xFF915EFF),
    this.cardColor = Colors.white,
  });

  @override
  State<HangingTagAnimation> createState() => _HangingTagAnimationState();
}

class _HangingTagAnimationState extends State<HangingTagAnimation>
    with TickerProviderStateMixin {
  late AnimationController _swayController;
  late AnimationController _pendulumController;
  late AnimationController _rotationController;

  late Animation<double> _swayAnimation;
  late Animation<double> _pendulumAnimation;
  late Animation<double> _rotationAnimation;

  Offset? _dragOffset;
  Offset _cardPosition = const Offset(0, 0);
  double _cardRotation = 0;
  bool _isDragging = false;

  // Physics simulation parameters
  final double _gravity = 9.8;
  final double _damping = 0.95;
  final double _stringLength = 150.0; // 🎨 Dłuższy sznurek
  final double _cardWidth = 120.0; // 🎨 Większa karta
  final double _cardHeight = 180.0; // 🎨 Wyższa karta

  @override
  void initState() {
    super.initState();

    // Subtle sway animation
    _swayController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    );
    _swayAnimation = Tween<double>(begin: -0.1, end: 0.1).animate(
      CurvedAnimation(parent: _swayController, curve: Curves.easeInOut),
    );

    // Natural pendulum motion
    _pendulumController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );
    _pendulumAnimation = Tween<double>(begin: -0.15, end: 0.15).animate(
      CurvedAnimation(parent: _pendulumController, curve: Curves.easeInOut),
    );

    // Card rotation
    _rotationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    _rotationAnimation = Tween<double>(begin: -0.05, end: 0.05).animate(
      CurvedAnimation(parent: _rotationController, curve: Curves.easeInOut),
    );

    // Start animations
    _swayController.repeat(reverse: true);
    _pendulumController.repeat(reverse: true);
    _rotationController.repeat(reverse: true);
  }

  @override
  void dispose() {
    _swayController.dispose();
    _pendulumController.dispose();
    _rotationController.dispose();
    super.dispose();
  }

  void _onPanStart(DragStartDetails details) {
    setState(() {
      _isDragging = true;
      _dragOffset = details.localPosition;
    });

    // Pause natural animations during drag
    _swayController.stop();
    _pendulumController.stop();
    _rotationController.stop();
  }

  void _onPanUpdate(DragUpdateDetails details) {
    if (_dragOffset != null) {
      setState(() {
        _cardPosition = details.localPosition - _dragOffset!;
        // Add rotation based on horizontal movement
        _cardRotation = (_cardPosition.dx / 100).clamp(-0.3, 0.3);
      });
    }
  }

  void _onPanEnd(DragEndDetails details) {
    setState(() {
      _isDragging = false;
      _dragOffset = null;
    });

    // Animate back to center with physics
    _animateBackToCenter();

    // Resume natural animations after a delay
    Future.delayed(const Duration(milliseconds: 1000), () {
      if (mounted && !_isDragging) {
        _swayController.repeat(reverse: true);
        _pendulumController.repeat(reverse: true);
        _rotationController.repeat(reverse: true);
      }
    });
  }

  void _animateBackToCenter() {
    final AnimationController returnController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    final Animation<Offset> positionAnimation = Tween<Offset>(
      begin: _cardPosition,
      end: const Offset(0, 0),
    ).animate(
      CurvedAnimation(parent: returnController, curve: Curves.elasticOut),
    );

    final Animation<double> rotationAnimation = Tween<double>(
      begin: _cardRotation,
      end: 0.0,
    ).animate(
      CurvedAnimation(parent: returnController, curve: Curves.elasticOut),
    );

    returnController.addListener(() {
      setState(() {
        _cardPosition = positionAnimation.value;
        _cardRotation = rotationAnimation.value;
      });
    });

    returnController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        returnController.dispose();
      }
    });

    returnController.forward();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.width,
      height: widget.height,
      child: AnimatedBuilder(
        animation: Listenable.merge([
          _swayAnimation,
          _pendulumAnimation,
          _rotationAnimation,
        ]),
        builder: (context, child) {
          final double naturalSway = _isDragging ? 0 : _swayAnimation.value;
          final double naturalPendulum =
              _isDragging ? 0 : _pendulumAnimation.value;
          final double naturalRotation =
              _isDragging ? 0 : _rotationAnimation.value;

          return CustomPaint(
            painter: HangingTagPainter(
              cardPosition: _cardPosition,
              cardRotation: _cardRotation + naturalRotation,
              naturalSway: naturalSway,
              naturalPendulum: naturalPendulum,
              bandColor: widget.bandColor, // 🔧 Używamy widget.bandColor
              cardColor: widget.cardColor, // 🔧 Używamy widget.cardColor
              isDragging: _isDragging,
              stringLength: _stringLength,
              cardWidth: _cardWidth,
              cardHeight: _cardHeight,
            ),
            child: GestureDetector(
              onPanStart: _onPanStart,
              onPanUpdate: _onPanUpdate,
              onPanEnd: _onPanEnd,
              behavior: HitTestBehavior.translucent,
              child: Container(
                width: widget.width,
                height: widget.height,
                color: Colors.transparent,
              ),
            ),
          );
        },
      ),
    );
  }
}

class HangingTagPainter extends CustomPainter {
  final Offset cardPosition;
  final double cardRotation;
  final double naturalSway;
  final double naturalPendulum;
  final Color bandColor;
  final Color cardColor;
  final bool isDragging;
  final double stringLength;
  final double cardWidth;
  final double cardHeight;

  HangingTagPainter({
    required this.cardPosition,
    required this.cardRotation,
    required this.naturalSway,
    required this.naturalPendulum,
    required this.bandColor,
    required this.cardColor,
    required this.isDragging,
    required this.stringLength,
    required this.cardWidth,
    required this.cardHeight,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // 🔧 Debug: sprawdźmy czy kolory dochodzą do painter
    print('🎨 HangingTagPainter colors:');
    print('   Band: $bandColor');
    print('   Card: $cardColor');

    final center = Offset(size.width / 2, 50);

    // Calculate final card position with natural movement
    final finalCardX =
        center.dx +
        cardPosition.dx +
        (naturalSway * 30) +
        (naturalPendulum * 20);
    final finalCardY =
        center.dy +
        stringLength +
        cardPosition.dy +
        (math.sin(naturalPendulum * 2) * 10);
    final cardCenter = Offset(finalCardX, finalCardY);

    // Draw string/band with curve
    _drawBand(canvas, center, cardCenter, size);

    // Draw the card
    _drawCard(canvas, cardCenter, cardRotation + naturalPendulum);

    // Draw connection points
    _drawConnectionPoints(canvas, center, cardCenter);
  }

  void _drawBand(Canvas canvas, Offset start, Offset end, Size size) {
    final paint =
        Paint()
          ..shader = ui.Gradient.linear(
            start,
            end,
            [
              bandColor, // 🎨 Pełna intensywność koloru
              bandColor.withOpacity(0.9),
              bandColor,
            ],
            [0.0, 0.5, 1.0],
          )
          ..strokeWidth =
              16 // 🎨 Grubszy pasek
          ..strokeCap = StrokeCap.round
          ..style = PaintingStyle.stroke;

    // Create curved path for the band
    final path = Path();
    path.moveTo(start.dx, start.dy);

    // Add curve points for realistic hanging effect
    final controlPoint1 = Offset(
      start.dx + (end.dx - start.dx) * 0.3,
      start.dy + (end.dy - start.dy) * 0.7,
    );
    final controlPoint2 = Offset(
      start.dx + (end.dx - start.dx) * 0.7,
      start.dy + (end.dy - start.dy) * 0.9,
    );

    path.cubicTo(
      controlPoint1.dx,
      controlPoint1.dy,
      controlPoint2.dx,
      controlPoint2.dy,
      end.dx,
      end.dy,
    );

    canvas.drawPath(path, paint);

    // 🚫 Usunięte dziwne kropki - bez pattern/texture effect
  }

  void _drawCard(Canvas canvas, Offset center, double rotation) {
    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.rotate(rotation);

    // Card shadow - bardziej wyrazisty
    final shadowPaint =
        Paint()
          ..color = Colors.black.withOpacity(0.4) // 🎨 Ciemniejszy cień
          ..maskFilter = const MaskFilter.blur(
            BlurStyle.normal,
            12,
          ); // 🎨 Większe rozmycie

    final shadowRect = RRect.fromRectAndRadius(
      Rect.fromCenter(
        center: const Offset(3, 6), // 🎨 Większe przesunięcie cienia
        width: cardWidth,
        height: cardHeight,
      ),
      const Radius.circular(12), // 🎨 Większy radius
    );
    canvas.drawRRect(shadowRect, shadowPaint);

    // Card background with gradient
    final cardPaint =
        Paint()
          ..shader = ui.Gradient.linear(
            Offset(-cardWidth / 2, -cardHeight / 2),
            Offset(cardWidth / 2, cardHeight / 2),
            [cardColor, cardColor.withOpacity(0.95)],
          )
          ..style = PaintingStyle.fill;

    final cardRect = RRect.fromRectAndRadius(
      Rect.fromCenter(
        center: Offset.zero,
        width: cardWidth,
        height: cardHeight,
      ),
      const Radius.circular(12), // 🎨 Większy radius
    );
    canvas.drawRRect(cardRect, cardPaint);

    // Card border - bardziej wyrazista
    final borderPaint =
        Paint()
          ..color = bandColor.withOpacity(0.3) // 🎨 Kolorowa ramka
          ..style = PaintingStyle.stroke
          ..strokeWidth = 3; // 🎨 Grubsza ramka
    canvas.drawRRect(cardRect, borderPaint);

    // Draw Vocare logo/text
    _drawCardContent(canvas);

    // Card highlight effect
    if (isDragging) {
      final highlightPaint =
          Paint()
            ..color = bandColor.withOpacity(0.15)
            ..style = PaintingStyle.fill;
      canvas.drawRRect(cardRect, highlightPaint);
    }

    canvas.restore();
  }

  void _drawCardContent(Canvas canvas) {
    // Draw "VOCARE" text - większy i bardziej wyrazisty
    final textPainter = TextPainter(
      text: TextSpan(
        text: 'VOCARE',
        style: TextStyle(
          color: bandColor,
          fontSize: 22, // 🎨 Większa czcionka
          fontWeight: FontWeight.w800, // 🎨 Grubsza czcionka
          letterSpacing: 2.5,
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    textPainter.paint(
      canvas,
      Offset(-textPainter.width / 2, -textPainter.height / 2 - 20),
    );

    // Draw subtitle - lepiej widoczny
    final subtitlePainter = TextPainter(
      text: const TextSpan(
        text: 'Career Assistant',
        style: TextStyle(
          color: Colors.grey,
          fontSize: 12, // 🎨 Większa czcionka
          letterSpacing: 1,
          fontWeight: FontWeight.w500,
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    subtitlePainter.layout();
    subtitlePainter.paint(canvas, Offset(-subtitlePainter.width / 2, 15));

    // Draw modern decorative line instead of circles
    final decorPaint =
        Paint()
          ..color = bandColor.withOpacity(0.4)
          ..strokeWidth = 3
          ..strokeCap = StrokeCap.round
          ..style = PaintingStyle.stroke;

    // Horizontal line above text
    canvas.drawLine(const Offset(-25, -45), const Offset(25, -45), decorPaint);

    // Horizontal line below text
    canvas.drawLine(const Offset(-25, 45), const Offset(25, 45), decorPaint);

    // Small accent circles at corners
    final accentPaint =
        Paint()
          ..color = bandColor.withOpacity(0.6)
          ..style = PaintingStyle.fill;

    canvas.drawCircle(const Offset(-40, -60), 4, accentPaint);
    canvas.drawCircle(const Offset(40, -60), 4, accentPaint);
  }

  void _drawConnectionPoints(Canvas canvas, Offset start, Offset end) {
    final pointPaint =
        Paint()
          ..color = bandColor.withOpacity(0.8) // 🎨 Kolorowe punkty połączenia
          ..style = PaintingStyle.fill;

    final pointBorderPaint =
        Paint()
          ..color = Colors.white
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2;

    // Connection point at top - większy i ładniejszy
    canvas.drawCircle(start, 8, pointPaint);
    canvas.drawCircle(start, 8, pointBorderPaint);

    // Connection point at card - większy i ładniejszy
    final cardConnectionPoint = Offset(end.dx, end.dy - cardHeight / 2);
    canvas.drawCircle(cardConnectionPoint, 6, pointPaint);
    canvas.drawCircle(cardConnectionPoint, 6, pointBorderPaint);
  }

  Offset _getPointOnCurve(
    Offset p0,
    Offset p1,
    Offset p2,
    Offset p3,
    double t,
  ) {
    final u = 1 - t;
    final tt = t * t;
    final uu = u * u;
    final uuu = uu * u;
    final ttt = tt * t;

    final x =
        uuu * p0.dx + 3 * uu * t * p1.dx + 3 * u * tt * p2.dx + ttt * p3.dx;
    final y =
        uuu * p0.dy + 3 * uu * t * p1.dy + 3 * u * tt * p2.dy + ttt * p3.dy;

    return Offset(x, y);
  }

  @override
  bool shouldRepaint(covariant HangingTagPainter oldDelegate) {
    return cardPosition != oldDelegate.cardPosition ||
        cardRotation != oldDelegate.cardRotation ||
        naturalSway != oldDelegate.naturalSway ||
        naturalPendulum != oldDelegate.naturalPendulum ||
        isDragging != oldDelegate.isDragging;
  }
}
