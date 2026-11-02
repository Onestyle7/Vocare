import type { ContractType } from './lib/types';

export const CONTRACT_META: Record<
  ContractType,
  { label: string; shortLabel: string; isB2b: boolean; assumptions: string }
> = {
  employment: {
    label: 'Umowa o pracę',
    shortLabel: 'UoP',
    isB2b: false,
    assumptions:
      'Standardowe koszty uzyskania przychodu (250 zł), złożony PIT-2, praca w miejscu zamieszkania. Bez PPK.',
  },
  mandate: {
    label: 'Umowa zlecenie',
    shortLabel: 'Zlecenie',
    isB2b: false,
    assumptions:
      'Pełne składki ZUS z dobrowolnym chorobowym, koszty 20%, zaliczka 12% bez PIT-2. Uczeń lub student do 26 lat nie płaci ZUS ani zdrowotnej, a do 85 528 zł rocznie także PIT.',
  },
  specificTask: {
    label: 'Umowa o dzieło',
    shortLabel: 'Dzieło',
    isB2b: false,
    assumptions:
      'Brak składek ZUS i zdrowotnej. Koszty 20% albo 50% przy przeniesieniu praw autorskich (do 120 000 zł kosztów rocznie).',
  },
  b2bLumpSum: {
    label: 'B2B – ryczałt',
    shortLabel: 'Ryczałt',
    isB2b: true,
    assumptions:
      'Duży ZUS z chorobowym, brak kosztów firmowych. Składka zdrowotna zależy od rocznego przychodu pomniejszonego o składki społeczne, 50% zdrowotnej pomniejsza przychód.',
  },
  b2bFlat: {
    label: 'B2B – podatek liniowy',
    shortLabel: 'Liniowy',
    isB2b: true,
    assumptions:
      'Duży ZUS z chorobowym, brak kosztów firmowych. Podatek 19%, zdrowotna 4,9% dochodu (odliczenie do 14 100 zł rocznie).',
  },
  b2bScale: {
    label: 'B2B – skala podatkowa',
    shortLabel: 'Skala',
    isB2b: true,
    assumptions:
      'Duży ZUS z chorobowym, brak kosztów firmowych. Podatek 12%/32% z kwotą wolną 30 000 zł, zdrowotna 9% dochodu.',
  },
};

export const LUMP_SUM_RATES = [
  { value: 0.085, label: '8,5%' },
  { value: 0.12, label: '12% (IT)' },
  { value: 0.14, label: '14%' },
  { value: 0.15, label: '15%' },
  { value: 0.17, label: '17%' },
];

export const AMOUNT_MIN = 1000;
export const AMOUNT_MAX = 60_000;
export const AMOUNT_STEP = 100;
export const DEFAULT_AMOUNT = 10_000;
