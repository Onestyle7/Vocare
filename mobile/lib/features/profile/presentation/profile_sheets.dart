import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/form_sheets.dart';
import '../../../core/widgets/glass_widgets.dart';
import '../../../core/widgets/native_controls.dart';
import '../../../core/widgets/pressable.dart';
import '../data/user_profile.dart';

export '../../../core/widgets/form_sheets.dart';

/// Basic data required by the backend: name, country, personality type.
Future<UserProfile?> showBasicsSheet(
  BuildContext context,
  UserProfile profile,
) {
  return showGlassSheet<UserProfile>(
    context: context,
    builder: (_) => _BasicsSheet(profile: profile),
  );
}

class _BasicsSheet extends StatefulWidget {
  const _BasicsSheet({required this.profile});

  final UserProfile profile;

  @override
  State<_BasicsSheet> createState() => _BasicsSheetState();
}

class _BasicsSheetState extends State<_BasicsSheet> {
  final _form = GlobalKey<FormState>();
  late final _first = TextEditingController(text: widget.profile.firstName);
  late final _last = TextEditingController(text: widget.profile.lastName);
  late final _country = TextEditingController(
    text: widget.profile.country.isEmpty ? 'Polska' : widget.profile.country,
  );
  late final _phone = TextEditingController(
    text: widget.profile.phoneNumber ?? '',
  );
  late final _address = TextEditingController(
    text: widget.profile.address ?? '',
  );
  late PersonalityType? _personality = widget.profile.personalityType;
  bool _personalityError = false;

  @override
  void dispose() {
    for (final c in [_first, _last, _country, _phone, _address]) {
      c.dispose();
    }
    super.dispose();
  }

  String? _required(String v) => v.isEmpty ? 'To pole jest wymagane' : null;

  void _save() {
    final valid = _form.currentState!.validate();
    setState(() => _personalityError = _personality == null);
    if (!valid || _personality == null) return;
    Navigator.pop(
      context,
      widget.profile.copyWith(
        firstName: _first.text.trim(),
        lastName: _last.text.trim(),
        country: _country.text.trim(),
        phoneNumber: _phone.text.trim(),
        address: _address.text.trim(),
        personalityType: _personality,
      ),
    );
  }

