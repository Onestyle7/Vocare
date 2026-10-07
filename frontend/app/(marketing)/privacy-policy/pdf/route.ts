import { privacy_policy } from '@/features/marketing/constants/privacy-policy';
import { pdfResponse, renderLegalPdf } from '@/features/marketing/pdf/renderLegalPdf';

export const dynamic = 'force-static';

export async function GET() {
  const buffer = await renderLegalPdf({
    title: privacy_policy.title,
    subtitle: `Data ostatniej aktualizacji: ${privacy_policy.lastUpdated}`,
    sections: privacy_policy.sections,
  });

  return pdfResponse(buffer, 'polityka-prywatnosci-vocare.pdf');
}
