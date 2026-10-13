import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:pdf/pdf.dart';
import 'package:printing/printing.dart';

import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/feedback.dart';

/// The exported PDF itself, rasterised by the platform — the preview can
/// never drift from the file the user sends. Double-tap a page to zoom.
class CvPdfPreview extends StatefulWidget {
  const CvPdfPreview({
    super.key,
    required this.document,
    this.padding = EdgeInsets.zero,
  });

  /// Memoised by the caller; a new future re-renders the pages.
  final Future<Uint8List> document;
  final EdgeInsets padding;

  @override
  State<CvPdfPreview> createState() => _CvPdfPreviewState();
}

class _CvPdfPreviewState extends State<CvPdfPreview> {
  late LayoutCallback _layout = _newLayout();

  /// `PdfPreviewCustom` re-rasterises when the callback identity changes.
  LayoutCallback _newLayout() =>
      (_) => widget.document;

  @override
  void didUpdateWidget(CvPdfPreview oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.document != widget.document) _layout = _newLayout();
  }

  @override
  Widget build(BuildContext context) {
    return PdfPreviewCustom(
      build: _layout,
      pageFormat: PdfPageFormat.a4,
      maxPageWidth: 560,
      padding: widget.padding,
      previewPageMargin: const EdgeInsets.fromLTRB(20, 6, 20, 14),
      scrollViewDecoration: const BoxDecoration(),
      pdfPreviewPageDecoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Color(0x8C000000),
            blurRadius: 30,
            offset: Offset(0, 14),
          ),
        ],
      ),
      scrollPhysics: const AlwaysScrollableScrollPhysics(
        parent: BouncingScrollPhysics(),
      ),
      loadingWidget: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator.adaptive(),
            const SizedBox(height: 14),
            Text('Przygotowujemy podgląd…', style: AppTypography.label),
          ],
        ),
      ),
      onError: (_, _) => const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: StateMessage(
            icon: Icons.picture_as_pdf_outlined,
            title: 'Nie udało się wyświetlić podglądu',
            message: 'Spróbuj ponownie za chwilę.',
          ),
        ),
      ),
    );
  }
}
