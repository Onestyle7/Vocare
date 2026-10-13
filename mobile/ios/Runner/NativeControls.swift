import Flutter
import UIKit

/// Native UIKit controls hosted as Flutter platform views:
/// - `vocare/date_picker`: `UIDatePicker` in the inline calendar style.
/// - `vocare/switch`: `UISwitch`, which renders as Liquid Glass on iOS 26.
/// - `vocare/slider`: stepped `UISlider` (glass thumb on iOS 26).
///
/// Each view talks to Dart over its own channel, `<viewType>_<viewId>`.
final class NativeControlsPlugin: NSObject {
  static func register(with registrar: FlutterPluginRegistrar) {
    let messenger = registrar.messenger()
    registrar.register(
      NativeControlFactory(messenger: messenger) { frame, id, args, messenger in
        NativeDatePickerView(frame: frame, viewId: id, args: args, messenger: messenger)
      },
      withId: "vocare/date_picker"
    )
    registrar.register(
      NativeControlFactory(messenger: messenger) { frame, id, args, messenger in
        NativeSwitchView(frame: frame, viewId: id, args: args, messenger: messenger)
      },
      withId: "vocare/switch"
    )
    registrar.register(
      NativeControlFactory(messenger: messenger) { frame, id, args, messenger in
        NativeSliderView(frame: frame, viewId: id, args: args, messenger: messenger)
      },
      withId: "vocare/slider"
    )
  }
}

private final class NativeControlFactory: NSObject, FlutterPlatformViewFactory {
  typealias Builder = (CGRect, Int64, [String: Any], FlutterBinaryMessenger) -> FlutterPlatformView

  private let messenger: FlutterBinaryMessenger
  private let builder: Builder

  init(messenger: FlutterBinaryMessenger, builder: @escaping Builder) {
    self.messenger = messenger
    self.builder = builder
  }

  func create(
    withFrame frame: CGRect,
    viewIdentifier viewId: Int64,
    arguments args: Any?
  ) -> FlutterPlatformView {
    builder(frame, viewId, args as? [String: Any] ?? [:], messenger)
  }

  func createArgsCodec() -> FlutterMessageCodec & NSObjectProtocol {
    FlutterStandardMessageCodec.sharedInstance()
  }
}

/// Brand accent (#9D9BFF).
private let brandTint = UIColor(red: 0x9D / 255, green: 0x9B / 255, blue: 1, alpha: 1)

private func date(fromMillis value: Any?) -> Date? {
  guard let millis = (value as? NSNumber)?.doubleValue else { return nil }
  return Date(timeIntervalSince1970: millis / 1000)
}

private func millis(_ date: Date) -> Int64 {
  Int64((date.timeIntervalSince1970 * 1000).rounded())
}

final class NativeDatePickerView: NSObject, FlutterPlatformView {
  private let container: UIView
  private let picker = UIDatePicker()
  private let channel: FlutterMethodChannel

  init(frame: CGRect, viewId: Int64, args: [String: Any], messenger: FlutterBinaryMessenger) {
    container = UIView(frame: frame)
    channel = FlutterMethodChannel(
      name: "vocare/date_picker_\(viewId)",
      binaryMessenger: messenger
    )
    super.init()

    container.backgroundColor = .clear
    container.overrideUserInterfaceStyle = .dark

    picker.datePickerMode = .date
    picker.preferredDatePickerStyle = .inline
    picker.locale = Locale(identifier: "pl_PL")
    picker.tintColor = brandTint
    if let initial = date(fromMillis: args["initial"]) { picker.date = initial }
    picker.minimumDate = date(fromMillis: args["min"])
    picker.maximumDate = date(fromMillis: args["max"])
    picker.addTarget(self, action: #selector(valueChanged), for: .valueChanged)

    picker.translatesAutoresizingMaskIntoConstraints = false
    container.addSubview(picker)
    NSLayoutConstraint.activate([
      picker.topAnchor.constraint(equalTo: container.topAnchor),
      picker.centerXAnchor.constraint(equalTo: container.centerXAnchor),
      picker.leadingAnchor.constraint(greaterThanOrEqualTo: container.leadingAnchor),
      picker.trailingAnchor.constraint(lessThanOrEqualTo: container.trailingAnchor),
    ])
  }

  func view() -> UIView { container }

  @objc private func valueChanged() {
    channel.invokeMethod("changed", arguments: millis(picker.date))
  }
}

final class NativeSwitchView: NSObject, FlutterPlatformView {
  private let container: UIView
  private let control = UISwitch()
  private let channel: FlutterMethodChannel

