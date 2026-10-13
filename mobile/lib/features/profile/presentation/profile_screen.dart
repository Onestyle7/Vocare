import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_error.dart';
import '../../../core/network/result.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/buttons.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/glass_widgets.dart';
import '../../../core/widgets/pressable.dart';
import '../../auth/application/session_controller.dart';
import '../../legal/presentation/privacy_section.dart';
import '../data/profile_dates.dart';
import '../data/profile_repository.dart';
import '../data/user_profile.dart';
import 'cv_import.dart';
import 'profile_sheets.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileProvider);
    final top = MediaQuery.paddingOf(context).top;

    return Scaffold(
      body: Stack(
        children: [
          Positioned(
            top: -40,
            left: 0,
            right: 0,
            child: const Center(
              child: AmbientGlow(size: 220, opacity: 0.3, blur: 100),
            ),
          ),
          switch (profile) {
            AsyncData(:final value) => _ProfileBody(profile: value),
            AsyncError(:final error) => Center(
              child: StateMessage(
                icon: Icons.cloud_off_rounded,
                title: 'Nie udało się wczytać profilu',
                message: error is ApiError
                    ? error.message
                    : 'Spróbuj ponownie za chwilę.',
                actionLabel: 'Spróbuj ponownie',
                onAction: () => ref.invalidate(profileProvider),
              ),
            ),
            _ => const Center(child: CircularProgressIndicator.adaptive()),
          },
          // Solid behind the back button, fading out exactly where the
          // content starts, so the avatar is never veiled at rest.
          TopScrollFade(
            solidHeight: top + 8 + AppSpacing.navButton,
            height: top + AppSpacing.navButton + 32,
          ),
          Positioned(
            top: top + 8,
            left: AppSpacing.gutter,
            child: const GlassBackButton(),
          ),
        ],
      ),
    );
  }
}

class _ProfileBody extends ConsumerWidget {
  const _ProfileBody({required this.profile});

  /// `null` when the profile has not been created yet.
  final UserProfile? profile;

  UserProfile _base(WidgetRef ref) =>
      profile ?? UserProfile(email: ref.read(sessionProvider).email ?? '');

  Future<void> _save(
    BuildContext context,
    WidgetRef ref,
    UserProfile updated,
  ) async {
    final result = await ref.read(profileProvider.notifier).save(updated);
    if (!context.mounted) return;
    switch (result) {
      case Ok():
        showToast(context, 'Zapisano zmiany', kind: ToastKind.success);
      case Err(:final error):
        showToast(context, error.message, kind: ToastKind.error);
    }
  }

  /// The backend rejects saves without the basics, so collect them first.
  Future<UserProfile?> _ensureBasics(
    BuildContext context,
    WidgetRef ref,
  ) async {
    final base = _base(ref);
    if (base.hasRequiredFields) return base;
    showToast(context, 'Najpierw uzupełnij dane podstawowe.');
    final updated = await showBasicsSheet(context, base);
    if (updated == null || !context.mounted) return null;
    await _save(context, ref, updated);
    return ref.read(profileProvider).value;
  }

