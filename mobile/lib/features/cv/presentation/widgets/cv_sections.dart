import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/form_sheets.dart';
import '../../../../core/widgets/native_controls.dart';
import '../../../../core/widgets/pressable.dart';
import '../../../profile/data/profile_dates.dart';
import '../../data/cv_document.dart';
import '../../data/cv_models.dart';
import '../../data/cv_repository.dart';

/// Editor sections in document order (web `DEFAULT_SECTION_ORDER`).
enum CvEditorSection {
  basics('Dane osobowe', Icons.badge_outlined),
  summary('Profil osobisty', Icons.notes_rounded),
  experience('Doświadczenie zawodowe', Icons.work_outline_rounded),
  projects('Projekty', Icons.folder_open_rounded),
  education('Edukacja', Icons.school_outlined),
  certificates('Certyfikaty', Icons.workspace_premium_outlined),
  skills('Umiejętności', Icons.bolt_rounded),
  languages('Języki', Icons.translate_rounded),
  hobbies('Zainteresowania', Icons.interests_outlined),
  links('Linki i portfolio', Icons.link_rounded),
  privacy('Klauzula RODO', Icons.verified_user_outlined);

  const CvEditorSection(this.label, this.icon);
  final String label;
  final IconData icon;

  /// Where an audit section's "Popraw sekcję" leads.
  static CvEditorSection forAudit(CvSection section) => switch (section) {
    CvSection.basics => basics,
    CvSection.work => experience,
    CvSection.education => education,
    CvSection.certificates => certificates,
    CvSection.skills => skills,
    CvSection.languages => languages,
    CvSection.projects => projects,
    CvSection.social => links,
  };
}

/// All section cards of the editor's "Edycja" mode.
class CvSectionsList extends ConsumerWidget {
  const CvSectionsList({
    super.key,
    required this.cvId,
    required this.sectionKeys,
    this.highlighted,
  });

  final String cvId;
  final Map<CvEditorSection, GlobalKey> sectionKeys;
  final CvEditorSection? highlighted;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cv = ref.watch(cvEditorProvider(cvId).select((s) => s.value?.cv));
    final options = ref.watch(cvOptionsProvider(cvId));
    if (cv == null) return const SizedBox.shrink();
    final data = cv.data;
    final editor = ref.read(cvEditorProvider(cvId).notifier);

