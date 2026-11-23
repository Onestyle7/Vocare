import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalDocument } from '@/features/marketing/components/LegalDocument';
import {
  termsOfService20251222,
  termsOfService20251222Validity,
} from '@/features/marketing/constants/terms-of-service-2025-12-22';

export const metadata: Metadata = {
  title: 'Regulamin Serwisu – wersja archiwalna z 22.12.2025',
  // noindex alone: a canonical pointing at the current version sent the opposite signal
  robots: { index: false, follow: true },
};

const TermsOfServiceArchive = () => {
  return (
    <LegalDocument
      title="Regulamin świadczenia usług drogą elektroniczną"
      subtitle={
        <p>
          {termsOfService20251222Validity}{' '}
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