  Future<void> _edit(
    BuildContext context,
    WidgetRef ref,
    Future<UserProfile?> Function(UserProfile base) editor,
  ) async {
    final base = await _ensureBasics(context, ref);
    if (base == null || !context.mounted) return;
    final updated = await editor(base);
    if (updated != null && context.mounted) await _save(context, ref, updated);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final p = profile;
    final email = p?.email.isNotEmpty == true
        ? p!.email
        : ref.watch(sessionProvider).email;

    return ListView(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.gutter,
        // Below the floating back button and its scroll-edge fade.
        MediaQuery.paddingOf(context).top + AppSpacing.navButton + 32,
        AppSpacing.gutter,
        MediaQuery.paddingOf(context).bottom + 32,
      ),
      children: [
        _Identity(profile: p, email: email),
        const SizedBox(height: 24),
        OutlinePillButton(
          label: 'Uzupełnij profil z CV',
          leading: const Icon(
            Icons.upload_file_rounded,
            size: 20,
            color: AppColors.textMuted,
          ),
          onPressed: () => importCvFlow(context, ref),
        ),
        const SizedBox(height: 28),
        _Section(
          title: 'Dane podstawowe',
          onEdit: () async {
            final updated = await showBasicsSheet(context, _base(ref));
            if (updated != null && context.mounted) {
              await _save(context, ref, updated);
            }
          },
          child: p == null || !p.hasRequiredFields
              ? const _Empty(
                  'Imię, nazwisko, kraj i typ osobowości są wymagane.',
                )
              : _KeyValues([
                  ('Imię i nazwisko', p.fullName),
                  ('Kraj', p.country),
                  ('Typ osobowości', p.personalityType?.label ?? '—'),
                  if (p.phoneNumber?.isNotEmpty == true)
                    ('Telefon', p.phoneNumber!),
                  if (p.address?.isNotEmpty == true)
                    ('Miasto / adres', p.address!),
                ]),
        ),
        _Section(
          title: 'O mnie',
          onEdit: () => _edit(context, ref, (base) async {
            final text = await showTextSheet(
              context: context,
              title: 'O mnie',
              hint: 'Kilka zdań o sobie i swoich celach',
              initial: base.aboutMe ?? '',
            );
            return text == null ? null : base.copyWith(aboutMe: text);
          }),
          child: _Paragraph(
            p?.aboutMe,
            empty: 'Opowiedz krótko o sobie i swoich celach.',
          ),
        ),
        _Section(
          title: 'Umiejętności',
          onEdit: () => _edit(context, ref, (base) async {
            final tags = await showTagsSheet(
              context: context,
              title: 'Umiejętności',
              hint: 'np. Python, SQL',
              initial: base.skills,
            );
            return tags == null ? null : base.copyWith(skills: tags);
          }),
          child: _Chips(
            p?.skills ?? const [],
            empty: 'Dodaj umiejętności twarde.',
          ),
        ),
        _Section(
          title: 'Umiejętności miękkie',
          onEdit: () => _edit(context, ref, (base) async {
            final tags = await showTagsSheet(
              context: context,
              title: 'Umiejętności miękkie',
              hint: 'np. komunikacja',
              initial: base.softSkills,
            );
            return tags == null ? null : base.copyWith(softSkills: tags);
          }),
          child: _Chips(
            p?.softSkills ?? const [],
            empty: 'Dodaj umiejętności miękkie.',
          ),
        ),
        _EntryListSection<WorkEntry>(
          title: 'Doświadczenie zawodowe',
          entries: p?.workExperience ?? const [],
          empty: 'Dodaj miejsca pracy, staże lub projekty.',
          fields: const [
            FieldSpec('position', 'Stanowisko', required: true),
            FieldSpec(
              'company',
              'Firma',
              required: true,
              capitalization: TextCapitalization.words,
            ),
            FieldSpec.date('startDate', 'Od'),
            FieldSpec.endDate('endDate', 'Do'),
            FieldSpec('description', 'Opis', lines: 3),
            FieldSpec(
              'responsibilities',
              'Obowiązki — jeden w linii',
              lines: 4,
            ),
          ],
          toValues: (e) => {
            'position': e.position,
            'company': e.company,
            'startDate': e.startDate ?? '',
            'endDate': _endForEdit(e.startDate, e.endDate),
            'description': e.description,
            'responsibilities': e.responsibilities.join('\n'),
          },
          fromValues: (v) => WorkEntry(
            position: v['position']!,
            company: v['company']!,
            startDate: v['startDate'],
            endDate: v['endDate'],
            description: v['description'] ?? '',
            responsibilities: (v['responsibilities'] ?? '')
                .split('\n')
                .map((l) => l.trim())
                .where((l) => l.isNotEmpty)
                .toList(),
          ),
          title1: (e) => e.position,
          title2: (e) => [
            e.company,
            _range(e.startDate, e.endDate),
          ].where((s) => s.isNotEmpty).join(' · '),
          onChanged: (list) => _edit(
            context,
            ref,
            (base) async => base.copyWith(workExperience: list),
          ),
          ensureBasics: () => _ensureBasics(context, ref),
        ),
        _EntryListSection<EducationEntry>(
          title: 'Edukacja',
          entries: p?.education ?? const [],
          empty: 'Dodaj szkoły, studia lub kursy.',
          fields: const [
            FieldSpec(
              'institution',
              'Uczelnia / szkoła',
              required: true,
              capitalization: TextCapitalization.words,
            ),
            FieldSpec('degree', 'Stopień'),
            FieldSpec('field', 'Kierunek'),
            FieldSpec.date('startDate', 'Od'),
            FieldSpec.endDate('endDate', 'Do'),
          ],
          toValues: (e) => {
            'institution': e.institution,
            'degree': e.degree,
            'field': e.field,
            'startDate': e.startDate,
            'endDate': _endForEdit(e.startDate, e.endDate),
          },
          fromValues: (v) => EducationEntry(
            institution: v['institution']!,
            degree: v['degree'] ?? '',
            field: v['field'] ?? '',
            startDate: v['startDate'] ?? '',
            endDate: v['endDate'] ?? '',
          ),
          title1: (e) => e.institution,
          title2: (e) => [
            e.degree,
            e.field,
            _range(e.startDate, e.endDate),
          ].where((s) => s.isNotEmpty).join(' · '),
          onChanged: (list) => _edit(
            context,
            ref,
            (base) async => base.copyWith(education: list),
          ),
          ensureBasics: () => _ensureBasics(context, ref),
        ),
        _EntryListSection<CertificateEntry>(
          title: 'Certyfikaty',
          entries: p?.certificates ?? const [],
          empty: 'Dodaj certyfikaty i uprawnienia.',
          fields: const [
            FieldSpec('name', 'Nazwa certyfikatu', required: true),
            FieldSpec('issuer', 'Wystawca'),
            FieldSpec.date('date', 'Data uzyskania'),
          ],
          toValues: (e) => {
            'name': e.name,
            'issuer': e.issuer ?? '',
            'date': e.date ?? '',
          },
          fromValues: (v) => CertificateEntry(
            name: v['name']!,
            issuer: v['issuer'],
            date: v['date'],
          ),
          title1: (e) => e.name,
          title2: (e) => [
            e.issuer ?? '',
            ProfileDates.short(e.date),
          ].where((s) => s.isNotEmpty).join(' · '),
          onChanged: (list) => _edit(
            context,
            ref,
            (base) async => base.copyWith(certificates: list),
          ),
          ensureBasics: () => _ensureBasics(context, ref),
        ),
        _EntryListSection<LanguageEntry>(
          title: 'Języki',
          entries: p?.languages ?? const [],
          empty: 'Dodaj języki, którymi się posługujesz.',
          fields: const [
            FieldSpec(
              'language',
              'Język',
              required: true,
              capitalization: TextCapitalization.words,
            ),
            FieldSpec('level', 'Poziom (np. B2, C1, ojczysty)'),
          ],
          toValues: (e) => {'language': e.language, 'level': e.level ?? ''},
          fromValues: (v) =>
              LanguageEntry(language: v['language']!, level: v['level']),
          title1: (e) => e.language,
          title2: (e) => e.level ?? '',
          onChanged: (list) => _edit(
            context,
            ref,
            (base) async => base.copyWith(languages: list),
          ),
          ensureBasics: () => _ensureBasics(context, ref),
        ),
        _Section(
          title: 'Finanse i preferencje',
          onEdit: () => _edit(context, ref, (base) async {
            final result = await showFinanceSheet(
              context,
              survey: base.financialSurvey ?? const FinancialSurvey(),
              willingToRebrand: base.willingToRebrand,
            );
            return result == null
                ? null
                : base.copyWith(
                    financialSurvey: result.$1,
                    willingToRebrand: result.$2,
                  );
          }),
          child: _financeSummary(p),
        ),
        _Section(
          title: 'Dodatkowe informacje',
          onEdit: () => _edit(context, ref, (base) async {
            final text = await showTextSheet(
              context: context,
              title: 'Dodatkowe informacje',
              hint: 'Hobby, wolontariat, inne ważne informacje',
              initial: base.additionalInformation ?? '',
            );
            return text == null
                ? null
                : base.copyWith(additionalInformation: text);
          }),
          child: _Paragraph(
            p?.additionalInformation,
            empty: 'Hobby, wolontariat, osiągnięcia.',
          ),
        ),
        const SizedBox(height: 4),
        const PrivacySection(),
        const SizedBox(height: 12),
        Center(
          child: TextButton.icon(
            onPressed: () => _confirmSignOut(context, ref),
            icon: const Icon(
              Icons.logout_rounded,
              size: 18,
              color: AppColors.danger,
            ),
            label: Text(
              'Wyloguj się',
              style: AppTypography.button.copyWith(color: AppColors.danger),
            ),
          ),
        ),
      ],
    );
  }

  Widget _financeSummary(UserProfile? p) {
    final survey = p?.financialSurvey;
    if (survey == null) {
      return const _Empty(
        'Podaj oczekiwania finansowe — pomogą dobrać ścieżki kariery.',
      );
    }
    String money(double? v) =>
        v == null || v == 0 ? '—' : '${v.toStringAsFixed(0)} zł';
    return _KeyValues([
      ('Obecnie', money(survey.currentSalary)),
      ('Oczekiwania', money(survey.desiredSalary)),
      ('Skłonność do ryzyka', survey.riskAppetite.label),
      ('Przeprowadzka', survey.willingToRelocate ? 'Tak' : 'Nie'),
      ('Przebranżowienie', p!.willingToRebrand ? 'Tak' : 'Nie'),
    ]);
  }

  static String _range(String? from, String? to) =>
      ProfileDates.range(from, to);

  /// The list shows a started entry without an end as "obecnie", so the
  /// editor's "Obecnie" switch starts on for it too.
  static String _endForEdit(String? start, String? end) =>
      (end ?? '').trim().isEmpty && (start ?? '').trim().isNotEmpty
      ? ProfileDates.present
      : end ?? '';

  Future<void> _confirmSignOut(BuildContext context, WidgetRef ref) async {
    final confirmed = await showGlassSheet<bool>(
      context: context,
      builder: (sheet) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Wylogować się?', style: AppTypography.title),
            const SizedBox(height: 8),
            Text(
              'Twoje dane zostaną na koncie — zalogujesz się w każdej chwili.',
              style: AppTypography.caption.copyWith(
                color: AppColors.textMuted,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            PrimaryButton(
              label: 'Wyloguj się',
              onPressed: () => Navigator.pop(sheet, true),
            ),
            TextButton(
              onPressed: () => Navigator.pop(sheet, false),
              child: Text('Anuluj', style: AppTypography.caption),
            ),
          ],
        ),
      ),
    );
    if (confirmed == true) await ref.read(sessionProvider.notifier).signOut();
  }
}

