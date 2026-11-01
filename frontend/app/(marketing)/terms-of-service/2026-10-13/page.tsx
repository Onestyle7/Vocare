import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalDocument } from '@/features/marketing/components/LegalDocument';
import {
  termsOfService20261013,
  termsOfService20261013Validity,
  withdrawalFormAnnex20261013,
} from '@/features/marketing/constants/terms-of-service-2026-10-13';

export const metadata: Metadata = {
  title: 'Regulamin Serwisu – wersja archiwalna z 13.10.2026',
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
          {termsOfService20261013Validity}{' '}
          <Link href="/terms-of-service" className="underline hover:text-[#915EFF]">
            Aktualna wersja Regulaminu
          </Link>
        </p>
      }
      sections={termsOfService20261013}
      pdfHref="/terms-of-service/2026-10-13/pdf"
    >
      <section id="formularz-odstapienia">
        <h2 className="mb-4 text-xl font-semibold text-neutral-100">
          {withdrawalFormAnnex20261013.title}
        </h2>
        <div className="space-y-2 rounded-lg border border-neutral-800 p-5 text-sm leading-relaxed text-neutral-300">
          <p className="text-neutral-400 italic">{withdrawalFormAnnex20261013.intro}</p>
          {withdrawalFormAnnex20261013.lines.map((line) => (
            <p key={line}>– {line}</p>
          ))}
          <p className="text-neutral-400">{withdrawalFormAnnex20261013.footnote}</p>
        </div>
      </section>
    </LegalDocument>
  );
};

export default TermsOfServiceArchive;
