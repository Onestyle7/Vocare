import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:liquid_glass_widgets/liquid_glass_widgets.dart';

import '../glass/liquid_glass.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import 'buttons.dart';
import 'glass_widgets.dart';

bool get _isIOS => !kIsWeb && Platform.isIOS;

/// Gives every touch to the native view (otherwise the sheet's drag gesture
/// would steal calendar swipes and switch taps).
final _eagerGestures = <Factory<OneSequenceGestureRecognizer>>{
  Factory<OneSequenceGestureRecognizer>(EagerGestureRecognizer.new),
};

/// Inline calendar. iOS: the system `UIDatePicker` (`ios/Runner/NativeControls.swift`);
/// elsewhere: Flutter's calendar in the app palette.
class NativeDatePicker extends StatefulWidget {
  const NativeDatePicker({
    super.key,
    required this.initial,
    required this.onChanged,
    this.firstDate,
    this.lastDate,
  });

  final DateTime initial;
  final ValueChanged<DateTime> onChanged;
  final DateTime? firstDate;
  final DateTime? lastDate;

  /// Height of the iOS inline calendar.
  static const height = 360.0;

  @override
  State<NativeDatePicker> createState() => _NativeDatePickerState();
}

class _NativeDatePickerState extends State<NativeDatePicker> {
  MethodChannel? _channel;

  @override
  void dispose() {
    _channel?.setMethodCallHandler(null);
    super.dispose();
  }

  void _attach(int id) {
    _channel = MethodChannel('vocare/date_picker_$id')
      ..setMethodCallHandler((call) async {
        if (call.method == 'changed' && call.arguments is int) {
          widget.onChanged(
            DateTime.fromMillisecondsSinceEpoch(call.arguments as int),
          );
        }
      });
  }

  @override
  Widget build(BuildContext context) {
    final first = widget.firstDate ?? DateTime(1960);
    final last = widget.lastDate ?? DateTime(DateTime.now().year + 10);

    if (_isIOS) {
      return SizedBox(
        height: NativeDatePicker.height,
        child: UiKitView(
          viewType: 'vocare/date_picker',
          creationParams: <String, Object?>{
            'initial': widget.initial.millisecondsSinceEpoch,
            'min': first.millisecondsSinceEpoch,
            'max': last.millisecondsSinceEpoch,
          },
          creationParamsCodec: const StandardMessageCodec(),
          onPlatformViewCreated: _attach,
          gestureRecognizers: _eagerGestures,
        ),
      );
    }

    return Theme(
      data: Theme.of(context).copyWith(
        colorScheme: Theme.of(context).colorScheme.copyWith(
          primary: AppColors.gradientMid,
          onPrimary: Colors.white,
        ),
      ),
      child: CalendarDatePicker(
        initialDate: widget.initial,
        firstDate: first,
        lastDate: last,
        onDateChanged: widget.onChanged,
      ),
    );
  }
}

/// Liquid Glass switch: the system `UISwitch` where iOS 26 draws it as glass,
/// the shader `GlassSwitch` everywhere else.
class LiquidGlassSwitch extends StatefulWidget {
  const LiquidGlassSwitch({
    super.key,
    required this.value,
    required this.onChanged,
    this.semanticLabel,
  });

  final bool value;
  final ValueChanged<bool> onChanged;
  final String? semanticLabel;

  @override
  State<LiquidGlassSwitch> createState() => _LiquidGlassSwitchState();
}

class _LiquidGlassSwitchState extends State<LiquidGlassSwitch> {
  MethodChannel? _channel;

  @override
  void didUpdateWidget(LiquidGlassSwitch old) {
    super.didUpdateWidget(old);
    if (old.value != widget.value) {
      _channel?.invokeMethod<void>('setValue', widget.value);
    }
  }

  @override
  void dispose() {
    _channel?.setMethodCallHandler(null);
    super.dispose();
  }

  void _attach(int id) {
    _channel = MethodChannel('vocare/switch_$id')
      ..setMethodCallHandler((call) async {
        if (call.method == 'changed' && call.arguments is bool) {
          widget.onChanged(call.arguments as bool);
          _syncAfterChange();
        }
      });
  }

  /// `UISwitch` flips itself the moment it is tapped, but [value] is the
  /// source of truth: when the parent keeps the old value (e.g. it asks for
  /// consent first and the person declines) the native switch must snap
  /// back. Checked after the parent's rebuild, so an accepted change does
  /// not flicker.
  void _syncAfterChange() {
    WidgetsBinding.instance
      ..addPostFrameCallback((_) {
        if (mounted) _channel?.invokeMethod<void>('setValue', widget.value);
      })
      ..ensureVisualUpdate();
  }

  @override
  Widget build(BuildContext context) {
    if (LiquidGlassSupport.isNative) {
      return Semantics(
        toggled: widget.value,
        label: widget.semanticLabel,
        child: SizedBox(
          width: 66,
          height: 34,
          child: UiKitView(
            viewType: 'vocare/switch',
            creationParams: <String, Object?>{'value': widget.value},
            creationParamsCodec: const StandardMessageCodec(),
            onPlatformViewCreated: _attach,
            gestureRecognizers: _eagerGestures,
          ),
        ),
      );
    }
    return GlassSwitch(
      value: widget.value,
      onChanged: widget.onChanged,
      activeColor: AppColors.gradientMid,
      useOwnLayer: true,
      quality: GlassQuality.premium,
      semanticLabel: widget.semanticLabel,
    );
  }
}