  init(frame: CGRect, viewId: Int64, args: [String: Any], messenger: FlutterBinaryMessenger) {
    container = UIView(frame: frame)
    channel = FlutterMethodChannel(name: "vocare/switch_\(viewId)", binaryMessenger: messenger)
    super.init()

    container.backgroundColor = .clear
    container.overrideUserInterfaceStyle = .dark
    control.isOn = args["value"] as? Bool ?? false
    control.onTintColor = brandTint
    control.addTarget(self, action: #selector(valueChanged), for: .valueChanged)

    control.translatesAutoresizingMaskIntoConstraints = false
    container.addSubview(control)
    NSLayoutConstraint.activate([
      control.centerXAnchor.constraint(equalTo: container.centerXAnchor),
      control.centerYAnchor.constraint(equalTo: container.centerYAnchor),
    ])

    // Dart drives the value when its state changes for other reasons.
    channel.setMethodCallHandler { [weak self] call, result in
      if call.method == "setValue", let value = call.arguments as? Bool {
        self?.control.setOn(value, animated: true)
      }
      result(nil)
    }
  }

  func view() -> UIView { container }

  @objc private func valueChanged() {
    channel.invokeMethod("changed", arguments: control.isOn)
  }
}

/// Stepped `UISlider`: Dart works with whole steps `0…steps-1`; the thumb
/// snaps to them and every step change plays a selection haptic.
final class NativeSliderView: NSObject, FlutterPlatformView {
  private let container: UIView
  private let control = UISlider()
  private let channel: FlutterMethodChannel
  private let haptics = UISelectionFeedbackGenerator()
  private var step: Int
  private var dimmed: Bool

  init(frame: CGRect, viewId: Int64, args: [String: Any], messenger: FlutterBinaryMessenger) {
    container = UIView(frame: frame)
    channel = FlutterMethodChannel(name: "vocare/slider_\(viewId)", binaryMessenger: messenger)
    step = args["value"] as? Int ?? 0
    dimmed = args["dimmed"] as? Bool ?? false
    super.init()

    container.backgroundColor = .clear
    container.overrideUserInterfaceStyle = .dark
    control.minimumValue = 0
    control.maximumValue = Float(max((args["steps"] as? Int ?? 2) - 1, 1))
    control.value = Float(step)
    applyTint()
    control.addTarget(self, action: #selector(valueChanged), for: .valueChanged)
    control.addTarget(self, action: #selector(touchEnded), for: [.touchUpInside, .touchUpOutside])

    control.translatesAutoresizingMaskIntoConstraints = false
    container.addSubview(control)
    NSLayoutConstraint.activate([
      control.leadingAnchor.constraint(equalTo: container.leadingAnchor),
      control.trailingAnchor.constraint(equalTo: container.trailingAnchor),
      control.centerYAnchor.constraint(equalTo: container.centerYAnchor),
    ])

    channel.setMethodCallHandler { [weak self] call, result in
      if call.method == "setValue", let self, let args = call.arguments as? [String: Any] {
        self.step = args["value"] as? Int ?? self.step
        self.dimmed = args["dimmed"] as? Bool ?? self.dimmed
        self.control.setValue(Float(self.step), animated: true)
        self.applyTint()
      }
      result(nil)
    }
  }

  func view() -> UIView { container }

  private func applyTint() {
    control.minimumTrackTintColor = dimmed ? UIColor.systemGray3 : brandTint
  }

  @objc private func valueChanged() {
    let snapped = Int(control.value.rounded())
    guard snapped != step || dimmed else { return }
    step = snapped
    dimmed = false
    applyTint()
    haptics.selectionChanged()
    channel.invokeMethod("changed", arguments: snapped)
  }

  @objc private func touchEnded() {
    control.setValue(Float(step), animated: true)
  }
}
