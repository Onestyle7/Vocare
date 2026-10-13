import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../../../../core/widgets/form_sheets.dart';
import '../../../../core/widgets/glass_widgets.dart';
import '../../../../core/widgets/pressable.dart';

class OfferInput {
  const OfferInput({
    required this.position,
    required this.description,
    this.replace = false,
  });

  final String position;
  final String description;

  /// Tailoring only: overwrite the open CV instead of saving a new version.
  final bool replace;
}

/// Position + pasted job offer. With [tailoring], also asks whether to keep
/// the current CV (new version) or replace it — the web's two modes.
Future<OfferInput?> showOfferSheet(
  BuildContext context, {
  required String title,
  required String subtitle,
  required String actionLabel,
  String initialPosition = '',
  bool tailoring = false,
  bool canCreateCopy = true,
}) {
  return showGlassSheet<OfferInput>(
    context: context,
    builder: (_) => _OfferSheet(
      title: title,
      subtitle: subtitle,
      actionLabel: actionLabel,
      initialPosition: initialPosition,
      tailoring: tailoring,
      canCreateCopy: canCreateCopy,
    ),
  );
}

class _OfferSheet extends StatefulWidget {
  const _OfferSheet({
    required this.title,
    required this.subtitle,
    required this.actionLabel,
    required this.initialPosition,
    required this.tailoring,
    required this.canCreateCopy,
  });

  final String title;
  final String subtitle;
  final String actionLabel;
  final String initialPosition;
  final bool tailoring;
  final bool canCreateCopy;

  @override
  State<_OfferSheet> createState() => _OfferSheetState();
}

class _OfferSheetState extends State<_OfferSheet> {
  final _form = GlobalKey<FormState>();
  late final _position = TextEditingController(text: widget.initialPosition);
  final _description = TextEditingController();
  late bool _replace = !widget.canCreateCopy;

  @override
  void dispose() {
    _position.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _paste() async {
    final data = await Clipboard.getData(Clipboard.kTextPlain);
    final text = data?.text?.trim();
    if (text == null || text.isEmpty) return;
    HapticFeedback.selectionClick();
    setState(() => _description.text = text);
  }

  void _submit() {
    if (!_form.currentState!.validate()) return;
    Navigator.pop(
      context,
      OfferInput(
        position: _position.text.trim(),
        description: _description.text.trim(),
        replace: _replace,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _form,
      child: SheetFrame(
        title: widget.title,
        onSave: _submit,
        saveLabel: widget.actionLabel,
        children: [
          Text(
            widget.subtitle,
            style: AppTypography.caption.copyWith(
              color: AppColors.textMuted,
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 18),
          const FieldLabel('Tytuł stanowiska', required: true),
          AppTextField(
            controller: _position,
            hint: 'np. Junior Data Analyst',
            // Becomes the CV name and target position: max 100 characters.
            inputFormatters: [LengthLimitingTextInputFormatter(100)],
            textCapitalization: TextCapitalization.sentences,
            textInputAction: TextInputAction.next,
            validator: (v) => v.isEmpty ? 'Podaj stanowisko' : null,
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              const Expanded(child: FieldLabel('Opis oferty', required: true)),
              Padding(
                padding: const EdgeInsets.only(bottom: 6, right: 4),
                child: Pressable(
                  onTap: _paste,
                  child: Row(
                    children: [
                      const Icon(
                        Icons.content_paste_rounded,
                        size: 15,
                        color: AppColors.accent,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Wklej ze schowka',
                        style: AppTypography.label.copyWith(
                          color: AppColors.accent,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          AppTextField(
            controller: _description,
            hint: 'Wklej treść ogłoszenia — obowiązki i wymagania',
            maxLines: 8,
            keyboardType: TextInputType.multiline,
            textInputAction: TextInputAction.newline,
            validator: (v) => v.length < 40
                ? 'Wklej pełniejszy opis oferty (min. 40 znaków)'
                : null,
          ),
          if (widget.tailoring) ...[
            const SizedBox(height: 18),
            _ModeOption(
              selected: !_replace,
              enabled: widget.canCreateCopy,
              title: 'Zapisz jako nowe CV',
              subtitle: widget.canCreateCopy
                  ? 'Aktualne CV zostanie bez zmian. Zalecane.'
                  : 'Osiągnięto limit CV — usuń nieaktualne CV, aby zapisać kopię.',
              onTap: () => setState(() => _replace = false),
            ),
            const SizedBox(height: 8),
            _ModeOption(
              selected: _replace,
              enabled: true,
              title: 'Zastąp to CV',
              subtitle:
                  'Treść zostanie nadpisana dopiero po otrzymaniu wyniku.',
              onTap: () => setState(() => _replace = true),
            ),
          ],
        ],
      ),
    );
  }
}

class _ModeOption extends StatelessWidget {
  const _ModeOption({
    required this.selected,
    required this.enabled,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final bool selected;
  final bool enabled;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1 : 0.5,
      child: Pressable(
        onTap: enabled ? onTap : null,
        scale: 0.985,
        semanticLabel: title,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: selected ? AppColors.gradientSoft : AppColors.hairline,
              width: selected ? 1.4 : 1,
            ),
          ),
          child: Row(
            children: [
              Icon(
                selected
                    ? Icons.radio_button_checked_rounded
                    : Icons.radio_button_off_rounded,
                color: selected ? AppColors.accent : AppColors.textSubtle,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: AppTypography.button.copyWith(height: 1.3),
                    ),
                    Text(
                      subtitle,
                      style: AppTypography.label.copyWith(height: 1.4),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