    Widget card(
      CvEditorSection section, {
      required bool filled,
      required Widget child,
      VoidCallback? onEdit,
      VoidCallback? onAdd,
    }) => Padding(
      key: sectionKeys[section],
      padding: const EdgeInsets.only(bottom: 12),
      child: _SectionCard(
        section: section,
        filled: filled,
        highlighted: highlighted == section,
        onEdit: onEdit,
        onAdd: onAdd,
        child: child,
      ),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        card(
          CvEditorSection.basics,
          filled:
              data.basics.fullName.isNotEmpty && data.basics.email.isNotEmpty,
          onEdit: () => editBasics(context, editor),
          child: _BasicsPreview(cv: cv),
        ),
        card(
          CvEditorSection.summary,
          filled: data.basics.summary.isNotEmpty,
          onEdit: () => _editSummary(context, editor),
          child: _Paragraph(
            data.basics.summary,
            empty:
                '2–4 zdania: kim jesteś zawodowo, w czym jesteś mocny i czego szukasz.',
          ),
        ),
        card(
          CvEditorSection.experience,
          filled: data.work.isNotEmpty,
          onAdd: () => _editWork(context, editor, null),
          child: _Entries(
            empty: 'Dodaj stanowiska, staże i praktyki - najnowsze na górze.',
            items: [
              for (final w in data.work)
                (
                  w.position.isEmpty ? 'Stanowisko' : w.position,
                  [
                    w.company,
                    ProfileDates.range(w.startDate, w.endDate),
                  ].where((s) => s.isNotEmpty).join(' · '),
                ),
            ],
            onTap: (i) => _editWork(context, editor, i),
            onReorder: (from, to) => editor.editData(
              (d) => d.copyWith(work: _move(d.work, from, to)),
            ),
          ),
        ),
        card(
          CvEditorSection.projects,
          filled: data.projects.isNotEmpty,
          onAdd: () => _editProject(context, editor, null),
          child: _Entries(
            empty:
                'Projekty z GitHuba, studiów lub pracy - z linkiem, jeśli to możliwe.',
            items: [
              for (final p in data.projects)
                (p.name.isEmpty ? 'Projekt' : p.name, p.link),
            ],
            onTap: (i) => _editProject(context, editor, i),
            onReorder: (from, to) => editor.editData(
              (d) => d.copyWith(projects: _move(d.projects, from, to)),
            ),
          ),
        ),
        card(
          CvEditorSection.education,
          filled: data.education.isNotEmpty,
          onAdd: () => _editEducation(context, editor, null),
          child: _Entries(
            empty: 'Dodaj uczelnię lub szkołę.',
            items: [
              for (final e in data.education)
                (
                  e.institution.isEmpty ? 'Uczelnia' : e.institution,
                  [
                    e.field,
                    if (e.degree.isNotEmpty) degreeLabel(e.degree),
                    ProfileDates.range(e.startDate, e.endDate),
                  ].where((s) => s.isNotEmpty).join(' · '),
                ),
            ],
            onTap: (i) => _editEducation(context, editor, i),
            onReorder: (from, to) => editor.editData(
              (d) => d.copyWith(education: _move(d.education, from, to)),
            ),
          ),
        ),
        card(
          CvEditorSection.certificates,
          filled: data.certificates.isNotEmpty,
          onAdd: () => _editCertificate(context, editor, null),
          child: _Entries(
            empty: 'Kursy i certyfikaty potwierdzające umiejętności.',
            items: [
              for (final c in data.certificates)
                (
                  c.name.isEmpty ? 'Certyfikat' : c.name,
                  c.date.isEmpty ? '' : ProfileDates.short(c.date),
                ),
            ],
            onTap: (i) => _editCertificate(context, editor, i),
            onReorder: (from, to) => editor.editData(
              (d) => d.copyWith(certificates: _move(d.certificates, from, to)),
            ),
          ),
        ),
        card(
          CvEditorSection.skills,
          filled: data.skills.isNotEmpty,
          onEdit: () => _editTags(context, editor, CvEditorSection.skills),
          child: _Chips(
            data.skills,
            empty: 'Technologie, narzędzia i kompetencje.',
          ),
        ),
        card(
          CvEditorSection.languages,
          filled: data.languages.isNotEmpty,
          onAdd: () => _editLanguage(context, editor, null),
          child: _Entries(
            empty: 'Języki obce z poziomem znajomości.',
            items: [
              for (final l in data.languages)
                (
                  l.language.isEmpty ? 'Język' : l.language,
                  Fluency.normalize(l.fluency).labelPl,
                ),
            ],
            onTap: (i) => _editLanguage(context, editor, i),
            onReorder: (from, to) => editor.editData(
              (d) => d.copyWith(languages: _move(d.languages, from, to)),
            ),
          ),
        ),
        card(
          CvEditorSection.hobbies,
          filled: data.hobbies.isNotEmpty,
          onEdit: () => _editTags(context, editor, CvEditorSection.hobbies),
          child: _Chips(
            data.hobbies,
            empty: 'Kilka zainteresowań, które coś o Tobie mówią.',
          ),
        ),
        card(
          CvEditorSection.links,
          filled: data.links.isNotEmpty,
          onAdd: () => _editLink(context, editor, null),
          child: _Entries(
            empty: 'LinkedIn, GitHub, portfolio - pojawią się w nagłówku CV.',
            items: [
              for (final l in data.links)
                (l.label.isEmpty ? 'Link' : l.label, l.url),
            ],
            onTap: (i) => _editLink(context, editor, i),
            onReorder: (from, to) => editor.editData(
              (d) => d.copyWith(links: _move(d.links, from, to)),
            ),
          ),
        ),
        card(
          CvEditorSection.privacy,
          filled: options.privacyClause,
          child: Row(
            children: [
              Expanded(
                child: Text(
                  'Zgoda na przetwarzanie danych w rekrutacji (RODO) na końcu CV. Wielu pracodawców w Polsce jej oczekuje.',
                  style: AppTypography.label.copyWith(height: 1.5),
                ),
              ),
              const SizedBox(width: 12),
              LiquidGlassSwitch(
                value: options.privacyClause,
                semanticLabel: 'Klauzula RODO',
                onChanged: (v) => ref
                    .read(cvOptionsProvider(cvId).notifier)
                    .update((o) => o.copyWith(privacyClause: v)),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ── Editors ─────────────────────────────────────────────────────────────

List<T> _move<T>(List<T> list, int from, int to) {
  final copy = [...list];
  final item = copy.removeAt(from);
  // `onReorderItem` already adjusts the target for the removed item.
  copy.insert(to, item);
  return copy;
}

List<T> _apply<T>(
  List<T> list,
  int? index,
  EntryAction action,
  T Function(Map<String, String>) build,
) {
  final copy = [...list];
  switch (action) {
    case EntrySaved(:final values):
      index == null ? copy.add(build(values)) : copy[index] = build(values);
    case EntryDeleted():
      if (index != null) copy.removeAt(index);
  }
  return copy;
}

/// Started entries without an end show as "obecnie", so "Obecnie" starts on.
String _endForEdit(String start, String end) =>
    end.trim().isEmpty && start.trim().isNotEmpty ? ProfileDates.present : end;

Future<void> editBasics(BuildContext context, CvEditorController editor) async {
  final cv = editor.current;
  if (cv == null) return;
  final b = cv.data.basics;
  final action = await showEntrySheet(
    context: context,
    title: 'Dane osobowe',
    fields: const [
      FieldSpec('firstName', 'Imię', capitalization: TextCapitalization.words),
      FieldSpec(
        'lastName',
        'Nazwisko',
        capitalization: TextCapitalization.words,
      ),
      FieldSpec(
        'position',
        'Stanowisko docelowe (pod imieniem i nazwiskiem)',
        maxLength: 100,
      ),
      FieldSpec(
        'email',
        'E-mail',
        keyboard: TextInputType.emailAddress,
        capitalization: TextCapitalization.none,
      ),
      FieldSpec(
        'phone',
        'Telefon',
        keyboard: TextInputType.phone,
        capitalization: TextCapitalization.none,
      ),
      FieldSpec('city', 'Miasto', capitalization: TextCapitalization.words),
      FieldSpec('country', 'Kraj', capitalization: TextCapitalization.words),
    ],
    initial: {
      'firstName': b.firstName,
      'lastName': b.lastName,
      'position': cv.targetPosition,
      'email': b.email,
      'phone': b.phone,
      'city': b.city,
      'country': b.country,
    },
  );
  if (action is! EntrySaved) return;
  final v = action.values;
  editor.edit(
    (cv) => cv.copyWith(
      targetPosition: v['position'],
      data: cv.data.copyWith(
        basics: cv.data.basics.copyWith(
          firstName: v['firstName'],
          lastName: v['lastName'],
          email: v['email'],
          phone: v['phone'],
          city: v['city'],
          country: v['country'],
        ),
      ),
    ),
  );
}

Future<void> _editSummary(
  BuildContext context,
  CvEditorController editor,
) async {
  final cv = editor.current;
  if (cv == null) return;
  final text = await showTextSheet(
    context: context,
    title: 'Profil osobisty',
    hint: 'Kim jesteś zawodowo, w czym jesteś mocny i czego szukasz',
    initial: cv.data.basics.summary,
  );
  if (text == null) return;
  editor.editData((d) => d.copyWith(basics: d.basics.copyWith(summary: text)));
}

Future<void> _editWork(
  BuildContext context,
  CvEditorController editor,
  int? index,
) async {
  final items = editor.current?.data.work ?? const <CvWork>[];
  final w = index == null ? null : items[index];
  final action = await showEntrySheet(
    context: context,
    title: index == null ? 'Nowe doświadczenie' : 'Doświadczenie',
    canDelete: index != null,
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
      FieldSpec(
        'responsibilities',
        'Obowiązki i osiągnięcia - jeden punkt w linii',
        lines: 6,
      ),
    ],
    initial: w == null
        ? const {}
        : {
            'position': w.position,
            'company': w.company,
            'startDate': w.startDate,
            'endDate': _endForEdit(w.startDate, w.endDate),
            'responsibilities': w.responsibilities.join('\n'),
          },
  );
  if (action == null) return;
  editor.editData(
    (d) => d.copyWith(
      work: _apply(
        d.work,
        index,
        action,
        (v) => CvWork(
          position: v['position']!,
          company: v['company']!,
          startDate: v['startDate'] ?? '',
          endDate: v['endDate'] ?? '',
          responsibilities: (v['responsibilities'] ?? '')
              .split('\n')
              .map((l) => l.replaceFirst(RegExp(r'^[-•–]\s*'), '').trim())
              .where((l) => l.isNotEmpty)
              .toList(),
          description: w?.description,
        ),
      ),
    ),
  );
}

Future<void> _editEducation(
  BuildContext context,
  CvEditorController editor,
  int? index,
) async {
  final items = editor.current?.data.education ?? const <CvEducation>[];
  final e = index == null ? null : items[index];
  final action = await showEntrySheet(
    context: context,
    title: index == null ? 'Nowa edukacja' : 'Edukacja',
    canDelete: index != null,
    fields: [
      const FieldSpec(
        'institution',
        'Uczelnia / szkoła',
        required: true,
        capitalization: TextCapitalization.words,
      ),
      const FieldSpec('field', 'Kierunek'),
      FieldSpec.choice('degree', 'Stopień', [
        for (final (value, pl, _) in cvDegreeOptions) (value, pl),
      ]),
      const FieldSpec.date('startDate', 'Od'),
      const FieldSpec.endDate('endDate', 'Do'),
      const FieldSpec('description', 'Opis (opcjonalnie)', lines: 3),
    ],
    initial: e == null
        ? const {}
        : {
            'institution': e.institution,
            'field': e.field,
            'degree': e.degree,
            'startDate': e.startDate,
            'endDate': _endForEdit(e.startDate, e.endDate),
            'description': e.description,
          },
  );
  if (action == null) return;
  editor.editData(
    (d) => d.copyWith(
      education: _apply(
        d.education,
        index,
        action,
        (v) => CvEducation(
          institution: v['institution']!,
          field: v['field'] ?? '',
          degree: v['degree'] ?? '',
          startDate: v['startDate'] ?? '',
          endDate: v['endDate'] ?? '',
          description: v['description'] ?? '',
        ),
      ),
    ),
  );
}

Future<void> _editProject(
  BuildContext context,
  CvEditorController editor,
  int? index,
) async {
  final items = editor.current?.data.projects ?? const <CvProject>[];
  final p = index == null ? null : items[index];
  final action = await showEntrySheet(
    context: context,
    title: index == null ? 'Nowy projekt' : 'Projekt',
    canDelete: index != null,
    fields: const [
      FieldSpec('name', 'Nazwa projektu', required: true),
      FieldSpec(
        'link',
        'Link (opcjonalnie)',
        keyboard: TextInputType.url,
        capitalization: TextCapitalization.none,
      ),
      FieldSpec('description', 'Opis - co zrobiłeś i jakim efektem', lines: 4),
    ],
    initial: p == null
        ? const {}
        : {'name': p.name, 'link': p.link, 'description': p.description},
  );
  if (action == null) return;
  editor.editData(
    (d) => d.copyWith(
      projects: _apply(
        d.projects,
        index,
        action,
        (v) => CvProject(
          name: v['name']!,
          link: v['link'] ?? '',
          description: v['description'] ?? '',
        ),
      ),
    ),
  );
}

Future<void> _editCertificate(
  BuildContext context,
  CvEditorController editor,
  int? index,
) async {
  final items = editor.current?.data.certificates ?? const <CvCertificate>[];
  final c = index == null ? null : items[index];
  final action = await showEntrySheet(
    context: context,
    title: index == null ? 'Nowy certyfikat' : 'Certyfikat',
    canDelete: index != null,
    fields: const [
      FieldSpec('name', 'Nazwa certyfikatu', required: true),
      FieldSpec.date('date', 'Data uzyskania'),
    ],
    initial: c == null ? const {} : {'name': c.name, 'date': c.date},
  );
  if (action == null) return;
  editor.editData(
    (d) => d.copyWith(
      certificates: _apply(
        d.certificates,
        index,
        action,
        (v) => CvCertificate(name: v['name']!, date: v['date'] ?? ''),
      ),
    ),
  );
}

Future<void> _editLanguage(
  BuildContext context,
  CvEditorController editor,
  int? index,
) async {
  final items = editor.current?.data.languages ?? const <CvLanguage>[];
  final l = index == null ? null : items[index];
  final action = await showEntrySheet(
    context: context,
    title: index == null ? 'Nowy język' : 'Język',
    canDelete: index != null,
    fields: [
      const FieldSpec(
        'language',
        'Język',
        required: true,
        capitalization: TextCapitalization.words,
      ),
      FieldSpec.choice('fluency', 'Poziom', [
        for (final f in Fluency.values) (f.value, f.labelPl),
      ]),
    ],
    initial: {
      'language': l?.language ?? '',
      'fluency': l == null
          ? Fluency.conversational.value
          : Fluency.normalize(l.fluency).value,
    },
  );
  if (action == null) return;
  editor.editData(
    (d) => d.copyWith(
      languages: _apply(
        d.languages,
        index,
        action,
        (v) => CvLanguage(
          language: v['language']!,
          fluency: v['fluency'] ?? Fluency.beginner.value,
        ),
      ),
    ),
  );
}

Future<void> _editLink(
  BuildContext context,
  CvEditorController editor,
  int? index,
) async {
  final items = editor.current?.data.links ?? const <CvLink>[];
  final l = index == null ? null : items[index];
  final action = await showEntrySheet(
    context: context,
    title: index == null ? 'Nowy link' : 'Link',
    canDelete: index != null,
    fields: const [
      FieldSpec(
        'label',
        'Nazwa (np. LinkedIn, GitHub)',
        required: true,
        capitalization: TextCapitalization.words,
      ),
      FieldSpec(
        'url',
        'Adres (np. linkedin.com/in/jan)',
        required: true,
        keyboard: TextInputType.url,
        capitalization: TextCapitalization.none,
      ),
    ],
    initial: l == null ? const {} : {'label': l.label, 'url': l.url},
  );
  if (action == null) return;
  editor.editData(
    (d) => d.copyWith(
      links: _apply(
        d.links,
        index,
        action,
        (v) => CvLink(label: v['label']!, url: v['url']!),
      ),
    ),
  );
}

Future<void> _editTags(
  BuildContext context,
  CvEditorController editor,
  CvEditorSection section,
) async {
  final data = editor.current?.data;
  if (data == null) return;
  final skills = section == CvEditorSection.skills;
  final tags = await showTagsSheet(
    context: context,
    title: section.label,
    hint: skills ? 'np. SQL, Figma, komunikacja' : 'np. bieganie, fotografia',
    initial: skills ? data.skills : data.hobbies,
  );
  if (tags == null) return;
  editor.editData(
    (d) => skills ? d.copyWith(skills: tags) : d.copyWith(hobbies: tags),
  );
}

// ── Building blocks ─────────────────────────────────────────────────────

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.section,
    required this.filled,
    required this.highlighted,
    required this.child,
    this.onEdit,
    this.onAdd,
  });

  final CvEditorSection section;
  final bool filled;
  final bool highlighted;
  final Widget child;
  final VoidCallback? onEdit;
  final VoidCallback? onAdd;

  @override
  Widget build(BuildContext context) {
    final content = AnimatedContainer(
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOutCubic,
      padding: const EdgeInsets.fromLTRB(18, 14, 8, 16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
        border: Border.all(
          color: highlighted ? AppColors.gradientSoft : AppColors.hairline,
          width: highlighted ? 1.6 : 1,
        ),
        boxShadow: highlighted
            ? const [BoxShadow(color: Color(0x55915EFF), blurRadius: 24)]
            : const [],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: filled
                      ? AppColors.gradientSoft.withValues(alpha: 0.16)
                      : AppColors.surfaceRaised,
                ),
                child: Icon(
                  section.icon,
                  size: 17,
                  color: filled ? AppColors.accent : AppColors.textSubtle,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  section.label,
                  style: AppTypography.titleSmall.copyWith(fontSize: 16),
                ),
              ),
              if (filled && section != CvEditorSection.privacy)
                const Padding(
                  padding: EdgeInsets.only(right: 4),
                  child: Icon(
                    Icons.check_circle_rounded,
                    size: 18,
                    color: AppColors.success,
                  ),
                ),
              if (onAdd != null)
                IconButton(
                  tooltip: 'Dodaj',
                  onPressed: onAdd,
                  icon: const Icon(
                    Icons.add_circle_outline_rounded,
                    color: AppColors.accent,
                  ),
                )
              else if (onEdit != null)
                IconButton(
                  tooltip: 'Edytuj',
                  onPressed: onEdit,
                  icon: const Icon(
                    Icons.edit_outlined,
                    size: 20,
                    color: AppColors.textSubtle,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Padding(padding: const EdgeInsets.only(right: 10), child: child),
        ],
      ),
    );
    return onEdit == null
        ? content
        : Pressable(
            onTap: onEdit,
            scale: 0.99,
            semanticLabel: section.label,
            child: content,
          );
  }
}

class _BasicsPreview extends StatelessWidget {
  const _BasicsPreview({required this.cv});

