import Flutter
import UIKit

/// Exposes Apple's Liquid Glass material (`UIGlassEffect`, iOS 26+) to Flutter.
///
/// Flutter draws the content of glass surfaces; this platform view only hosts
/// the material underneath it, so the refraction, specular highlights and
/// adaptive tinting are the system's own rather than an imitation.
///
/// The iOS 26 APIs are behind `#if compiler(>=6.2)` so the project still
/// builds with Xcode 16 — the Dart side then falls back to the shader glass.
final class LiquidGlassPlugin: NSObject, FlutterPlugin {
  static let viewType = "vocare/liquid_glass"

  static func register(with registrar: FlutterPluginRegistrar) {
    let channel = FlutterMethodChannel(
      name: "vocare/liquid_glass",
      binaryMessenger: registrar.messenger()
    )
    registrar.addMethodCallDelegate(LiquidGlassPlugin(), channel: channel)
    registrar.register(LiquidGlassViewFactory(), withId: viewType)
  }

  func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
    switch call.method {
    case "isSupported":
      result(LiquidGlassSupport.isAvailable)
    default:
      result(FlutterMethodNotImplemented)
    }
  }
}

enum LiquidGlassSupport {
  static var isAvailable: Bool {
    #if compiler(>=6.2)
      if #available(iOS 26.0, *) { return true }
    #endif
    return false
  }
}

final class LiquidGlassViewFactory: NSObject, FlutterPlatformViewFactory {
  func create(
    withFrame frame: CGRect,
    viewIdentifier viewId: Int64,
    arguments args: Any?
  ) -> FlutterPlatformView {
    LiquidGlassPlatformView(frame: frame, arguments: args as? [String: Any] ?? [:])
  }

  func createArgsCodec() -> FlutterMessageCodec & NSObjectProtocol {
    FlutterStandardMessageCodec.sharedInstance()
  }
}

final class LiquidGlassPlatformView: NSObject, FlutterPlatformView {
  private let hostView: LiquidGlassHostView

  init(frame: CGRect, arguments: [String: Any]) {
    hostView = LiquidGlassHostView(frame: frame, arguments: arguments)
  }

  func view() -> UIView { hostView }
}

final class LiquidGlassHostView: UIView {
  private let effectView = UIVisualEffectView(effect: nil)
  private let cornerRadius: CGFloat
  private var pendingEffect: UIVisualEffect?

  init(frame: CGRect, arguments: [String: Any]) {
    cornerRadius = CGFloat(arguments["cornerRadius"] as? Double ?? 0)
    super.init(frame: frame)

    backgroundColor = .clear
    // Flutter handles every touch; the material is purely visual.
    isUserInteractionEnabled = false
    overrideUserInterfaceStyle = .dark

    effectView.frame = bounds
    effectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    effectView.clipsToBounds = true
    effectView.layer.cornerCurve = .continuous
    addSubview(effectView)

    #if compiler(>=6.2)
      if #available(iOS 26.0, *) {
        let style: UIGlassEffect.Style =
          (arguments["style"] as? String) == "clear" ? .clear : .regular
        let effect = UIGlassEffect(style: style)
        if let argb = arguments["tint"] as? Int {
          effect.tintColor = UIColor(argb: argb)
        }
        pendingEffect = effect
      }
    #endif
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) is not supported")
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    let maxRadius = min(bounds.width, bounds.height) / 2
    effectView.layer.cornerRadius = min(cornerRadius, maxRadius)
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    guard window != nil, let effect = pendingEffect else { return }
    pendingEffect = nil
    // Setting the effect inside an animation makes the glass materialize the
    // way system controls do instead of popping in.
    UIView.animate(withDuration: 0.35) {
      self.effectView.effect = effect
    }
  }
}

private extension UIColor {
  convenience init(argb: Int) {
    self.init(
      red: CGFloat((argb >> 16) & 0xFF) / 255,
      green: CGFloat((argb >> 8) & 0xFF) / 255,
      blue: CGFloat(argb & 0xFF) / 255,
      alpha: CGFloat((argb >> 24) & 0xFF) / 255
    )
  }
}
