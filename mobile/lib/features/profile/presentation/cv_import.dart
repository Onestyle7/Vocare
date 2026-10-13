import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/result.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/feedback.dart';
import '../../legal/presentation/ai_consent_sheet.dart';
import '../data/profile_repository.dart';

const _allowedExtensions = ['pdf', 'doc', 'docx'];

/// "Uzupełnij profil z CV": pick a document, let the backend parse and save
/// it, and show a blocking progress overlay meanwhile (parsing takes a while).
Future<void> importCvFlow(BuildContext context, WidgetRef ref) async {
  // The backend reads the document with OpenAI.
  if (!await ensureAiConsent(context) || !context.mounted) return;
  final file = await FilePicker.pickFile(
    type: FileType.custom,
    allowedExtensions: _allowedExtensions,
  );
  if (file == null || !context.mounted) return;

  final path = file.path;
  final extension = file.name.split('.').last.toLowerCase();
  if (path == null || !_allowedExtensions.contains(extension)) {
    showToast(
      context,
      'Nieobsługiwany format pliku. Dozwolone: PDF, DOC, DOCX.',
      kind: ToastKind.error,
    );
    return;
  }

  final navigator = Navigator.of(context, rootNavigator: true);
  showDialog<void>(
    context: context,
    barrierDismissible: false,
    barrierColor: Colors.black54,
    builder: (_) => const _ImportProgress(),
  );

  final result = await ref
      .read(profileProvider.notifier)
      .importCv(path: path, fileName: file.name);
  navigator.pop();
  if (!context.mounted) return;

  switch (result) {
    case Ok():
      showToast(
        context,
        'Profil został uzupełniony na podstawie CV.',
        kind: ToastKind.success,
      );
    case Err(:final error):
      showToast(context, error.message, kind: ToastKind.error);
  }
}

class _ImportProgress extends StatelessWidget {
  const _ImportProgress();

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      child: Center(
        child: Container(
          width: 260,
          padding: const EdgeInsets.all(28),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: AppColors.hairline),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox.square(
                dimension: 36,
                child: CircularProgressIndicator(strokeWidth: 2.5),
              ),
              const SizedBox(height: 20),
              Text('Analizujemy Twoje CV', style: AppTypography.button),
              const SizedBox(height: 6),
              Text(
                'To może potrwać do minuty.',
                style: AppTypography.label,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