  final CvDetails cv;

  @override
  Widget build(BuildContext context) {
    final b = cv.data.basics;
    if (b.isEmpty && cv.targetPosition.isEmpty) {
      return Text(
        'Imię i nazwisko, stanowisko oraz dane kontaktowe.',
        style: AppTypography.label.copyWith(height: 1.5),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (b.fullName.isNotEmpty)
          Text(b.fullName, style: AppTypography.button.copyWith(height: 1.35)),
        if (cv.targetPosition.isNotEmpty)
          Text(
            cv.targetPosition,
            style: AppTypography.caption.copyWith(
              color: AppColors.accent,
              height: 1.4,
            ),
          ),
        const SizedBox(height: 4),
        Text(
          [b.email, b.phone, b.location].where((s) => s.isNotEmpty).join(' · '),
          style: AppTypography.label.copyWith(height: 1.45),
        ),
      ],
    );
  }
}

class _Paragraph extends StatelessWidget {
  const _Paragraph(this.text, {required this.empty});

  final String text;
  final String empty;

  @override
  Widget build(BuildContext context) {
    if (text.trim().isEmpty) {
      return Text(empty, style: AppTypography.label.copyWith(height: 1.5));
    }
    return Text(
      text.replaceAll(RegExp(r'\*\*|__'), ''),
      style: AppTypography.caption.copyWith(
        color: AppColors.textMuted,
        height: 1.55,
      ),
      maxLines: 4,
      overflow: TextOverflow.ellipsis,
    );
  }
}

class _Chips extends StatelessWidget {
  const _Chips(this.items, {required this.empty});

