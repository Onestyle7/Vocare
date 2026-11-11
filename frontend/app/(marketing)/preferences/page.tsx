import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import {
  AdsConsentCard,
  AnalyticsConsentCard,
} from '@/components/SupportComponents/AnalyticsConsentCard';

export const metadata: Metadata = {
  title: 'Preferencje Prywatności',
  description: 'Zarządzaj zgodami na pliki cookies analityczne i reklamowe w serwisie Vocare.',
  alternates: {
    canonical: '/preferences',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function PreferencesPage() {
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
            Preferencje prywatności
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-400">
            Zarządzaj zgodami na pliki cookies analityczne i reklamowe. Obie zgody są od siebie
            niezależne.
          </p>
        </header>

        <main className="space-y-6">
          <AnalyticsConsentCard className="bg-card/80 rounded-xl p-6 shadow-sm backdrop-blur" />
          <AdsConsentCard className="bg-card/80 rounded-xl p-6 shadow-sm backdrop-blur" />
        </main>

        <footer className="mt-16 border-t border-neutral-800 pt-6 text-xs text-neutral-500">
          © {new Date().getFullYear()} Vocare. Wszelkie prawa zastrzeżone.
        </footer>
      </div>
    </div>
  );
}
