import type { Metadata } from 'next';

import Header from '@/components/SectionsComponents/Header';
import { buildMarketingMetadata } from '@/features/marketing/utils/metadata';
import SalaryCalculator from '@/features/salary-calculator/components/SalaryCalculator';

import Footer from '../assistant/components/Footer';

export const metadata: Metadata = buildMarketingMetadata({
  path: '/salary-calculator',
  title: 'Kalkulator wynagrodzeń brutto netto 2026',
  description:
    'Porównaj, ile dostaniesz na rękę na umowie o pracę, zleceniu, umowie o dzieło i B2B (ryczałt, liniowy, skala). Składki ZUS, zdrowotna, PIT i koszt pracodawcy w 2026 roku.',
  ogAlt: 'Kalkulator wynagrodzeń brutto netto - Vocare',
});

export default function SalaryCalculatorPage() {
  return (
    <main className="w-full overflow-x-hidden">
      <Header />

      <section className="relative -mt-21 px-4 pt-30 pb-12 md:pb-20">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
          <h1 className="font-poppins text-color text-center text-3xl font-bold md:text-[3rem]">
            Kalkulator wynagrodzeń
          </h1>
          <p className="font-poppins mt-4 max-w-2xl text-center font-extralight text-gray-300 sm:text-lg">
            Sprawdź, ile zostanie Ci na rękę przy różnych formach zatrudnienia i ile kosztujesz
            pracodawcę.
          </p>

          <SalaryCalculator className="mt-10" />
        </div>
      </section>

      <Footer />
    </main>
  );
}
