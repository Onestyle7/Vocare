import env from '@/lib/env/client';

import type { PricingPlan, SubscriptionStatuses } from './types';

export const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatuses[] = ['Active', 'Trialing'];

// Domyślna długość triala dla niezalogowanych – zalogowani dostają wartość z API (trialDays),
// która uwzględnia konfigurację backendu i to, czy konto miało już subskrypcję
export const DEFAULT_TRIAL_DAYS = 14;

// Rabat za zgodę marketingową – musi zgadzać się z sekcją ConsentDiscount (PercentOff,
// ValidityDays) w appsettings backendu i z § 9 Regulaminu. Wysokość i ważność rabatu to istotne
// informacje o ofercie, więc pokazujemy je, zanim użytkownik wyrazi zgodę.
export const CONSENT_DISCOUNT_PERCENT = 25;
export const CONSENT_DISCOUNT_VALIDITY_DAYS = 7;
export const CONSENT_DISCOUNT_OFFER = `jednorazowo ${CONSENT_DISCOUNT_PERCENT}% rabatu na pakiet tokenów, ważny ${CONSENT_DISCOUNT_VALIDITY_DAYS} dni`;

export const ASSISTANT_RECOMMENDATIONS_PRICE = 60;
export const MARKET_ANALYSIS_PRICE = 50;
// Backend Roadmap nie korzysta obecnie z BillingService.
export const ROADMAP_GENERATION_PRICE = 0;

export const pricingPlans: readonly PricingPlan[] = [
  {
    type: 'free',
    name: 'Free',
    price: 0,
    priceLabel: '/ na zawsze',
    description: `Kreator CV za darmo. Za zgodę marketingową dostajesz ${CONSENT_DISCOUNT_OFFER}.`,
    // Funkcje AI wymagają tokenów lub subskrypcji – plan darmowy nie zawiera już tokenów na start
    features: [
      { text: 'Nielimitowana edycja i pobieranie CV' },
      { text: 'Do 3 CV na koncie' },
      {
        text: `${CONSENT_DISCOUNT_PERCENT}% rabatu na pakiet tokenów za zgodę marketingową (ważny ${CONSENT_DISCOUNT_VALIDITY_DAYS} dni)`,
      },
    ],
    ctaLabel: 'Zarejestruj się za darmo',
    microcopy: 'Start w 2 minuty.',
    microcopyEmphasis: 'Bez karty płatniczej.',
    microcopyEmphasisPosition: 'start',
    popular: false,
  },
  {
    type: 'subscription',
    name: 'Premium',
    price: 29,
    priceLabel: '/ miesiąc',
    description: 'Ok. 0,95 zł/dzień za spersonalizowane rekomendacje kariery',
    priceId: env.NEXT_PUBLIC_GROWTH_PRICE_ID,
    features: [
      { text: 'Nielimitowana edycja i pobieranie CV' },
      { text: 'Do 25 różnych CV na koncie' },
      { text: 'Nielimitowana ocena jakości CV' },
      { text: 'Nielimitowane dopasowanie CV do ofert pracy' },
      { text: 'Nielimitowane dopracowanie CV na bazie profilu' },
      { text: 'Nielimitowane, personalizowane rekomendacje zawodowe' },
      { text: 'Dopasowane oferty pracy do każdej rekomendacji' },
      { text: 'Nielimitowane analizy rynkowe' },
      { text: 'Do 10 w pełni zarządzalnych roadmap do rekomendowanych ścieżek' },
    ],
    commitment: 'Anuluj w każdej chwili. Żadnych zobowiązań.',
    ctaLabel: 'Wybierz Premium',
    microcopy: 'Pierwsza płatność dziś, kolejna za miesiąc.',
    popular: true,
  },
  {
    type: 'tokens',
    name: 'Pakiet 500 tokenów',
    price: 19,
    priceLabel: 'jednorazowo',
    description: 'Dla kogoś, kto chce skorzystać z AI bez subskrypcji.',
    priceId: env.NEXT_PUBLIC_PERSONAL_PRICE_ID,
    featuresIntro: 'Kreator CV jak w planie Free, a do tego:',
    features: [
      { text: 'Brak subskrypcji - nie musisz podpinać karty na stałe' },
      { text: 'Płatność jednorazowa, Apple Pay, Blik lub karta' },
      { text: 'Do 50 ocen jakości CV', alternative: true },
      { text: 'Do 25 dopasowań CV do ofert pracy', alternative: true },
      { text: 'Do 25 dopracowań CV na bazie profilu', alternative: true },
      { text: 'Dowolna kombinacja powyższych - Ty decydujesz, na co wydać' },
    ],
    ctaLabel: 'Dokup 500 tokenów',
    microcopy: 'Tokeny nie wygasają.',
    popular: false,
  },
];

export type BillingPeriod = 'monthly' | 'quarterly';

// Wariant kwartalny karty Premium (przełącznik w karcie). Funkcje i CTA bez zmian –
// zmienia się tylko cena, okres i Price ID. Bez Price ID przełącznik jest ukryty.
export const premiumQuarterlyVariant: Pick<
  PricingPlan,
  'price' | 'priceLabel' | 'description' | 'microcopy'
> & { priceId: string | undefined } = {
  price: 69,
  priceLabel: '/ 3 miesiące',
  description: 'Ok. 23 zł/mies. – 21% taniej niż płatność miesięczna',
  priceId: env.NEXT_PUBLIC_GROWTH_QUARTERLY_PRICE_ID,
  microcopy: 'Pierwsza płatność dziś, kolejna za 3 miesiące.',
};
