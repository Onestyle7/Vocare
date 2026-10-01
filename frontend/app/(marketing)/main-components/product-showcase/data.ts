import { ChartNoAxesCombined, Compass, FileText, Route } from 'lucide-react';

// Capabilities verified in assistant, market-analysis, roadmap and resume DAL/UI.
// The copy follows one made-up user (see persona.ts) through the four steps; previews use
// illustrative data, never a request to a paid generation endpoint.
// Colors are tuned for the dark page: accent fills the tab and label icon and tints the preview
// glow; accent to light is the gradient on the highlighted part of the title.
export const productFeatures = [
  {
    id: 'direction',
    label: 'Kierunek',
    eyebrow: 'Doradca kariery',
    title: 'Marta odkrywa nowy kierunek',
    highlight: 'nowy kierunek',
    description:
      'Po 4 latach w obsłudze klienta doradca AI analizuje jej profil i wskazuje Customer Success Managera. Z uzasadnieniem, kolejnymi krokami i alternatywami.',
    icon: Compass,
    href: '/assistant',
    cta: 'Poznaj doradcę kariery',
    screen: 'Doradca kariery AI: rekomendacja dla Marty',
    colors: { accent: '#8491fe', light: '#c7a9fe' },
  },
  {
    id: 'market',
    label: 'Rynek',
    eyebrow: 'Analiza rynku',
    title: 'Sprawdza rynek, zanim zacznie naukę',
    highlight: 'rynek',
    description:
      'Widzi widełki od juniora do leada i to, jak trudno wejść do zawodu. Od gotowości dzielą ją trzy umiejętności i kilka miesięcy nauki.',
    icon: ChartNoAxesCombined,
    href: '/market-analysis',
    cta: 'Zobacz analizę rynku',
    screen: 'Analiza rynku: Customer Success Manager',
    colors: { accent: '#3dd6c6', light: '#a7f3d0' },
  },
  {
    id: 'roadmap',
    label: 'Plan',
    eyebrow: 'Twoja roadmapa',
    title: 'Dostaje plan na trzy miesiące',
    highlight: 'plan na trzy miesiące',
    description:
      'Roadmapa rozpisuje drogę do celu na etapy i zadania, także te brakujące umiejętności. Marta oznacza kolejne kroki i widzi swój postęp.',
    icon: Route,
    href: '/roadmap',
    cta: 'Poznaj roadmapę',
    screen: 'Roadmapa Marty na trzy miesiące',
    colors: { accent: '#a78bfa', light: '#e9d5ff' },
  },
  {
    id: 'resume',
    label: 'CV',
    eyebrow: 'Kreator CV',
    title: 'Kończy z CV pod konkretną ofertę',
    highlight: 'CV pod konkretną ofertę',
    description:
      'Wkleja ogłoszenie, a kreator buduje CV z jej profilu pod tę ofertę. Audyt jakości ocenia dokument i dopasowanie do stanowiska.',
    icon: FileText,
    href: '/resume-creator',
    cta: 'Zobacz kreator CV',
    screen: 'CV Marty dopasowane do oferty',
    colors: { accent: '#f28ad2', light: '#fbcfe8' },
  },
] as const;

export type ProductFeature = (typeof productFeatures)[number];
export type ProductFeatureId = ProductFeature['id'];