  Future<void> _pickPersonality() async {
    FocusScope.of(context).unfocus();
    final picked = await showGlassSheet<PersonalityType>(
      context: context,
      builder: (sheet) => _PersonalityPicker(selected: _personality),
    );
    if (picked != null) {
      setState(() {
        _personality = picked;
        _personalityError = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _form,
      child: SheetFrame(
        title: 'Dane podstawowe',
        onSave: _save,
        children: [
          const FieldLabel('Imię', required: true),
          AppTextField(
            controller: _first,
            hint: 'Imię',
            textCapitalization: TextCapitalization.words,
            textInputAction: TextInputAction.next,
            autofillHints: const [AutofillHints.givenName],
            validator: _required,
          ),
          const SizedBox(height: 14),
          const FieldLabel('Nazwisko', required: true),
          AppTextField(
            controller: _last,
            hint: 'Nazwisko',
            textCapitalization: TextCapitalization.words,
            textInputAction: TextInputAction.next,
            autofillHints: const [AutofillHints.familyName],
            validator: _required,
          ),
          const SizedBox(height: 14),
          const FieldLabel('Kraj', required: true),
          AppTextField(
            controller: _country,
            hint: 'Kraj',
            textCapitalization: TextCapitalization.words,
            textInputAction: TextInputAction.next,
            autofillHints: const [AutofillHints.countryName],
            validator: _required,
          ),
          const SizedBox(height: 14),
          const FieldLabel('Typ osobowości', required: true),
          Pressable(
            onTap: _pickPersonality,
            scale: 0.98,
            child: Container(
              height: 61,
              padding: const EdgeInsets.symmetric(horizontal: 24),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(
                  color: _personalityError
                      ? AppColors.danger.withValues(alpha: 0.7)
                      : Colors.transparent,
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      _personality?.label ?? 'Wybierz typ osobowości',
                      style: AppTypography.bodyLight.copyWith(
                        fontWeight: _personality == null
                            ? FontWeight.w200
                            : FontWeight.w300,
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
          if (_personalityError)
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 6, 24, 0),
              child: Text(
                'Wybierz typ osobowości',
                style: AppTypography.label.copyWith(color: AppColors.danger),
              ),
            ),
          const SizedBox(height: 14),
          const FieldLabel('Telefon'),
          AppTextField(
            controller: _phone,
            hint: '+48 600 000 000',
            keyboardType: TextInputType.phone,
            textInputAction: TextInputAction.next,
            autofillHints: const [AutofillHints.telephoneNumber],
          ),
          const SizedBox(height: 14),
          const FieldLabel('Miasto / adres'),
          AppTextField(
            controller: _address,
            hint: 'np. Warszawa',
            textCapitalization: TextCapitalization.words,
            autofillHints: const [AutofillHints.addressCity],
          ),
        ],
      ),
    );
  }
}

class _PersonalityPicker extends StatelessWidget {
  const _PersonalityPicker({required this.selected});

  final PersonalityType? selected;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 16, 12, 12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('Typ osobowości', style: AppTypography.title),
          const SizedBox(height: 4),
          Text('Wg testu 16 osobowości (MBTI)', style: AppTypography.label),
          const SizedBox(height: 12),
          Flexible(
            child: ListView(
              shrinkWrap: true,
              children: [
                for (final type in PersonalityType.values)
                  ListTile(
                    onTap: () => Navigator.pop(context, type),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(18),
                    ),
                    title: Text(type.label, style: AppTypography.body),
                    trailing: type == selected
                        ? const Icon(
                            Icons.check_rounded,
                            color: AppColors.accent,
                          )
                        : null,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Salary expectations, risk appetite and mobility.
Future<(FinancialSurvey, bool)?> showFinanceSheet(
  BuildContext context, {
  required FinancialSurvey survey,
  required bool willingToRebrand,
}) {
  return showGlassSheet<(FinancialSurvey, bool)>(
    context: context,
    builder: (_) =>
        _FinanceSheet(survey: survey, willingToRebrand: willingToRebrand),
  );
}

class _FinanceSheet extends StatefulWidget {
  const _FinanceSheet({required this.survey, required this.willingToRebrand});

  final FinancialSurvey survey;
  final bool willingToRebrand;

  @override
  State<_FinanceSheet> createState() => _FinanceSheetState();
}

class _FinanceSheetState extends State<_FinanceSheet> {
  late final _current = TextEditingController(
    text: _format(widget.survey.currentSalary),
  );
  late final _desired = TextEditingController(
    text: _format(widget.survey.desiredSalary),
  );
  late final _loanDetails = TextEditingController(
    text: widget.survey.loanDetails ?? '',
  );
  late RiskAppetite _risk = widget.survey.riskAppetite;
  late bool _relocate = widget.survey.willingToRelocate;
  late bool _loans = widget.survey.hasLoans;
  late bool _rebrand = widget.willingToRebrand;

  static String _format(double? v) =>
      v == null || v == 0 ? '' : v.toStringAsFixed(0);

  @override
  void dispose() {
    for (final c in [_current, _desired, _loanDetails]) {
      c.dispose();
    }
    super.dispose();
  }

  double? _parse(String v) => double.tryParse(
    v.replaceAll(RegExp(r'[^\d.,]'), '').replaceAll(',', '.'),
  );

  @override
  Widget build(BuildContext context) {
    final digits = [FilteringTextInputFormatter.digitsOnly];
    return SheetFrame(
      title: 'Finanse i preferencje',
      onSave: () => Navigator.pop(context, (
        FinancialSurvey(
          currentSalary: _parse(_current.text),
          desiredSalary: _parse(_desired.text),
          hasLoans: _loans,
          loanDetails: _loans ? _loanDetails.text.trim() : null,
          riskAppetite: _risk,
          willingToRelocate: _relocate,
        ),
        _rebrand,
      )),
      children: [
        const FieldLabel('Obecne wynagrodzenie (zł brutto / mies.)'),
        AppTextField(
          controller: _current,
          hint: 'np. 8000',
          keyboardType: TextInputType.number,
          inputFormatters: digits,
        ),
        const SizedBox(height: 14),
        const FieldLabel('Oczekiwane wynagrodzenie (zł brutto / mies.)'),
        AppTextField(
          controller: _desired,
          hint: 'np. 12000',
          keyboardType: TextInputType.number,
          inputFormatters: digits,
        ),
        const SizedBox(height: 18),
        _RiskSlider(
          value: _risk,
          onChanged: (risk) => setState(() => _risk = risk),
        ),
        const SizedBox(height: 12),
        _Toggle(
          label: 'Gotowość do przeprowadzki',
          value: _relocate,
          onChanged: (v) => setState(() => _relocate = v),
        ),
        _Toggle(
          label: 'Otwartość na przebranżowienie',
          value: _rebrand,
          onChanged: (v) => setState(() => _rebrand = v),
        ),
        _Toggle(
          label: 'Mam zobowiązania kredytowe',
          value: _loans,
          onChanged: (v) => setState(() => _loans = v),
        ),
        if (_loans) ...[
          const SizedBox(height: 8),
          AppTextField(
            controller: _loanDetails,
            hint: 'Szczegóły (opcjonalnie)',
            maxLines: 3,
          ),
        ],
      ],
    );
  }
}

class _Toggle extends StatelessWidget {
  const _Toggle({
    required this.label,
    required this.value,
    required this.onChanged,
  });

  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: AppTypography.body.copyWith(fontSize: 15),
            ),
          ),
          LiquidGlassSwitch(
            value: value,
            onChanged: onChanged,
            semanticLabel: label,
          ),
        ],
      ),
    );
  }
}

/// Risk appetite as a stepped Liquid Glass slider (Niska → Bardzo wysoka).
/// "Nie wiem" is not a point on that scale, so it is a separate switch; the
/// slider then waits greyed out until it is moved.
class _RiskSlider extends StatelessWidget {
  const _RiskSlider({required this.value, required this.onChanged});

  final RiskAppetite value;
  final ValueChanged<RiskAppetite> onChanged;

  static const _scale = [
    RiskAppetite.low,
    RiskAppetite.medium,
    RiskAppetite.high,
    RiskAppetite.critical,
  ];

  @override
  Widget build(BuildContext context) {
    final unknown = value == RiskAppetite.unknown;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            const Expanded(child: FieldLabel('Skłonność do ryzyka')),
            Padding(
              padding: const EdgeInsets.only(bottom: 6, right: 4),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 180),
                child: Text(
                  value.label,
                  key: ValueKey(value),
                  style: AppTypography.label.copyWith(
                    color: unknown ? AppColors.textSubtle : AppColors.accent,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: LiquidGlassSlider(
            value: unknown ? 1 : _scale.indexOf(value),
            steps: _scale.length,
            dimmed: unknown,
            semanticLabel: 'Skłonność do ryzyka',
            semanticValue: value.label,
            onChanged: (step) => onChanged(_scale[step]),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(4, 2, 4, 0),
          child: Row(
            children: [
              Text(_scale.first.label, style: AppTypography.label),
              const Spacer(),
              Text(_scale.last.label, style: AppTypography.label),
            ],
          ),
        ),
        const SizedBox(height: 6),
        _Toggle(
          label: 'Nie wiem',
          value: unknown,
          // Turning it off picks the middle of the scale, where the thumb waits.
          onChanged: (on) =>
              onChanged(on ? RiskAppetite.unknown : RiskAppetite.medium),
        ),
      ],
    );
  }
}
