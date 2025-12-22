'use client';

import {
  postanowienia_ogolne,
  definicje,
  wymagania_techniczne,
  uslugi_i_wylaczenie_odpowiedzialnosci_ai,
  platnosci_i_zawarcie_umowy,
  prawo_odstapienia,
  reklamacje,
  ochrona_danych_osobowych,
  postanowienia_koncowe,
} from '@/app/constants';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Section = {
  title: string;
  points: string[];
};

const sections: Section[] = [
  postanowienia_ogolne,
  definicje,
  wymagania_techniczne,
  uslugi_i_wylaczenie_odpowiedzialnosci_ai,
  platnosci_i_zawarcie_umowy,
  prawo_odstapienia,
  reklamacje,
  ochrona_danych_osobowych,
  postanowienia_koncowe,
];

const TermsOfService = () => {
  return (
    <div className="font-grotesk min-h-screen bg-neutral-950 text-neutral-200">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10">
          <Link
            href="/"
            className="focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50 mb-4 inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border p-2 text-sm font-medium whitespace-nowrap shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Powrót
          </Link>

          <h1 className="text-3xl font-semibold tracking-tight text-neutral-100 sm:text-4xl">
            Regulamin świadczenia usług drogą elektroniczną
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-400">
            Dokument określający zasady korzystania z serwisu vocare.pl oraz warunki świadczenia usług
            cyfrowych.
          </p>
        </header>

        <main className="space-y-10">
          {sections.map((section, sectionIndex) => (
            <section key={section.title}>
              <h2 className="mb-4 text-xl font-semibold text-neutral-100">
                {sectionIndex + 1}. {section.title}
              </h2>

              <ol className="space-y-3 pl-5 text-sm leading-relaxed text-neutral-300">
                {section.points.map((point, pointIndex) => (
                  <li key={pointIndex} className="list-decimal pl-2 marker:text-neutral-500">
                    {point}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </main>

        <footer className="mt-16 border-t border-neutral-800 pt-6 text-xs text-neutral-500">
          © {new Date().getFullYear()} Vocare. Wszelkie prawa zastrzeżone.
        </footer>
      </div>
    </div>
  );
};

export default TermsOfService;
