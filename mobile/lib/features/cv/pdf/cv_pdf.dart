import 'dart:typed_data';

import 'package:flutter/painting.dart' show Color;
import 'package:flutter/services.dart' show rootBundle;
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

import '../../profile/data/profile_dates.dart';
import '../data/cv_document.dart';
import '../data/cv_models.dart';

/// Renders a CV to an A4 PDF. The same bytes back the live preview and the
/// exported file, so what the user sees is exactly what they send.
///
/// Layout follows the web preview (`ResumeComponent` → `renderSectionInPreview`):
/// one column (ATS-friendly real text), section order profile → experience →
/// projects → education → certificates → skills → languages → hobbies.
Future<Uint8List> buildCvPdf(CvDetails cv, CvDocumentOptions options) async {
  final fonts = await _Fonts.load();
  final regular = await _render(cv, options, fonts, compact: false);
  if (regular.pages < 2) return regular.bytes;
  // A few lines or the GDPR clause alone on an extra page look broken; a
  // slightly tighter rhythm often keeps the document a page shorter.
  final compact = await _render(cv, options, fonts, compact: true);
  return compact.pages < regular.pages ? compact.bytes : regular.bytes;
}

Future<({Uint8List bytes, int pages})> _render(
  CvDetails cv,
  CvDocumentOptions options,
  _Fonts fonts, {
  required bool compact,
}) async {
  final doc = pw.Document(
    title: cv.name,
    author: cv.data.basics.fullName,
    creator: 'Vocare',
    producer: 'Vocare',
  );
  final builder = _CvBuilder(cv, options, fonts, compact: compact);

  doc.addPage(
    pw.MultiPage(
      pageTheme: pw.PageTheme(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(15 * PdfPageFormat.mm),
        theme: pw.ThemeData.withFont(
          base: fonts.regular,
          bold: fonts.semiBold,
          italic: fonts.regular,
          boldItalic: fonts.semiBold,
        ),
      ),
      maxPages: 40,
      // The height is reserved on every page: the page count is only known
      // after layout, and the number must never overlap the last line.
      footer: (context) => pw.Container(
        height: 12,
        alignment: pw.Alignment.bottomRight,
        child: context.pagesCount < 2
            ? null
            : pw.Text(
                '${context.pageNumber}/${context.pagesCount}',
                style: pw.TextStyle(fontSize: 7.5, color: _gray400),
              ),
      ),
      build: (_) => builder.build(),
    ),
  );
  final bytes = await doc.save();
  return (bytes: bytes, pages: doc.document.pdfPageList.pages.length);
}

const _gray900 = PdfColor.fromInt(0xFF111827);
const _gray700 = PdfColor.fromInt(0xFF374151);
const _gray600 = PdfColor.fromInt(0xFF4B5563);
const _gray500 = PdfColor.fromInt(0xFF6B7280);
const _gray400 = PdfColor.fromInt(0xFF9CA3AF);
const _gray300 = PdfColor.fromInt(0xFFD1D5DB);

PdfColor _pdf(Color color) => PdfColor.fromInt(color.toARGB32());

/// `Imie_Nazwisko_CV.pdf` like the web export, folded to ASCII so the name
/// survives mail clients and file systems.
String cvPdfFileName(CvDetails cv) {
  const folded = {
    'ą': 'a',
    'ć': 'c',
    'ę': 'e',
    'ł': 'l',
    'ń': 'n',
    'ó': 'o',
    'ś': 's',
    'ź': 'z',
    'ż': 'z',
    'Ą': 'A',
    'Ć': 'C',
    'Ę': 'E',
    'Ł': 'L',
    'Ń': 'N',
    'Ó': 'O',
    'Ś': 'S',
    'Ź': 'Z',
    'Ż': 'Z',
  };
  String clean(String s) => s
      .split('')
      .map((c) => folded[c] ?? c)
      .join()
      .trim()
      .replaceAll(RegExp(r'\s+'), '_')
      .replaceAll(RegExp(r'[^A-Za-z0-9_-]'), '');
  final b = cv.data.basics;
  final parts = [clean(b.firstName), clean(b.lastName)]
    ..removeWhere((s) => s.isEmpty);
  return parts.isEmpty ? 'Moje_CV.pdf' : '${parts.join('_')}_CV.pdf';
}

class _Fonts {
  const _Fonts(this.light, this.regular, this.medium, this.semiBold);

  final pw.Font light;
  final pw.Font regular;
  final pw.Font medium;
  final pw.Font semiBold;

  static _Fonts? _cache;

