import {
  termsOfService20261013,
  termsOfService20261013Validity,
  withdrawalFormAnnex20261013,
} from '@/features/marketing/constants/terms-of-service-2026-10-13';
import { pdfResponse, renderLegalPdf } from '@/features/marketing/pdf/renderLegalPdf';

export const dynamic = 'force-static';

export async function GET() {
  const buffer = await renderLegalPdf({
    title: 'Regulamin świadczenia usług drogą elektroniczną – vocare.pl',
    subtitle: termsOfService20261013Validity,
    sections: termsOfService20261013,
    annex: withdrawalFormAnnex20261013,
  });

  return pdfResponse(buffer, 'regulamin-vocare-13.10.2026.pdf');
}