class _Identity extends StatelessWidget {
  const _Identity({required this.profile, required this.email});

  final UserProfile? profile;
  final String? email;

  @override
  Widget build(BuildContext context) {
    final initials = profile?.initials ?? '';
    final name = profile?.fullName ?? '';
    return Column(
      children: [
        Container(
          width: 92,
          height: 92,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            gradient: AppColors.brandGradient,
            boxShadow: AppColors.buttonGlow,
          ),
          alignment: Alignment.center,
          child: initials.isEmpty
              ? const Icon(
                  Icons.person_outline_rounded,
                  size: 40,
                  color: Colors.white,
                )
              : Text(initials, style: AppTypography.headline),
        ),
        const SizedBox(height: 14),
        Text(name.isEmpty ? 'Twój profil' : name, style: AppTypography.title),
        if (email != null) Text(email!, style: AppTypography.label),
      ],
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({
    required this.title,
    required this.child,
    required this.onEdit,
  });

  final String title;
  final Widget child;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: SurfaceCard(
        onTap: onEdit,
        padding: const EdgeInsets.fromLTRB(20, 16, 14, 18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: Text(title, style: AppTypography.titleSmall)),
                const Icon(
                  Icons.edit_outlined,
                  size: 18,
                  color: AppColors.textSubtle,
                ),
              ],
            ),
            const SizedBox(height: 10),
            child,
          ],
        ),
      ),
    );
  }
}