/// Liquid Glass slider with discrete steps: the system `UISlider` where
/// iOS 26 draws it as glass, the shader `GlassSlider` everywhere else.
/// Values are whole steps `0…steps - 1`; every step change ticks a haptic.
class LiquidGlassSlider extends StatefulWidget {
  const LiquidGlassSlider({
    super.key,
    required this.value,
    required this.steps,
    required this.onChanged,
    this.semanticLabel,
    this.semanticValue,
    this.dimmed = false,
  });

  final int value;
  final int steps;
  final ValueChanged<int> onChanged;
  final String? semanticLabel;

  /// Spoken value, e.g. the step's label.
  final String? semanticValue;

  /// No value chosen yet: the thumb waits in place, the track stays grey.
  final bool dimmed;

  @override
  State<LiquidGlassSlider> createState() => _LiquidGlassSliderState();
}

class _LiquidGlassSliderState extends State<LiquidGlassSlider> {
  MethodChannel? _channel;

  @override
  void didUpdateWidget(LiquidGlassSlider old) {
    super.didUpdateWidget(old);
    if (old.value != widget.value || old.dimmed != widget.dimmed) {
      _channel?.invokeMethod<void>('setValue', {
        'value': widget.value,
        'dimmed': widget.dimmed,
      });
    }
  }

  @override
  void dispose() {
    _channel?.setMethodCallHandler(null);
    super.dispose();
  }

  void _attach(int id) {
    _channel = MethodChannel('vocare/slider_$id')
      ..setMethodCallHandler((call) async {
        // The native side snaps to steps and plays the haptic itself.
        if (call.method == 'changed' && call.arguments is int) {
          widget.onChanged(call.arguments as int);
        }
      });
  }

  void _fromFlutter(double raw) {
    final step = raw.round().clamp(0, widget.steps - 1);
    if (step == widget.value && !widget.dimmed) return;
    HapticFeedback.selectionClick();
    widget.onChanged(step);
  }

  @override
  Widget build(BuildContext context) {
    final max = (widget.steps - 1).toDouble();
    if (LiquidGlassSupport.isNative) {
      return Semantics(
        label: widget.semanticLabel,
        value: widget.semanticValue,
        child: SizedBox(
          height: 44,
          child: UiKitView(
            viewType: 'vocare/slider',
            creationParams: <String, Object?>{
              'value': widget.value,
              'steps': widget.steps,
              'dimmed': widget.dimmed,
            },
            creationParamsCodec: const StandardMessageCodec(),
            onPlatformViewCreated: _attach,
            gestureRecognizers: _eagerGestures,
          ),
        ),
      );
    }
    return Semantics(
      label: widget.semanticLabel,
      value: widget.semanticValue,
      child: ExcludeSemantics(
        child: GlassSlider(
          value: widget.value.toDouble().clamp(0, max),
          min: 0,
          max: max,
          divisions: widget.steps - 1,
          onChanged: _fromFlutter,
          activeColor: widget.dimmed
              ? AppColors.textSubtle.withValues(alpha: 0.4)
              : AppColors.gradientMid,
          useOwnLayer: true,
          quality: GlassQuality.premium,
        ),
      ),
    );
  }
}

/// Result of [showDatePickerSheet]; `date == null` means "cleared".
class DatePick {
  const DatePick(this.date);
  final DateTime? date;
}

/// Calendar in a glass sheet. Returns `null` when dismissed.
Future<DatePick?> showDatePickerSheet(
  BuildContext context, {
  required String title,
  DateTime? initial,
  DateTime? firstDate,
  DateTime? lastDate,
  bool allowClear = true,
}) {
  return showGlassSheet<DatePick>(
    context: context,
    builder: (_) => _DatePickerSheet(
      title: title,
      initial: initial,
      firstDate: firstDate,
      lastDate: lastDate,
      allowClear: allowClear,
    ),
  );
}

class _DatePickerSheet extends StatefulWidget {
  const _DatePickerSheet({
    required this.title,
    required this.initial,
    required this.firstDate,
    required this.lastDate,
    required this.allowClear,
  });

  final String title;
  final DateTime? initial;
  final DateTime? firstDate;
  final DateTime? lastDate;
  final bool allowClear;

  @override
  State<_DatePickerSheet> createState() => _DatePickerSheetState();
}

class _DatePickerSheetState extends State<_DatePickerSheet> {
  late DateTime _value = widget.initial ?? DateTime.now();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(widget.title, style: AppTypography.title),
          const SizedBox(height: 8),
          NativeDatePicker(
            initial: _value,
            firstDate: widget.firstDate,
            lastDate: widget.lastDate,
            onChanged: (d) => setState(() => _value = d),
          ),
          const SizedBox(height: 8),
          PrimaryButton(
            label: 'Gotowe',
            onPressed: () => Navigator.pop(context, DatePick(_value)),
          ),
          if (widget.allowClear && widget.initial != null)
            TextButton(
              onPressed: () => Navigator.pop(context, const DatePick(null)),
              child: Text(
                'Wyczyść datę',
                style: AppTypography.caption.copyWith(
                  color: AppColors.textMuted,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
