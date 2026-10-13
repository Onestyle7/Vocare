import { TERMS_VERSION } from '@/features/marketing/constants/legal';
import {
  termsOfServiceSections,
  withdrawalFormAnnex,
} from '@/features/marketing/constants/terms-of-service';
import { pdfResponse, renderLegalPdf } from '@/features/marketing/pdf/renderLegalPdf';

// Generowany w czasie builda z tych samych stałych co strona – PDF nie rozjedzie się z treścią
export const dynamic = 'force-static';

export async function GET() {
  const buffer = await renderLegalPdf({
    title: 'Regulamin świadczenia usług drogą elektroniczną – vocare.pl',
    subtitle: `Obowiązuje od ${TERMS_VERSION.publishedDate} dla nowych umów, a od ${TERMS_VERSION.effectiveDate} dla dotychczasowych Użytkowników.`,
    sections: termsOfServiceSections,
    annex: withdrawalFormAnnex,
  });

  return pdfResponse(buffer, `regulamin-vocare-${TERMS_VERSION.effectiveDate}.pdf`);
}
