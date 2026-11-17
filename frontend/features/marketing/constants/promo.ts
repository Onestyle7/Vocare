import { DEFAULT_TRIAL_DAYS, pricingPlans } from '@/features/billing/constants';
import type { BlogCategorySlug } from '@/features/blog/utils/constants';

export type PromoVariant = 'cv' | 'career' | 'market' | 'salary';

export type PromoPlacement = 'sidebar' | 'bar' | 'inline';

export type PromoContent = {
  eyebrow: string;
  title: string;
  text: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  /** Terms of the offer behind the CTA. Shown next to the button in every layout. */
  note: string;
  moreLabel: string;
  moreHref: string;
};

const premiumPlan = pricingPlans.find((plan) => plan.type === 'subscription');
const freePlan = pricingPlans.find((plan) => plan.type === 'free');

// Prices and trial length come from the pricing config, so the promo cannot
// drift from /pricing. The trial note names the price after the trial right
// next to "0 zł", the same rule the pricing card follows.
const TRIAL_CTA_LABEL = `Testuj ${DEFAULT_TRIAL_DAYS} dni za 0 zł`;
const TRIAL_NOTE = premiumPlan
  ? `0 zł przez ${DEFAULT_TRIAL_DAYS} dni, potem ${premiumPlan.price} zł${premiumPlan.priceLabel.replace('/ ', '/')}, odnawiane automatycznie. Anulujesz w każdej chwili.`
  : '';
const FREE_NOTE = freePlan
  ? [freePlan.microcopy, freePlan.microcopyEmphasis].filter(Boolean).join(' ')
  : '';

export const PROMO_CONTENT: Record<PromoVariant, PromoContent> = {
  cv: {
    eyebrow: 'Kreator CV · 0 zł',
    title: 'Zrób CV, które trafia do rekruterów',
    text: 'Kreator prowadzi Cię sekcja po sekcji, a gotowy dokument pobierasz jako PDF.',
    bullets: [
      'Nielimitowana edycja i pobieranie CV',
      'Layout stworzony pod ATS',
      'Do 3 CV na koncie',
    ],
    ctaLabel: 'Zrób CV za darmo',
    ctaHref: '/sign-up',
    note: FREE_NOTE,
    moreLabel: 'Zobacz kreator CV',
    moreHref: '/resume-creator',
  },
  career: {
    eyebrow: 'Doradca kariery AI',
    title: 'Nie szukaj pracy. Zaplanuj całą karierę',
    text: 'Doradca analizuje Twój profil i pokazuje, dokąd możesz dojść i od czego zacząć.',
    bullets: [
      '3 ścieżki kariery dopasowane do profilu',
      'Oferty pracy dopasowane do każdej ścieżki',
      'Roadmapa z krokami do celu',
    ],
    ctaLabel: TRIAL_CTA_LABEL,
    ctaHref: '/pricing',
    note: TRIAL_NOTE,
    moreLabel: 'Poznaj doradcę kariery',
    moreHref: '/assistant',
  },
  market: {
    eyebrow: 'Analiza rynku pracy',
    title: 'Rynek czeka na Twój ruch',
    text: 'Raport dla Twojej ścieżki zamiast zgadywania, czy zmiana ma sens.',
    bullets: [
      'Widełki od juniora do leada',
      'Trudność wejścia do zawodu',
      'Lista brakujących kompetencji',
    ],
    ctaLabel: TRIAL_CTA_LABEL,
    ctaHref: '/pricing',
    note: TRIAL_NOTE,
    moreLabel: 'Zobacz analizę rynku',
    moreHref: '/market-analysis',
  },
  salary: {
    eyebrow: 'Analiza rynku pracy',
    title: 'Wiesz już, ile dostajesz na rękę. A ile możesz?',
    text: 'Analiza rynku pokazuje widełki od juniora do leada dla Twojej ścieżki kariery.',
    bullets: [
      'Widełki od juniora do leada',
      'Trudność wejścia do zawodu',
      'Lista brakujących kompetencji',
    ],
    ctaLabel: TRIAL_CTA_LABEL,
    ctaHref: '/pricing',
    note: TRIAL_NOTE,
    moreLabel: 'Zobacz analizę rynku',
    moreHref: '/market-analysis',
  },
};

const PROMO_BY_BLOG_CATEGORY: Record<BlogCategorySlug, PromoVariant> = {
  cv: 'cv',
  praca: 'cv',
  kariera: 'career',
  'rynek-pracy': 'market',
};

/** Promo matched to the article topic. Unknown categories get the free CV offer. */
export const getPromoVariantForCategory = (category: string): PromoVariant =>
  PROMO_BY_BLOG_CATEGORY[category as BlogCategorySlug] ?? 'cv';
