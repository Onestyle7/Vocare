import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../features/profile/data/profile_dates.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import 'app_text_field.dart';
import 'buttons.dart';
import 'glass_widgets.dart';
import 'native_controls.dart';
import 'pressable.dart';

enum FieldKind {
  text,

  /// Calendar picker; stored as `yyyy-MM-dd`.
  date,

  /// Calendar picker plus an "Obecnie" switch that stores `Present`.
  endDate,

  /// One of [FieldSpec.options]; stores the option value.
  choice,
}

/// One input in an [showEntrySheet] form.
class FieldSpec {
  const FieldSpec(
    this.key,
    this.label, {
    this.required = false,
    this.lines = 1,
    this.keyboard,
    this.capitalization = TextCapitalization.sentences,
    this.kind = FieldKind.text,
    this.maxLength,
  }) : options = const [];

  const FieldSpec.date(this.key, this.label)
    : required = false,
      lines = 1,
      keyboard = null,
      capitalization = TextCapitalization.none,
      kind = FieldKind.date,
      options = const [],
      maxLength = null;

  const FieldSpec.endDate(this.key, this.label)
    : required = false,
      lines = 1,
      keyboard = null,
      capitalization = TextCapitalization.none,
      kind = FieldKind.endDate,
      options = const [],
      maxLength = null;

  /// Pick one of [options] (`value`, `label`) — e.g. a language level.
  const FieldSpec.choice(this.key, this.label, this.options)
    : required = false,
      lines = 1,
      keyboard = null,
      capitalization = TextCapitalization.none,
      kind = FieldKind.choice,
      maxLength = null;

  final String key;
  final String label;
  final bool required;
  final int lines;
  final TextInputType? keyboard;
  final TextCapitalization capitalization;
  final FieldKind kind;
  final List<(String value, String label)> options;

  /// Backend limit (e.g. `[StringLength(100)]`); input stops there.
  final int? maxLength;
}

sealed class EntryAction {
  const EntryAction();
}

class EntrySaved extends EntryAction {
  const EntrySaved(this.values);
  final Map<String, String> values;
}

class EntryDeleted extends EntryAction {
  const EntryDeleted();
}

/// Common sheet scaffold: title, scrollable body, sticky primary action.
class SheetFrame extends StatelessWidget {
  const SheetFrame({
    super.key,
    required this.title,
    required this.children,
    required this.onSave,
    this.saveLabel = 'Zapisz',
    this.footer,
  });

  final String title;
  final List<Widget> children;
  final VoidCallback onSave;
  final String saveLabel;
  final Widget? footer;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title, style: AppTypography.title, textAlign: TextAlign.center),
          const SizedBox(height: 20),
          Flexible(
            child: SingleChildScrollView(
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: children,
              ),
            ),
          ),
          const SizedBox(height: 16),
          PrimaryButton(label: saveLabel, onPressed: onSave),
          ?footer,
        ],
      ),
    );
  }
}

/// Add / edit one entry of a list section (experience, education, …).
Future<EntryAction?> showEntrySheet({
  required BuildContext context,
  required String title,
  required List<FieldSpec> fields,
  Map<String, String> initial = const {},
  bool canDelete = false,
}) {
  return showGlassSheet<EntryAction>(
    context: context,
    builder: (_) => _EntrySheet(
      title: title,
      fields: fields,
      initial: initial,
      canDelete: canDelete,
    ),
  );
}

class _EntrySheet extends StatefulWidget {
  const _EntrySheet({
    required this.title,
    required this.fields,
    required this.initial,
    required this.canDelete,
  });

  final String title;
  final List<FieldSpec> fields;
  final Map<String, String> initial;
  final bool canDelete;

  @override
  State<_EntrySheet> createState() => _EntrySheetState();
}