  /// Poppins from the app bundle — covers Polish diacritics.
  static Future<_Fonts> load() async {
    if (_cache != null) return _cache!;
    Future<pw.Font> font(String file) async =>
        pw.Font.ttf(await rootBundle.load('assets/fonts/Poppins-$file.ttf'));
    final (light, regular, medium, semiBold) = await (
      font('Light'),
      font('Regular'),
      font('Medium'),
      font('SemiBold'),
    ).wait;
    return _cache = _Fonts(light, regular, medium, semiBold);
  }
}

class _CvBuilder {
  _CvBuilder(this.cv, this.options, this.fonts, {this.compact = false})
    : labels = CvLabels.of(options.locale);

  final CvDetails cv;
  final CvDocumentOptions options;
  final _Fonts fonts;
  final CvLabels labels;

  /// Tighter vertical rhythm, used only when it saves a page.
  final bool compact;

  double _v(double gap) => compact ? gap * 0.6 : gap;

  CvData get data => cv.data;
  CvAccent get accent => options.accent;
  bool get english => options.locale == CvLocale.en;

  late final pw.TextStyle _body = pw.TextStyle(
    font: fonts.regular,
    fontSize: 9.5,
    color: _gray700,
    lineSpacing: compact ? 1.6 : 2.2,
  );

  List<pw.Widget> build() {
    if (data.isEmpty && cv.targetPosition.isEmpty) return [_emptyHint()];
    return [
      ..._header(),
      ..._profile(),
      ..._experience(),
      ..._projects(),
      ..._education(),
      ..._certificates(),
      ..._chips(labels.skills, data.skills, accent.skillBg, accent.skillFg),
      ..._chips(
        labels.languages,
        [
          for (final l in data.languages)
            if (l.language.isNotEmpty) '${l.language} – ${_fluency(l.fluency)}',
        ],
        accent.languageBg,
        accent.languageFg,
      ),
      ..._chips(labels.hobbies, data.hobbies, accent.hobbyBg, accent.hobbyFg),
      ..._privacy(),
    ];
  }

  // ── Header ────────────────────────────────────────────────────────────

  List<pw.Widget> _header() {
    final basics = data.basics;
    final contacts = <pw.Widget>[
      if (basics.email.isNotEmpty) _contact(_Icons.mail, basics.email),
      if (basics.phone.isNotEmpty) _contact(_Icons.phone, basics.phone),
      if (basics.location.isNotEmpty) _contact(_Icons.pin, basics.location),
      for (final link in data.links)
        if (link.url.isNotEmpty)
          pw.UrlLink(
            destination: _normalizeUrl(link.url),
            child: _contact(
              _Icons.link,
              link.label.isNotEmpty ? link.label : link.url,
              underline: true,
            ),
          ),
    ];
    return [
      if (basics.fullName.isNotEmpty)
        pw.Text(
          basics.fullName,
          style: pw.TextStyle(
            font: fonts.semiBold,
            fontSize: 22,
            color: _gray900,
          ),
        ),
      if (cv.targetPosition.isNotEmpty)
        pw.Padding(
          padding: const pw.EdgeInsets.only(top: 2),
          child: pw.Text(
            cv.targetPosition,
            style: pw.TextStyle(
              font: fonts.regular,
              fontSize: 13,
              color: _gray600,
            ),
          ),
        ),
      if (contacts.isNotEmpty)
        pw.Padding(
          padding: const pw.EdgeInsets.only(top: 8),
          child: pw.Wrap(spacing: 14, runSpacing: 4, children: contacts),
        ),
      pw.SizedBox(height: _v(16)),
    ];
  }

  pw.Widget _contact(String svg, String text, {bool underline = false}) =>
      pw.Row(
        mainAxisSize: pw.MainAxisSize.min,
        children: [
          pw.SvgImage(svg: svg, width: 9, height: 9),
          pw.SizedBox(width: 4),
          pw.Text(
            text,
            style: pw.TextStyle(
              font: underline ? fonts.medium : fonts.regular,
              fontSize: 9,
              color: underline ? _gray700 : _gray600,
              decoration: underline ? pw.TextDecoration.underline : null,
            ),
          ),
        ],
      );

  // ── Sections ──────────────────────────────────────────────────────────

  pw.Widget _title(String text) => pw.Container(
    margin: pw.EdgeInsets.only(top: _v(6), bottom: _v(7)),
    padding: const pw.EdgeInsets.only(bottom: 3),
    decoration: const pw.BoxDecoration(
      border: pw.Border(bottom: pw.BorderSide(color: _gray300, width: 0.7)),
    ),
    child: pw.Text(
      text,
      style: pw.TextStyle(
        font: fonts.semiBold,
        fontSize: 12,
        color: _pdf(accent.title),
      ),
    ),
  );

