import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

/// Adds the subtle "press-in" used by every tappable surface in the app:
/// a spring-like scale plus a light haptic, instead of Material ink.
class Pressable extends StatefulWidget {
  const Pressable({
    super.key,
    required this.child,
    required this.onTap,
    this.scale = 0.97,
    this.haptic = true,
    this.semanticLabel,
  }) : builder = null;

  /// Hands the pressed state to [builder] instead of scaling the whole child,
  /// for surfaces that animate parts differently (e.g. a graph that must
  /// stay connected to its neighbours).
  const Pressable.builder({
    super.key,
    required Widget Function(BuildContext context, bool pressed) this.builder,
    required this.onTap,
    this.haptic = true,
    this.semanticLabel,
  }) : child = const SizedBox.shrink(),
       scale = 1;

  final Widget child;
  final Widget Function(BuildContext context, bool pressed)? builder;
  final VoidCallback? onTap;
  final double scale;
  final bool haptic;
  final String? semanticLabel;

  @override
  State<Pressable> createState() => _PressableState();
}

class _PressableState extends State<Pressable> {
  bool _pressed = false;

  void _setPressed(bool value) {
    if (widget.onTap == null || _pressed == value) return;
    setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      enabled: widget.onTap != null,
      label: widget.semanticLabel,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: (_) => _setPressed(true),
        onTapUp: (_) => _setPressed(false),
        onTapCancel: () => _setPressed(false),
        onTap: widget.onTap == null
            ? null
            : () {
                if (widget.haptic) HapticFeedback.selectionClick();
                widget.onTap!();
              },
        child: widget.builder != null
            ? widget.builder!(context, _pressed)
            : AnimatedScale(
                scale: _pressed ? widget.scale : 1,
                duration: Duration(milliseconds: _pressed ? 90 : 220),
                curve: _pressed ? Curves.easeOut : Curves.easeOutBack,
                child: widget.child,
              ),
      ),
    );
  }
}
