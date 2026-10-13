import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:liquid_glass_widgets/liquid_glass_widgets.dart';

/// Which renderer draws the glass material on this device.
abstract final class LiquidGlassSupport {
  static const _channel = MethodChannel('vocare/liquid_glass');
  static bool _native = false;

  /// `true` when Apple's own `UIGlassEffect` is available (iOS 26+, app built
  /// with the iOS 26 SDK). Otherwise the shader renderer is used.
  static bool get isNative => _native;

  static Future<void> init() async {
    if (kIsWeb || !Platform.isIOS) return;
    try {
      _native = await _channel.invokeMethod<bool>('isSupported') ?? false;
    } on PlatformException {
      _native = false;
    } on MissingPluginException {
      _native = false;
    }
  }
}

enum LiquidGlassStyle { regular, clear }

/// A Liquid Glass surface with Flutter content on top.
///
/// * iOS 26+: the material is the system `UIGlassEffect`, hosted as a platform
///   view beneath [child].
/// * Everywhere else: a refractive Impeller shader from `liquid_glass_widgets`.
///
/// Follow the iOS 26 rule of thumb — glass belongs to the navigation layer
/// (bars, floating buttons, sheets), never to dense content.
class LiquidGlass extends StatelessWidget {
  const LiquidGlass({
    super.key,
    required this.child,
    required this.radius,
    this.width,
    this.height,
    this.padding,
    this.tint,
    this.style = LiquidGlassStyle.regular,
  });

  /// Circular glass of the given [size] — header buttons, back buttons.
  const LiquidGlass.circle({
    super.key,
    required this.child,
    required double size,
    this.tint,
    this.style = LiquidGlassStyle.regular,
  }) : radius = size / 2,
       width = size,
       height = size,
       padding = null;

  final Widget child;

  /// Corner radius; clamped to a capsule by both renderers.
  final double radius;
  final double? width;
  final double? height;
  final EdgeInsetsGeometry? padding;
  final Color? tint;
  final LiquidGlassStyle style;

  /// Fallback material tuned to sit on the #16171B background like the
  /// #20232D surfaces from the design, with a soft brand-tinted rim.
  static const _fallbackSettings = LiquidGlassSettings(
    glassColor: Color(0x2E2A2E3D),
    thickness: 22,
    blur: 9,
    lightIntensity: 0.55,
    ambientStrength: 0.25,
    saturation: 1.35,
    refractiveIndex: 1.22,
    chromaticAberration: 0.012,
  );

  @override
  Widget build(BuildContext context) {
    final content = padding == null
        ? child
        : Padding(padding: padding!, child: child);

    if (LiquidGlassSupport.isNative) {
      return SizedBox(
        width: width,
        height: height,
        child: Stack(
          fit: StackFit.passthrough,
          children: [
            Positioned.fill(
              child: IgnorePointer(
                child: UiKitView(
                  viewType: 'vocare/liquid_glass',
                  creationParams: <String, Object?>{
                    'cornerRadius': radius,
                    'style': style.name,
                    if (tint != null) 'tint': tint!.toARGB32(),
                  },
                  creationParamsCodec: const StandardMessageCodec(),
                  hitTestBehavior: PlatformViewHitTestBehavior.transparent,
                ),
              ),
            ),
            content,
          ],
        ),
      );
    }

    return GlassContainer(
      width: width,
      height: height,
      useOwnLayer: true,
      quality: GlassQuality.premium,
      shape: LiquidRoundedSuperellipse(borderRadius: radius),
      settings: tint == null
          ? _fallbackSettings
          : _fallbackSettings.copyWith(glassColor: tint),
      child: content,
    );
  }
}
