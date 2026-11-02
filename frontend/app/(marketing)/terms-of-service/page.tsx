import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalDocument } from '@/features/marketing/components/LegalDocument';
import { TERMS_VERSION } from '@/features/marketing/constants/legal';
import {
  termsOfServiceSections,
  withdrawalFormAnnex,
} from '@/features/marketing/constants/terms-of-service';
import { buildMarketingMetadata } from '@/features/marketing/utils/metadata';

export const metadata: Metadata = buildMarketingMetadata({
  path: '/terms-of-service',
  title: 'Regulamin Serwisu',
  description:
    'Regulamin świadczenia usług drogą elektroniczną w serwisie Vocare. Poznaj warunki korzystania z platformy, zasady płatności, prawo odstąpienia i tryb reklamacji.',
  ogAlt: 'Regulamin Serwisu - Vocare',
});

const TermsOfService = () => {
  return (
    <LegalDocument
      title="Regulamin świadczenia usług drogą elektroniczną"
      subtitle={
        <>
          <p>
            Dokument określający zasady korzystania z serwisu vocare.pl oraz warunki świadczenia
            usług cyfrowych.
          </p>
          <p className="mt-1">
            Obowiązuje od {TERMS_VERSION.publishedDate} dla nowych umów, a od{' '}
            {TERMS_VERSION.effectiveDate} dla dotychczasowych Użytkowników.{' '}
            <Link
              href={TERMS_VERSION.previousVersion.href}
              className="underline hover:text-[#915EFF]"
            >
              Poprzednia wersja (od {TERMS_VERSION.previousVersion.effectiveDate})
            </Link>
          </p>
        </>
      }
      sections={termsOfServiceSections}
      pdfHref="/terms-of-service/pdf"
    >
      <section id="formularz-odstapienia">
        <h2 className="mb-4 text-xl font-semibold text-neutral-100">{withdrawalFormAnnex.title}</h2>
        <div className="space-y-2 rounded-lg border border-neutral-800 p-5 text-sm leading-relaxed text-neutral-300">
          <p className="text-neutral-400 italic">{withdrawalFormAnnex.intro}</p>
          {withdrawalFormAnnex.lines.map((line) => (
            <p key={line}>– {line}</p>
          ))}
          <p className="text-neutral-400">{withdrawalFormAnnex.footnote}</p>
        </div>
      </section>
    </LegalDocument>
  );
};

export default TermsOfService;
