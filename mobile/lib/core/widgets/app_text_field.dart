import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import 'app_icon.dart';

/// Pill input from the Figma auth screens: #1C1E26 fill, leading line icon,
/// ExtraLight placeholder. Focus adds a soft brand rim, errors a red one.
class AppTextField extends StatefulWidget {
  const AppTextField({
    super.key,
    required this.controller,
    required this.hint,
    this.icon,
    this.obscure = false,
    this.keyboardType,
    this.textInputAction,
    this.autofillHints,
    this.validator,
    this.onSubmitted,
    this.focusNode,
    this.enabled = true,
    this.maxLines = 1,
    this.inputFormatters,
    this.textCapitalization = TextCapitalization.none,
  });

  final TextEditingController controller;
  final String hint;
  final AppIcons? icon;
  final bool obscure;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final Iterable<String>? autofillHints;
  final String? Function(String value)? validator;
  final ValueChanged<String>? onSubmitted;
  final FocusNode? focusNode;
  final bool enabled;
  final int maxLines;
  final List<TextInputFormatter>? inputFormatters;
  final TextCapitalization textCapitalization;

  @override
  State<AppTextField> createState() => _AppTextFieldState();
}

class _AppTextFieldState extends State<AppTextField> {
  late final FocusNode _focus = widget.focusNode ?? FocusNode();
  late bool _obscured = widget.obscure;
  bool _focused = false;

  @override
  void initState() {
    super.initState();
    _focus.addListener(_onFocus);
  }

  @override
  void dispose() {
    _focus.removeListener(_onFocus);
    if (widget.focusNode == null) _focus.dispose();
    super.dispose();
  }

  void _onFocus() => setState(() => _focused = _focus.hasFocus);

  @override
  Widget build(BuildContext context) {
    final multiline = widget.maxLines > 1;
    return FormField<String>(
      validator: widget.validator == null
          ? null
          : (_) => widget.validator!(widget.controller.text.trim()),
      builder: (field) {
        final error = field.errorText;
        final borderColor = error != null
            ? AppColors.danger.withValues(alpha: 0.7)
            : _focused
            ? AppColors.gradientSoft.withValues(alpha: 0.55)
            : Colors.transparent;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              constraints: BoxConstraints(minHeight: AppSpacing.control),
              padding: EdgeInsets.only(
                left: widget.icon == null ? 24 : 20,
                right: widget.obscure ? 8 : 20,
                top: multiline ? 14 : 0,
                bottom: multiline ? 14 : 0,
              ),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(multiline ? 28 : 999),
                border: Border.all(color: borderColor, width: 1),
              ),
              child: Row(
                crossAxisAlignment: multiline
                    ? CrossAxisAlignment.start
                    : CrossAxisAlignment.center,
                children: [
                  if (widget.icon != null) ...[
                    AnimatedOpacity(
                      duration: const Duration(milliseconds: 180),
                      opacity: _focused ? 1 : 0.85,
                      child: AppIcon(widget.icon!, size: 22),
                    ),
                    const SizedBox(width: 8),
                  ],
                  Expanded(
                    child: TextField(
                      controller: widget.controller,
                      focusNode: _focus,
                      enabled: widget.enabled,
                      obscureText: _obscured,
                      keyboardType: widget.keyboardType,
                      textInputAction: widget.textInputAction,
                      autofillHints: widget.autofillHints,
                      maxLines: widget.obscure ? 1 : widget.maxLines,
                      minLines: 1,
                      inputFormatters: widget.inputFormatters,
                      textCapitalization: widget.textCapitalization,
                      onChanged: (value) {
                        if (field.hasError) field.validate();
                        field.didChange(value);
                      },
                      onSubmitted: widget.onSubmitted,
                      style: AppTypography.bodyLight.copyWith(
                        fontWeight: FontWeight.w300,
                      ),
                      decoration: InputDecoration(
                        isCollapsed: true,
                        border: InputBorder.none,
                        hintText: widget.hint,
                        hintStyle: AppTypography.bodyLight.copyWith(
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                  ),
                  if (widget.obscure)
                    IconButton(
                      onPressed: () => setState(() => _obscured = !_obscured),
                      tooltip: _obscured ? 'Pokaż hasło' : 'Ukryj hasło',
                      icon: Icon(
                        _obscured
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                        size: 20,
                        color: AppColors.iconMuted,
                      ),
                    ),
                ],
              ),
            ),
            AnimatedSize(
              duration: const Duration(milliseconds: 180),
              alignment: Alignment.topLeft,
              child: error == null
                  ? const SizedBox(width: double.infinity)
                  : Padding(
                      padding: const EdgeInsets.fromLTRB(24, 6, 24, 0),
                      child: Text(
                        error,
                        style: AppTypography.label.copyWith(
                          color: AppColors.danger,
                        ),
                      ),
                    ),
            ),
          ],
        );
      },
    );
  }
}
