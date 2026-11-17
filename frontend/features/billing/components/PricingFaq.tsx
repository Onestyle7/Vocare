import Link from 'next/link';

import { GENERATE_CV_FROM_PROFILE_PRICE, TAILOR_CV_PRICE } from '@/features/resume/constants';

import {
  ASSISTANT_RECOMMENDATIONS_PRICE,
  CONSENT_DISCOUNT_PERCENT,
  CONSENT_DISCOUNT_VALIDITY_DAYS,
  DEFAULT_TRIAL_DAYS,
  MARKET_ANALYSIS_PRICE,
  premiumQuarterlyVariant,
  pricingPlans,
} from '../constants';

// Mirrors `ANALYZE_CV_PRICE` in CvAnalysisDrawer and the "AnalyzeCv" row of the
// backend ServiceCosts table.
const ANALYZE_CV_PRICE = 10;

const TOKEN_COSTS = [
  { name: 'Rekomendacje ścieżek kariery', tokens: ASSISTANT_RECOMMENDATIONS_PRICE },
  { name: 'Analiza rynku pracy', tokens: MARKET_ANALYSIS_PRICE },
  { name: 'Generowanie CV na podstawie profilu', tokens: GENERATE_CV_FROM_PROFILE_PRICE },
  { name: 'Dopasowanie CV do oferty pracy', tokens: TAILOR_CV_PRICE },
  { name: 'Ocena jakości CV', tokens: ANALYZE_CV_PRICE },
];

const premiumPlan = pricingPlans.find((plan) => plan.type === 'subscription');
const tokenPlan = pricingPlans.find((plan) => plan.type === 'tokens');

const premiumPrices = [
  premiumPlan ? `${premiumPlan.price} zł za miesiąc` : null,
  premiumQuarterlyVariant.priceId ? `${premiumQuarterlyVariant.price} zł za 3 miesiące` : null,
]
  .filter(Boolean)
  .join(' albo ');

// Answers follow the Terms of Service (Tokeny, Subskrypcja Premium, Rabat za
// zgodę marketingową, Prawo odstąpienia). Update both together.
const QUESTIONS = [
  {
    question: 'Czym jest token?',
    answer: `Token to jednostka, którą płacisz za funkcje AI w Vocare. ${
      tokenPlan
        ? `Pakiet 500 tokenów kosztuje ${tokenPlan.price} zł i jest płatny jednorazowo. `
        : ''
    }Koszt funkcji widzisz przed jej uruchomieniem i musisz go potwierdzić. Tokeny są pobierane dopiero po wykonaniu usługi.`,
  },
  {
    question: 'Co się dzieje, gdy tokeny się skończą?',
    answer:
      'Funkcje AI są niedostępne do czasu dokupienia pakietu albo włączenia Premium. Kreator CV działa dalej, a zapisane CV i roadmapy zostają na koncie. Niewykorzystane tokeny nie wygasają przez cały okres istnienia konta.',
  },
  {
    question: 'Czy w Premium zużywam tokeny?',
    answer:
      'Nie. Dopóki subskrypcja Premium jest aktywna, funkcje objęte planem nie zmniejszają salda tokenów. Kupione wcześniej tokeny czekają na koncie.',
  },
  {
    question: 'Jak działa okres próbny?',
    answer: `Premium testujesz przez ${DEFAULT_TRIAL_DAYS} dni za 0 zł. Start wymaga podania metody płatności. Jeśli nie anulujesz przed końcem okresu próbnego, w dniu jego zakończenia pobieramy pierwszą opłatę (${premiumPrices}), a subskrypcja odnawia się automatycznie. Okres próbny przysługuje jednej osobie raz.`,
  },
  {
    question: 'Jak zrezygnować z subskrypcji?',
    answer:
      'Subskrypcję anulujesz w każdej chwili w ustawieniach płatności na koncie albo mailowo. Dostęp do Premium zachowujesz do końca opłaconego okresu, potem konto przechodzi na plan Free. Przez 14 dni od pierwszego zakupu możesz też odstąpić od umowy i otrzymać zwrot całej ceny.',
  },
  {
    question: 'Jak mogę zapłacić?',
    answer:
      'Za pakiet tokenów zapłacisz kartą, BLIK-iem albo Apple Pay. Subskrypcja odnawia się z metody płatności podanej przy zakupie. Plan Free nie wymaga karty.',
  },
  {
    question: 'Jak dostać rabat na tokeny?',
    answer: `Za zgodę na informacje marketingowe dostajesz jednorazowo ${CONSENT_DISCOUNT_PERCENT}% rabatu na jeden pakiet tokenów. Rabat jest ważny ${CONSENT_DISCOUNT_VALIDITY_DAYS} dni od przyznania i nalicza się automatycznie przy płatności. Nie obejmuje subskrypcji Premium.`,
  },
];

/**
 * Answers to the questions people have before paying. Plain visible text, no
 * FAQPage markup: Google retired that rich result in May 2026.
 */
export function PricingFaq() {
  return (
    <section
      aria-labelledby="pricing-faq-title"
      className="font-poppins mx-auto w-full max-w-5xl px-4 pb-16 text-[#F1F4FF] md:px-6 md:pb-24"
    >
      <h2 id="pricing-faq-title" className="text-center text-2xl font-medium md:text-4xl">
        Jak działają plany i tokeny
      </h2>

      <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-[#16171B]">
        <h3 className="px-5 pt-5 text-lg font-medium md:px-6 md:pt-6">
          Ile tokenów kosztują funkcje AI?
        </h3>
        <table className="mt-3 w-full text-left text-sm md:text-base">
          <thead className="sr-only">
            <tr>
              <th scope="col">Funkcja</th>
              <th scope="col">Koszt</th>
            </tr>
          </thead>
          <tbody>
            {TOKEN_COSTS.map(({ name, tokens }) => (
              <tr key={name} className="border-t border-white/10">
                <th scope="row" className="px-5 py-3 font-light md:px-6">
                  {name}
                </th>
                <td className="px-5 py-3 text-right font-medium whitespace-nowrap md:px-6">
                  {tokens} tokenów
                </td>
              </tr>
            ))}
            <tr className="border-t border-white/10">
              <th scope="row" className="px-5 py-3 font-light md:px-6">
                Kreator CV: edycja i pobieranie PDF
              </th>
              <td className="px-5 py-3 text-right font-medium whitespace-nowrap md:px-6">
                0 tokenów
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <dl className="mt-6 grid gap-4 md:grid-cols-2 md:gap-6">
        {QUESTIONS.map(({ question, answer }) => (
          <div
            key={question}
            className="rounded-2xl border border-white/10 bg-[#16171B] p-5 md:p-6"
          >
            <dt className="text-lg font-medium">{question}</dt>
            <dd className="mt-2 text-sm leading-relaxed font-light text-white/70 md:text-base">
              {answer}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-8 text-center text-sm font-light text-white/60">
        Pełne zasady znajdziesz w{' '}
        <Link href="/terms-of-service" className="text-white underline underline-offset-4">
          Regulaminie
        </Link>
        .
      </p>
    </section>
  );
}
