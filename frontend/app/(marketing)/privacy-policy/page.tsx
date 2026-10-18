import type { Metadata } from 'next';

import { LegalDocument } from '@/features/marketing/components/LegalDocument';
import { privacy_policy } from '@/features/marketing/constants/privacy-policy';
import { buildMarketingMetadata } from '@/features/marketing/utils/metadata';

export const metadata: Metadata = buildMarketingMetadata({
  path: '/privacy-policy',
  title: 'Polityka Prywatności',
  description:
    'Zasady przetwarzania danych osobowych oraz ochrony prywatności użytkowników serwisu Vocare. Dowiedz się, jak dbamy o Twoje dane.',
  ogAlt: 'Polityka Prywatności - Vocare',
});

const PrivacyPolicy = () => {
  return (
    <LegalDocument
      title={privacy_policy.title}
      subtitle={<p>Data ostatniej aktualizacji: {privacy_policy.lastUpdated}</p>}
      sections={privacy_policy.sections}
      pdfHref="/privacy-policy/pdf"
    />
  );
};

export default PrivacyPolicy;
