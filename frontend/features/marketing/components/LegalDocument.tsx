import { ArrowLeft, FileDown } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import type { LegalPoint, LegalSection } from '../constants/terms-of-service';

interface LegalDocumentProps {
  title: string;
  subtitle: ReactNode;
  sections: readonly LegalSection[];
  pdfHref?: string;
  children?: ReactNode;
}

// An https address, without the punctuation that ends the sentence after it
const URL_PATTERN = /(https:\/\/\S+?)(?=[.,;:)]?(?:\s|$))/;

/**
 * Turns https addresses in legal text into links. TikTok's joint controller terms require
 * a hyperlink to its privacy notice in ours, and plain text addresses can't be clicked.
 */
export function TextWithLinks({ text }: { text: string }) {
  // split() with a capturing group puts each matched address at an odd index
  return text.split(new RegExp(URL_PATTERN, 'g')).map((part, index) =>
    index % 2 === 1 ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all underline hover:text-[#915EFF]"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}

function LegalPointContent({ point }: { point: LegalPoint }) {
  if (typeof point === 'string') return <TextWithLinks text={point} />;

  return (
    <>
      <TextWithLinks text={point.text} />
      <ol className="mt-2 list-[lower-alpha] space-y-1.5 pl-5 marker:text-neutral-500">
        {point.items.map((item) => (
          <li key={item} className="pl-1">
            <TextWithLinks text={item} />
          </li>
        ))}
      </ol>
    </>
  );
}

export function LegalDocument({
  title,
  subtitle,
  sections,
  pdfHref,
  children,
}: LegalDocumentProps) {
  return (
    <div className="font-grotesk min-h-screen bg-neutral-950 text-neutral-200">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10">
          <Link
            href="/"
            className="bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50 mb-4 inline-flex items-center justify-center gap-2 rounded-md border p-2 text-sm font-medium shadow-xs transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Powrót
          </Link>

          <h1 className="text-3xl font-semibold tracking-tight text-neutral-100 sm:text-4xl">
            {title}
          </h1>

          <div className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-400">{subtitle}</div>

          {pdfHref && (
            <a
              href={pdfHref}
              target="_blank"
              rel="noopener"
              className="mt-3 inline-flex items-center gap-2 text-sm text-neutral-300 underline hover:text-[#915EFF]"
            >
              <FileDown className="h-4 w-4" aria-hidden />
              Pobierz PDF
            </a>
          )}
        </header>

        <main className="space-y-10">
          {sections.map((section, sectionIndex) => (
            <section key={section.title}>
              <h2 className="mb-4 text-xl font-semibold text-neutral-100">
                § {sectionIndex + 1}. {section.title}
              </h2>

              <ol className="space-y-3 pl-5 text-sm leading-relaxed text-neutral-300">
                {section.points.map((point, pointIndex) => (
                  <li key={pointIndex} className="list-decimal pl-2 marker:text-neutral-500">
                    <LegalPointContent point={point} />
                  </li>
                ))}
              </ol>
            </section>
          ))}

          {children}
        </main>

        <footer className="mt-16 border-t border-neutral-800 pt-6 text-xs text-neutral-500">
          © {new Date().getFullYear()} Vocare. Wszelkie prawa zastrzeżone.
        </footer>
      </div>
    </div>
  );
}
