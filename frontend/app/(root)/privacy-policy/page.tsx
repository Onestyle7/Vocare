'use client';

import { privacy_policy } from '@/app/constants';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Section = {
  title: string;
  points: string[];
};

const sections: Section[] = privacy_policy.sections;

const PrivacyPolicy = () => {
  return (
    <div className="font-grotesk min-h-screen bg-neutral-950 text-neutral-200">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-10">
          <Link
            href="/"
            className="bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50 mb-4 inline-flex items-center justify-center gap-2 rounded-md border p-2 text-sm font-medium shadow-xs transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Powrót
          </Link>

          <h1 className="text-3xl font-semibold tracking-tight text-neutral-100 sm:text-4xl">
            Polityka Prywatności Vocare
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-400">
            Dokument opisujący zasady przetwarzania danych osobowych oraz ochrony prywatności
            użytkowników aplikacji Vocare.
          </p>
        </header>

        {/* Content */}
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

        {/* Footer */}
        <footer className="mt-16 border-t border-neutral-800 pt-6 text-xs text-neutral-500">
          © {new Date().getFullYear()} Vocare. Wszelkie prawa zastrzeżone.
        </footer>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
