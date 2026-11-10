import Link from 'next/link';

import { RATES_2026 } from '../config/rates-2026';

const percent = (value: number) =>
  `${(value * 100).toLocaleString('pl-PL', { maximumFractionDigits: 2 })}%`;
const amount = (value: number) =>
  `${value.toLocaleString('pl-PL', { maximumFractionDigits: 2 })} zł`;

const { employee, pit, b2b, minimumWage } = RATES_2026;

// Numbers are read from the same config the calculator uses, so this text
// cannot drift from the results shown above it.
const RATE_ROWS = [
  { name: 'Składka emerytalna (pracownik)', value: percent(employee.pension) },
  { name: 'Składka rentowa (pracownik)', value: percent(employee.disability) },
  { name: 'Składka chorobowa', value: percent(employee.sickness) },
  { name: 'Składka zdrowotna', value: percent(employee.health) },
  {
    name: 'Podatek dochodowy (skala)',
    value: `${percent(pit.lowerRate)} do ${amount(pit.threshold)} rocznie, ${percent(pit.upperRate)} powyżej`,
  },
  { name: 'Minimalne wynagrodzenie', value: `${amount(minimumWage)} brutto` },
  { name: 'Podstawa składek społecznych na B2B', value: amount(b2b.socialBase) },
];

const GUIDES = [
  {
    href: '/blog/praca/umowa-o-prace-vs-b2b',
    title: 'Umowa o pracę vs B2B vs zlecenie',
    text: 'Porównanie na kwotach przy tym samym koszcie dla firmy i różnice poza wypłatą.',
  },
  {
    href: '/blog/rynek-pracy/ile-na-reke-b2b',
    title: 'Ile na rękę z B2B',
    text: 'Ryczałt, podatek liniowy i skala dla faktur od 8 do 30 tys. zł.',
  },
  {
    href: '/blog/rynek-pracy/brutto-netto-umowa-zlecenie',
    title: 'Umowa zlecenie brutto netto',
    text: 'Tabela dla studenta, osoby do 26 lat i pełnych składek oraz wyliczenie krok po kroku.',
  },
];

/**
 * Explains how the calculator gets from gross to net. The page used to hold
 * only the tool (about 230 words), which gave search engines little to rank
 * for "kalkulator wynagrodzeń" queries beyond the title.
 */
export default function SalaryCalculatorGuide() {
  return (
    <section
      aria-labelledby="salary-guide-title"
      className="font-poppins mx-auto w-full max-w-5xl px-4 pb-16 text-[#F1F4FF] md:pb-24"
    >
      <h2 id="salary-guide-title" className="text-2xl font-medium md:text-3xl">
        Jak kalkulator liczy wynagrodzenie netto w {RATES_2026.year} roku
      </h2>
      <p className="mt-4 max-w-3xl font-light text-white/70">
        Od kwoty brutto kalkulator odejmuje kolejno składki społeczne, składkę zdrowotną i zaliczkę
        na podatek dochodowy. Wynik to średnia miesięczna z całego roku, więc uwzględnia
        przekroczenie progu podatkowego i limitu ulgi dla młodych. Dla B2B wpisana kwota jest
        traktowana jako faktura netto, bez VAT.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#16171B]">
        <h3 className="px-5 pt-5 text-lg font-medium md:px-6 md:pt-6">
          Stawki {RATES_2026.year}, na których opiera się wynik
        </h3>
        <table className="mt-3 w-full text-left text-sm md:text-base">
          <thead className="sr-only">
            <tr>
              <th scope="col">Parametr</th>
              <th scope="col">Wartość</th>
            </tr>
          </thead>
          <tbody>
            {RATE_ROWS.map(({ name, value }) => (
              <tr key={name} className="border-t border-white/10">
                <th scope="row" className="px-5 py-3 font-light md:px-6">
                  {name}
                </th>
                <td className="px-5 py-3 text-right font-medium md:px-6">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mt-10 text-lg font-medium md:text-xl">Poradniki do wyników</h3>
      <ul className="mt-4 grid gap-4 md:grid-cols-3">
        {GUIDES.map(({ href, title, text }) => (
          <li key={href}>
            <Link
              href={href}
              className="block h-full rounded-2xl border border-white/10 bg-[#16171B] p-5 transition-colors hover:border-[#9D9BFF]/60 focus-visible:ring-2 focus-visible:ring-[#915EFF] focus-visible:outline-none"
            >
              <span className="font-medium">{title}</span>
              <span className="mt-2 block text-sm font-light text-white/70">{text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