class _EntrySheetState extends State<_EntrySheet> {
  final _form = GlobalKey<FormState>();
  late final _controllers = {
    for (final f in widget.fields)
      f.key: TextEditingController(text: widget.initial[f.key] ?? ''),
  };

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  void _save() {
    if (!_form.currentState!.validate()) return;
    Navigator.pop(
      context,
      EntrySaved({
        for (final e in _controllers.entries) e.key: e.value.text.trim(),
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _form,
      child: SheetFrame(
        title: widget.title,
        onSave: _save,
        footer: widget.canDelete
            ? TextButton(
                onPressed: () => Navigator.pop(context, const EntryDeleted()),
                child: Text(
                  'Usuń',
                  style: AppTypography.caption.copyWith(
                    color: AppColors.danger,
                  ),
                ),
              )
            : null,
        children: [
          for (final field in widget.fields)
            if (field.kind == FieldKind.choice) ...[
              FieldLabel(field.label),
              _ChoiceInput(
                controller: _controllers[field.key]!,
                options: field.options,
              ),
              const SizedBox(height: 14),
            ] else if (field.kind != FieldKind.text) ...[
              FieldLabel(field.label),
              _DateInput(
                controller: _controllers[field.key]!,
                label: field.label,
                allowPresent: field.kind == FieldKind.endDate,
              ),
              const SizedBox(height: 14),
            ] else ...[
              FieldLabel(field.label, required: field.required),
              AppTextField(
                controller: _controllers[field.key]!,
                hint: field.label,
                maxLines: field.lines,
                inputFormatters: field.maxLength == null
                    ? null
                    : [LengthLimitingTextInputFormatter(field.maxLength)],
                keyboardType: field.lines > 1
                    ? TextInputType.multiline
                    : field.keyboard,
                textCapitalization: field.capitalization,
                textInputAction: field.lines > 1
                    ? TextInputAction.newline
                    : TextInputAction.next,
                validator: field.required
                    ? (v) => v.isEmpty ? 'To pole jest wymagane' : null
                    : null,
              ),
              const SizedBox(height: 14),
            ],
        ],
      ),
    );
  }
}

class FieldLabel extends StatelessWidget {
  const FieldLabel(this.text, {super.key, this.required = false});

  final String text;
  final bool required;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 20, bottom: 6),
      child: Text(required ? '$text *' : text, style: AppTypography.label),
    );
  }
}

/// Skills editor: type + "Dodaj", removable chips.
Future<List<String>?> showTagsSheet({
  required BuildContext context,
  required String title,
  required String hint,
  required List<String> initial,
}) {
  return showGlassSheet<List<String>>(
    context: context,
    builder: (_) => _TagsSheet(title: title, hint: hint, initial: initial),
  );
}

class _TagsSheet extends StatefulWidget {
  const _TagsSheet({
    required this.title,
    required this.hint,
    required this.initial,
  });

  final String title;
  final String hint;
  final List<String> initial;

  @override
  State<_TagsSheet> createState() => _TagsSheetState();
}

class _TagsSheetState extends State<_TagsSheet> {
  late final List<String> _tags = [...widget.initial];
  final _input = TextEditingController();
  final _focus = FocusNode();

  @override
  void dispose() {
    _input.dispose();
    _focus.dispose();
    super.dispose();
  }

  void _add() {
    final values = _input.text
        .split(',')
        .map((v) => v.trim())
        .where(
          (v) =>
              v.isNotEmpty &&
              !_tags.any((t) => t.toLowerCase() == v.toLowerCase()),
        );
    if (values.isEmpty) return;
    HapticFeedback.selectionClick();
    setState(() {
      _tags.addAll(values);
      _input.clear();
    });
    _focus.requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    return SheetFrame(
      title: widget.title,
      onSave: () {
        _add();
        Navigator.pop(context, _tags);
      },
      children: [
        Row(
          children: [
            Expanded(
              child: AppTextField(
                controller: _input,
                focusNode: _focus,
                hint: widget.hint,
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _add(),
              ),
            ),
            const SizedBox(width: 10),
            Pressable(
              onTap: _add,
              semanticLabel: 'Dodaj',
              child: Container(
                width: 52,
                height: 52,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: AppColors.brandGradient,
                ),
                child: const Icon(Icons.add_rounded, color: Colors.white),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (_tags.isEmpty)
          Text(
            'Dodaj kilka pozycji - możesz wpisać kilka naraz, oddzielając je przecinkami.',
            style: AppTypography.label,
            textAlign: TextAlign.center,
          ),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final tag in _tags)
              InputChip(
                label: Text(tag),
                labelStyle: AppTypography.caption.copyWith(height: 1.2),
                backgroundColor: AppColors.surfaceRaised,
                side: const BorderSide(color: AppColors.hairline),
                shape: const StadiumBorder(),
                deleteIconColor: AppColors.textSubtle,
                onDeleted: () => setState(() => _tags.remove(tag)),
              ),
          ],
        ),
      ],
    );
  }
}