  final List<String> items;
  final String empty;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return Text(empty, style: AppTypography.label.copyWith(height: 1.5));
    }
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: [
        for (final item in items)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.surfaceRaised,
              borderRadius: BorderRadius.circular(999),
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

/// Tappable, drag-to-reorder rows of a list section.
class _Entries extends StatelessWidget {
  const _Entries({
    required this.items,
    required this.empty,
    required this.onTap,
    required this.onReorder,
  });

  final List<(String title, String subtitle)> items;
  final String empty;
  final ValueChanged<int> onTap;
  final void Function(int from, int to) onReorder;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return Text(empty, style: AppTypography.label.copyWith(height: 1.5));
    }
    return ReorderableListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      buildDefaultDragHandles: false,
      padding: EdgeInsets.zero,
      itemCount: items.length,
      onReorderStart: (_) => HapticFeedback.mediumImpact(),
      onReorderItem: onReorder,
      proxyDecorator: (child, _, _) =>
          Material(color: Colors.transparent, child: child),
      itemBuilder: (context, i) {
        final (title, subtitle) = items[i];
        return Padding(
          key: ValueKey('$i·$title·$subtitle'),
          padding: const EdgeInsets.only(bottom: 8),
          child: Pressable(
            onTap: () => onTap(i),
            scale: 0.985,
            semanticLabel: title,
            child: Container(
              padding: const EdgeInsets.fromLTRB(14, 10, 4, 10),
              decoration: BoxDecoration(
                color: AppColors.surfaceRaised,
                borderRadius: BorderRadius.circular(18),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: AppTypography.button.copyWith(height: 1.35),
                        ),
                        if (subtitle.isNotEmpty)
                          Text(
                            subtitle,
                            style: AppTypography.label.copyWith(height: 1.4),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),
                  if (items.length > 1)
                    ReorderableDragStartListener(
                      index: i,
                      child: const Padding(
                        padding: EdgeInsets.all(10),
                        child: Icon(
                          Icons.drag_indicator_rounded,
                          color: AppColors.textSubtle,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
