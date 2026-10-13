import {
  termsOfService20251222,
  termsOfService20251222Validity,
} from '@/features/marketing/constants/terms-of-service-2025-12-22';
import { pdfResponse, renderLegalPdf } from '@/features/marketing/pdf/renderLegalPdf';

export const dynamic = 'force-static';

export async function GET() {
  const buffer = await renderLegalPdf({
    title: 'Regulamin świadczenia usług drogą elektroniczną – vocare.pl',
    subtitle: termsOfService20251222Validity,
    sections: termsOfService20251222,
  });

  return pdfResponse(buffer, 'regulamin-vocare-22.12.2025.pdf');
}