  List<pw.Widget> _profile() {
    final paragraphs = data.basics.summary
        .split(RegExp(r'\r?\n\s*\r?\n+'))
        .map((p) => p.trim())
        .where((p) => p.isNotEmpty)
        .toList();
    if (paragraphs.isEmpty) return const [];
    return [
      _title(labels.profile),
      for (final p in paragraphs)
        pw.Padding(
          padding: const pw.EdgeInsets.only(bottom: 5),
          child: pw.RichText(
            text: pw.TextSpan(style: _body, children: _rich(p)),
          ),
        ),
      pw.SizedBox(height: _v(6)),
    ];
  }

  List<pw.Widget> _experience() {
    if (data.work.isEmpty) return const [];
    return [
      _title(labels.experience),
      for (final w in data.work) ...[
        _entryHeader(
          title: w.position.isNotEmpty
              ? w.position
              : (english ? 'Position' : 'Stanowisko'),
          subtitle: w.company,
          dates: _range(w.startDate, w.endDate),
        ),
        for (final item in w.responsibilities) _bullet(item),
        pw.SizedBox(height: _v(8)),
      ],
    ];
  }

  List<pw.Widget> _projects() {
    final projects = data.projects.where(
      (p) => p.name.isNotEmpty || p.description.isNotEmpty,
    );
    if (projects.isEmpty) return const [];
    return [
      _title(labels.projects),
      for (final p in projects) ...[
        if (p.link.isNotEmpty)
          pw.UrlLink(
            destination: _normalizeUrl(p.link),
            child: pw.Text(
              p.name.isNotEmpty ? p.name : p.link,
              style: pw.TextStyle(
                font: fonts.semiBold,
                fontSize: 10.5,
                color: _pdf(accent.link),
                decoration: pw.TextDecoration.underline,
              ),
            ),
          )
        else
          pw.Text(
            p.name,
            style: pw.TextStyle(
              font: fonts.semiBold,
              fontSize: 10.5,
              color: _gray900,
            ),
          ),
        if (p.description.isNotEmpty)
          pw.Padding(
            padding: const pw.EdgeInsets.only(top: 2),
            child: pw.RichText(
              text: pw.TextSpan(style: _body, children: _rich(p.description)),
            ),
          ),
        pw.SizedBox(height: _v(7)),
      ],
    ];
  }

  List<pw.Widget> _education() {
    if (data.education.isEmpty) return const [];
    return [
      _title(labels.education),
      for (final e in data.education) ...[
        _entryHeader(
          title: [
            e.field.isNotEmpty
                ? e.field
                : (english ? 'Field of study' : 'Kierunek studiów'),
            if (e.degree.isNotEmpty) degreeLabel(e.degree, english: english),
          ].join(' – '),
          subtitle: e.institution,
          dates: _range(e.startDate, e.endDate),
        ),
        if (e.description.isNotEmpty)
          pw.Padding(
            padding: const pw.EdgeInsets.only(top: 2),
            child: pw.RichText(
              text: pw.TextSpan(style: _body, children: _rich(e.description)),
            ),
          ),
        pw.SizedBox(height: _v(7)),
      ],
    ];
  }

  List<pw.Widget> _certificates() {
    final certificates = data.certificates.where((c) => c.name.isNotEmpty);
    if (certificates.isEmpty) return const [];
    return [
      _title(labels.certificates),
      for (final c in certificates)
        pw.Padding(
          padding: const pw.EdgeInsets.only(bottom: 3),
          child: pw.Text(
            c.date.isEmpty ? c.name : '${c.name} (${_date(c.date)})',
            style: _body,
          ),
        ),
      pw.SizedBox(height: _v(6)),
    ];
  }

  List<pw.Widget> _chips(String title, List<String> items, Color bg, Color fg) {
    final values = items.where((i) => i.trim().isNotEmpty).toList();
    if (values.isEmpty) return const [];
    return [
      _title(title),
      pw.Wrap(
        spacing: 5,
        runSpacing: 5,
        children: [
          for (final v in values)
            pw.Container(
              padding: const pw.EdgeInsets.symmetric(
                horizontal: 7,
                vertical: 3,
              ),
              decoration: pw.BoxDecoration(
                color: _pdf(bg),
                borderRadius: pw.BorderRadius.circular(10),
              ),
              child: pw.Text(
                v,
                style: pw.TextStyle(
                  font: fonts.medium,
                  fontSize: 8.5,
                  color: _pdf(fg),
                ),
              ),
            ),
        ],
      ),
      pw.SizedBox(height: _v(10)),
    ];
  }

  List<pw.Widget> _privacy() {
    if (!options.privacyClause) return const [];
    return [
      pw.SizedBox(height: _v(14)),
      pw.Text(
        labels.privacyClause,
        style: pw.TextStyle(
          font: fonts.light,
          fontSize: 7.5,
          color: _gray500,
          lineSpacing: 1.5,
        ),
      ),
    ];
  }

