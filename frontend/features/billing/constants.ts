import env from '@/lib/env/client';

import { BillingType } from './dal/api';
import { SubscriptionStatuses } from './types';

export const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatuses[] = ['Active', 'Trialing'];

export const ASSISTANT_RECOMMENDATIONS_PRICE = 60;
export const MARKET_ANALYSIS_PRICE = 50;
// Backend Roadmap nie korzysta obecnie z BillingService.
export const ROADMAP_GENERATION_PRICE = 0;

export const pricingPlans = [
  {
    name: 'Osobiste',
    description: 'Idealne do znalezienia swojej ścieżki zawodowej.',
    price: 19,
    save: undefined,
    tokens: 500 as number | string,
    priceId: env.NEXT_PUBLIC_PERSONAL_PRICE_ID,
    type: 'tokens' as BillingType,
    features: [
      '500 tokenów w pakiecie',
      'Indywidualne doradztwo kariery',
      'Spersonalizowane propozycje ścieżek kariery',
      'Analizy rynku pracy',
    ],
    popular: false,
  },
  {
    name: 'Rozwój',
    description: 'Najlepszy wybór do rozwoju Twojej kariery.',
    price: 29,
    save: '35%',
    tokens: 'Nielimitowany' as number | string,
    priceId: env.NEXT_PUBLIC_GROWTH_PRICE_ID,
    type: 'subscription' as BillingType,
    features: [
      'Nielimitowany dostęp',
      'Indywidualne doradztwo kariery',
      'Spersonalizowane propozycje ścieżek kariery',
      'Analizy rynku pracy dla Twoich kierunków kariery',
    ],
    popular: true,
  },
  {
    name: 'Indywidualne',
    description: 'Twoja kariera prowadzona przez naszych ekspertów.',
    price: 99,
    save: '65%',
    tokens: '—' as number | string,
    priceId: env.NEXT_PUBLIC_INDIVIDUAL_PRICE_ID,
    type: 'individual' as BillingType,
    features: [
      'Analiza CV przez eksperta kariery',
      'Optymalizacja CV',
      '5 spersonalizowanych ścieżek kariery',
      'Wyniki w ciągu 48 godzin',
    ],
    popular: false,
  },
] as const;
