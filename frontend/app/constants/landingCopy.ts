import { Language } from '@/lib/contexts/LanguageContext';
import { plus } from '.';

type LandingCopy = {
  header: {
    signIn: string;
    languageLabel: string;
  };
  hero: {
    headline: { line1: string; line2: string };
    description: string;
    cta: string;
    spinningText: string;
    meetLabel: string;
    offerTitle: string;
    offerSubtitle: string;
  };
  aboutCards: Array<{
    title: string;
    description: string;
    img?: string;
  }>;
  cardFeature: {
    eyebrow: string;
    title: string;
    cta: string;
    cards: Array<{ label: string }>;
  };
  mobileFeature: {
    eyebrow: string;
    title: string;
    badge: string;
    secondaryTitle: string;
    cta: string;
  };
  faq: {
    marquee: string;
  };
  footer: {
    primaryCta: string;
    newsletterTitle: string;
    newsletterPlaceholder: string;
    newsletterCopy: string;
    socialLabel: string;
    pagesLabel: string;
    contactLabel: string;
    reachUs: string;
    bottomTagline: string;
  };
};

export const landingCopy: Record<Language, LandingCopy> = {
  pl: {
    header: {
      signIn: 'Zaloguj się',
      languageLabel: 'Język',
    },
    hero: {
      headline: { line1: 'Odblokuj swój', line2: 'rozwój' },
      description:
        'Vocare to doradca kariery zasilany AI, który zamienia Twój profil w klarowne kierunki kariery, sygnały z rynku i gotowe do ATS CV. Dostajesz konkretny plan działania na dziś.',
      cta: 'Odbierz plan',
      spinningText: 'poznaj więcej • zarabiaj więcej • rozwijaj się •',
      meetLabel: 'Poznaj nas',
      offerTitle: 'Co zyskasz?',
      offerSubtitle: 'Kierunki kariery, wiedza o rynku i gotowe CV ATS',
    },
    aboutCards: [
      {
        title: 'Ścieżki kariery',
        description:
          'Najlepsze dopasowania pod kątem zgodności, wysiłku i potencjału wynagrodzenia – wiesz, co zrobić już dziś.',
        img: plus,
      },
      {
        title: 'Inteligencja rynkowa',
        description: 'Trendy, kluczowe umiejętności, zatrudnienie i widełki płac w Twojej branży.',
        img: plus,
      },
      {
        title: 'CV gotowe pod ATS',
        description: 'Eksport czystego CV pod wybraną ścieżkę, zgodnego z ATS.',
        img: plus,
      },
    ],
    cardFeature: {
      eyebrow: 'Wszystkie narzędzia razem.',
      title: 'Kompaktowe centrum kompetencji.',
      cta: 'Odbierz plan',
      cards: [{ label: 'Asystent' }, { label: 'Rynek' }, { label: 'CV' }],
    },
    mobileFeature: {
      eyebrow: 'Zawsze pod ręką.',
      title: 'Twój doradca zawsze z Tobą.',
      badge: 'Aplikacje',
      secondaryTitle: 'Wypróbuj Vocare. Za darmo.',
      cta: 'Dostępne wkrótce',
    },
    faq: {
      marquee: 'Gotowy na zmianę kariery?',
    },
    footer: {
      primaryCta: 'Wypróbuj Vocare',
      newsletterTitle: 'Nie przegap kolejnych aktualizacji',
      newsletterPlaceholder: 'Twój email',
      newsletterCopy:
        'Podając email, jako pierwszy dowiesz się o nowościach w Vocare. Wypisz się w dowolnym momencie.',
      socialLabel: 'SOCIAL',
      pagesLabel: 'STRONY',
      contactLabel: 'KONTAKT',
      reachUs: 'Napisz do nas',
      bottomTagline: 'Znajdź swoją drogę',
    },
  },
  en: {
    header: {
      signIn: 'Sign in',
      languageLabel: 'Language',
    },
    hero: {
      headline: { line1: 'Unlock your', line2: 'growth' },
      description:
        'Vocare is an AI career advisor that turns your profile into clear career bets, live market signals, and an ATS-ready resume—so you know what to do next today.',
      cta: 'Get my plan',
      spinningText: 'learn more • earn more • grow more •',
      meetLabel: 'Meet us',
      offerTitle: 'What will you get?',
      offerSubtitle: 'Career outcomes, market insight & ATS-ready resume',
    },
    aboutCards: [
      {
        title: 'Career outcomes',
        description:
          'Your best career matches ranked by compatibility, effort, and salary outlook—so you know what to do next today.',
        img: plus,
      },
      {
        title: 'Market intelligence',
        description: 'Trends, in-demand skills, employment rates, and salary ranges for your role.',
        img: plus,
      },
      {
        title: 'ATS resume',
        description: 'Export a clean, ATS-ready resume tailored to your chosen path.',
        img: plus,
      },
    ],
    cardFeature: {
      eyebrow: 'All your tools together.',
      title: 'Compact powerhouse.',
      cta: 'Get my plan',
      cards: [{ label: 'Assistant' }, { label: 'Market' }, { label: 'Resume' }],
    },
    mobileFeature: {
      eyebrow: 'Always in your pocket.',
      title: 'Your advisor always with you.',
      badge: 'Apps',
      secondaryTitle: 'Try Vocare. For free.',
      cta: 'Available soon',
    },
    faq: {
      marquee: 'Ready to change your life?',
    },
    footer: {
      primaryCta: 'Try Vocare',
      newsletterTitle: 'Never miss what’s next',
      newsletterPlaceholder: 'Your email',
      newsletterCopy:
        'By submitting your email, you’ll be the first to know about upcoming updates for Vocare. You can unsubscribe at any time.',
      socialLabel: 'SOCIAL',
      pagesLabel: 'PAGES',
      contactLabel: 'CONTACT',
      reachUs: 'Reach us',
      bottomTagline: 'Find Your Path',
    },
  },
};