/// Single long-text field (O mnie, Dodatkowe informacje).
Future<String?> showTextSheet({
  required BuildContext context,
  required String title,
  required String hint,
  required String initial,
}) async {
  final result = await showEntrySheet(
    context: context,
    title: title,
    fields: [FieldSpec('text', hint, lines: 6)],
    initial: {'text': initial},
  );
  return result is EntrySaved ? result.values['text'] : null;
}

/// Date row backed by a plain controller so it saves like any other field.
/// Tapping opens the native calendar; end dates also offer "Obecnie".
class _DateInput extends StatefulWidget {
  const _DateInput({
    required this.controller,
    required this.label,
    required this.allowPresent,
  });

  final TextEditingController controller;
  final String label;
  final bool allowPresent;

  @override
  State<_DateInput> createState() => _DateInputState();
}

class _DateInputState extends State<_DateInput> {
  /// Last real date, restored when "Obecnie" is switched off again.
  String _lastDate = '';

  String get _value => widget.controller.text.trim();
  bool get _present => ProfileDates.isPresent(_value);

  @override
  void initState() {
    super.initState();
    if (!_present) _lastDate = _value;
  }

  Future<void> _pick() async {
    FocusScope.of(context).unfocus();
    final pick = await showDatePickerSheet(
      context,
      title: widget.label,
      initial: ProfileDates.parse(_value),
    );
    if (pick == null || !mounted) return;
    setState(() {
      _lastDate = pick.date == null ? '' : ProfileDates.store(pick.date!);
      widget.controller.text = _lastDate;
    });
  }

  void _setPresent(bool present) {
    setState(() {
      widget.controller.text = present ? ProfileDates.present : _lastDate;
    });
  }

  @override
  Widget build(BuildContext context) {
    final hasDate = _value.isNotEmpty && !_present;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.allowPresent)
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 8, 8),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'Obecnie',
                    style: AppTypography.body.copyWith(fontSize: 15),
                  ),
                ),
                LiquidGlassSwitch(
                  value: _present,
                  onChanged: _setPresent,
                  semanticLabel: 'Obecnie',
                ),
              ],
            ),
          ),
        AnimatedSize(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOutCubic,
          alignment: Alignment.topCenter,
          child: _present
              ? const SizedBox(width: double.infinity)
              : Pressable(
                  onTap: _pick,
                  scale: 0.98,
                  semanticLabel: widget.label,
                  child: Container(
                    height: 61,
                    padding: const EdgeInsets.symmetric(horizontal: 22),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.calendar_today_rounded,
                          size: 19,
                          color: hasDate
                              ? AppColors.accent
                              : AppColors.iconMuted,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            hasDate
                                ? ProfileDates.long(_value)
                                : 'Wybierz datę',
                            style: AppTypography.bodyLight.copyWith(
                              fontWeight: hasDate
                                  ? FontWeight.w300
                                  : FontWeight.w200,
                            ),
                          ),
                        ),
                        const Icon(
                          Icons.expand_more_rounded,
                          color: AppColors.iconMuted,
                        ),
                      ],
                    ),
                  ),
                ),
        ),
      ],
    );
  }
}

/// Wrap of pill options bound to a controller (stores the option value).
class _ChoiceInput extends StatefulWidget {
  const _ChoiceInput({required this.controller, required this.options});

  final TextEditingController controller;
  final List<(String value, String label)> options;

  @override
  State<_ChoiceInput> createState() => _ChoiceInputState();
}

class _ChoiceInputState extends State<_ChoiceInput> {
  @override
  Widget build(BuildContext context) {
    final current = widget.controller.text;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          for (final (value, label) in widget.options)
            ChoiceChip(
              label: Text(label),
              selected: value == current,
              onSelected: (_) {
                HapticFeedback.selectionClick();
                setState(() => widget.controller.text = value);
              },
              showCheckmark: false,
              labelStyle: AppTypography.caption.copyWith(
                height: 1.2,
                color: value == current ? Colors.white : AppColors.textMuted,
              ),
              backgroundColor: AppColors.surface,
              selectedColor: AppColors.gradientMid.withValues(alpha: 0.45),
              side: BorderSide(
                color: value == current
                    ? AppColors.gradientSoft
                    : AppColors.hairline,
              ),
              shape: const StadiumBorder(),
            ),
        ],
      ),
    );
  }
}
