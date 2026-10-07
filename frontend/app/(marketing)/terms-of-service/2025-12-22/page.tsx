import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalDocument } from '@/features/marketing/components/LegalDocument';
import { TERMS_VERSION } from '@/features/marketing/constants/legal';
import { termsOfService20251222 } from '@/features/marketing/constants/terms-of-service-2025-12-22';

export const metadata: Metadata = {
  title: 'Regulamin Serwisu – wersja archiwalna z 22.12.2025',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/terms-of-service',
  },
};

const TermsOfServiceArchive = () => {
  return (
    <LegalDocument
      title="Regulamin świadczenia usług drogą elektroniczną"
      subtitle={
        <p>
          Wersja archiwalna obowiązująca od 22.12.2025. Wobec Użytkowników, którzy zawarli umowę
          przed {TERMS_VERSION.publishedDate}, stosuje się ją do dnia poprzedzającego{' '}
          {TERMS_VERSION.effectiveDate}.{' '}
          <Link href="/terms-of-service" className="underline hover:text-[#915EFF]">
            Aktualna wersja Regulaminu
          </Link>
        </p>
      }
      sections={termsOfService20251222}
      pdfHref="/terms-of-service/2025-12-22/pdf"
    />
  );
};

export default TermsOfServiceArchive;