  pw.Widget _entryHeader({
    required String title,
    required String subtitle,
    required String dates,
  }) => pw.Padding(
    padding: const pw.EdgeInsets.only(bottom: 3),
    child: pw.Row(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Expanded(
          child: pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Text(
                title,
                style: pw.TextStyle(
                  font: fonts.semiBold,
                  fontSize: 10.5,
                  color: _gray900,
                ),
              ),
              if (subtitle.isNotEmpty)
                pw.Text(
                  subtitle,
                  style: pw.TextStyle(
                    font: fonts.medium,
                    fontSize: 9.5,
                    color: _gray700,
                  ),
                ),
            ],
          ),
        ),
        if (dates.isNotEmpty)
          pw.Padding(
            padding: const pw.EdgeInsets.only(left: 8, top: 1),
            child: pw.Text(
              dates,
              style: pw.TextStyle(
                font: fonts.regular,
                fontSize: 8.5,
                color: _gray600,
              ),
            ),
          ),
      ],
    ),
  );

  pw.Widget _bullet(String text) => pw.Padding(
    padding: const pw.EdgeInsets.only(left: 10, bottom: 2),
    child: pw.Row(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text('–', style: _body.copyWith(color: _gray500)),
        pw.SizedBox(width: 5),
        pw.Expanded(
          child: pw.RichText(
            text: pw.TextSpan(style: _body, children: _rich(text)),
          ),
        ),
      ],
    ),
  );

  pw.Widget _emptyHint() => pw.Padding(
    padding: const pw.EdgeInsets.only(top: 200),
    child: pw.Center(
      child: pw.Text(
        'Uzupełnij sekcje w edytorze - podgląd zaktualizuje się na bieżąco.',
        textAlign: pw.TextAlign.center,
        style: pw.TextStyle(font: fonts.regular, fontSize: 12, color: _gray400),
      ),
    ),
  );

  // ── Formatting ────────────────────────────────────────────────────────

  String _fluency(String value) {
    final f = Fluency.normalize(value);
    return english ? f.labelEn : f.labelPl;
  }

  String _date(String raw) {
    if (ProfileDates.isPresent(raw)) return labels.current;
    // A bare year (CV imports) must not turn into "styczeń 2020".
    if (RegExp(r'^\d{4}$').hasMatch(raw.trim())) return raw.trim();
    final date = ProfileDates.parse(raw);
    if (date == null) return raw;
    if (options.dateStyle == CvDateStyle.year) return '${date.year}';
    return DateFormat('LLLL yyyy', english ? 'en_US' : 'pl').format(date);
  }

  /// Web: `start - (current || !end ? "obecnie" : end)`.
  String _range(String start, String end) {
    if (start.isEmpty && end.isEmpty) return '';
    final to = end.isEmpty || ProfileDates.isPresent(end)
        ? labels.current
        : _date(end);
    return start.isEmpty ? to : '${_date(start)} – $to';
  }

  /// Web rich text markers: `**bold**`, `__underline__`, `_italic_`.
  List<pw.InlineSpan> _rich(String text) {
    final spans = <pw.InlineSpan>[];
    final pattern = RegExp(r'\*\*(.+?)\*\*|__(.+?)__|_(.+?)_');
    var index = 0;
    for (final match in pattern.allMatches(text)) {
      if (match.start > index) {
        spans.add(pw.TextSpan(text: text.substring(index, match.start)));
      }
      if (match[1] != null) {
        spans.add(
          pw.TextSpan(
            text: match[1],
            style: pw.TextStyle(font: fonts.semiBold),
          ),
        );
      } else if (match[2] != null) {
        spans.add(
          pw.TextSpan(
            text: match[2],
            style: const pw.TextStyle(decoration: pw.TextDecoration.underline),
          ),
        );
      } else {
        spans.add(
          pw.TextSpan(
            text: match[3],
            style: pw.TextStyle(font: fonts.light),
          ),
        );
      }
      index = match.end;
    }
    if (index < text.length) {
      spans.add(pw.TextSpan(text: text.substring(index)));
    }
    return spans;
  }

  static String _normalizeUrl(String url) {
    final trimmed = url.trim();
    if (trimmed.startsWith(RegExp('https?://'))) return trimmed;
    return 'https://$trimmed';
  }
}

/// 24×24 line icons (gray-600 strokes) for the contact row.
abstract final class _Icons {
  static const _open =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4B5563" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';

  static const mail =
      '$_open<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>';

  static const phone =
      '$_open<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>';

  static const pin =
      '$_open<path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';

  static const link =
      '$_open<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>';
}