class _EntryListSection<T> extends StatelessWidget {
  const _EntryListSection({
    required this.title,
    required this.entries,
    required this.empty,
    required this.fields,
    required this.toValues,
    required this.fromValues,
    required this.title1,
    required this.title2,
    required this.onChanged,
    required this.ensureBasics,
  });

  final String title;
  final List<T> entries;
  final String empty;
  final List<FieldSpec> fields;
  final Map<String, String> Function(T) toValues;
  final T Function(Map<String, String>) fromValues;
  final String Function(T) title1;
  final String Function(T) title2;
  final Future<void> Function(List<T>) onChanged;
  final Future<UserProfile?> Function() ensureBasics;

  Future<void> _open(BuildContext context, {int? index}) async {
    if (await ensureBasics() == null || !context.mounted) return;
    final action = await showEntrySheet(
      context: context,
      title: index == null ? 'Dodaj: ${title.toLowerCase()}' : title,
      fields: fields,
      initial: index == null ? const {} : toValues(entries[index]),
      canDelete: index != null,
    );
    if (action == null) return;
    final list = [...entries];
    switch (action) {
      case EntrySaved(:final values):
        index == null
            ? list.add(fromValues(values))
            : list[index] = fromValues(values);
      case EntryDeleted():
        list.removeAt(index!);
    }
    await onChanged(list);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: SurfaceCard(
        padding: const EdgeInsets.fromLTRB(20, 16, 10, 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: Text(title, style: AppTypography.titleSmall)),
                IconButton(
                  tooltip: 'Dodaj',
                  onPressed: () => _open(context),
                  icon: const Icon(
                    Icons.add_circle_outline_rounded,
                    color: AppColors.accent,
                  ),
                ),
              ],
            ),
            if (entries.isEmpty)
              Padding(
                padding: const EdgeInsets.only(right: 10, bottom: 8),
                child: _Empty(empty),
              ),
            for (var i = 0; i < entries.length; i++)
              Pressable(
                onTap: () => _open(context, index: i),
                scale: 0.985,
                child: Container(
                  width: double.infinity,
                  margin: const EdgeInsets.only(right: 10, bottom: 8),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceRaised,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title1(entries[i]),
                        style: AppTypography.button.copyWith(height: 1.4),
                      ),
                      if (title2(entries[i]).isNotEmpty)
                        Text(title2(entries[i]), style: AppTypography.label),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _KeyValues extends StatelessWidget {
  const _KeyValues(this.rows);

  final List<(String, String)> rows;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (final (key, value) in rows)
          Padding(
            padding: const EdgeInsets.only(bottom: 6, right: 6),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 130,
                  child: Text(key, style: AppTypography.label),
                ),
                Expanded(
                  child: Text(
                    value,
                    style: AppTypography.caption.copyWith(height: 1.4),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _Chips extends StatelessWidget {
  const _Chips(this.items, {required this.empty});

  final List<String> items;
  final String empty;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return _Empty(empty);
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: [
        for (final item in items)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
            decoration: BoxDecoration(
              color: AppColors.surfaceRaised,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: AppColors.hairline),
            ),
            child: Text(
              item,
              style: AppTypography.label.copyWith(color: AppColors.textPrimary),
            ),
          ),
      ],
    );
  }
}

class _Paragraph extends StatelessWidget {
  const _Paragraph(this.text, {required this.empty});

  final String? text;
  final String empty;

  @override
  Widget build(BuildContext context) {
    if (text == null || text!.trim().isEmpty) return _Empty(empty);
    return Text(
      text!,
      style: AppTypography.caption.copyWith(
        height: 1.6,
        color: AppColors.textMuted,
      ),
      maxLines: 6,
      overflow: TextOverflow.ellipsis,
    );
  }
}

class _Empty extends StatelessWidget {
  const _Empty(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(text, style: AppTypography.label.copyWith(height: 1.5));
  }
}
