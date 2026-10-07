import { TERMS_VERSION } from '@/features/marketing/constants/legal';
import { termsOfService20251222 } from '@/features/marketing/constants/terms-of-service-2025-12-22';
import { pdfResponse, renderLegalPdf } from '@/features/marketing/pdf/renderLegalPdf';

export const dynamic = 'force-static';

export async function GET() {
  const buffer = await renderLegalPdf({
    title: 'Regulamin świadczenia usług drogą elektroniczną – vocare.pl',
    subtitle: `Wersja archiwalna obowiązująca od 22.12.2025. Wobec Użytkowników, którzy zawarli umowę przed ${TERMS_VERSION.publishedDate}, stosuje się ją do dnia poprzedzającego ${TERMS_VERSION.effectiveDate}.`,
    sections: termsOfService20251222,
  });

  return pdfResponse(buffer, 'regulamin-vocare-22.12.2025.pdf');
}
