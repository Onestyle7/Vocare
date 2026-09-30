import { ChartNoAxesCombined, Compass, FileText, Route } from 'lucide-react';

// Capabilities verified in assistant, market-analysis, roadmap and resume DAL/UI.
// The copy follows one made-up user (see persona.ts) through the four steps; previews use
// illustrative data, never a request to a paid generation endpoint.
// Colors: accent fills the tab and label icon, soft backs the preview, tint backs chips,
// ink is the accessible text color on white and tint.
export const productFeatures = [
  {
    id: 'direction',
    label: 'Kierunek',
    eyebrow: 'Doradca kariery',
    title: 'Marta odkrywa nowy kierunek',
    description:
      'Po 4 latach w obsłudze klienta doradca AI analizuje jej profil i wskazuje Customer Success Managera. Z uzasadnieniem, kolejnymi krokami i alternatywami.',
    icon: Compass,
    href: '/assistant',
    cta: 'Poznaj doradcę kariery',
    screen: 'Doradca kariery AI: rekomendacja dla Marty',
    colors: { accent: '#4890e3', soft: '#c3dffe', tint: '#e6f0fd', ink: '#1a5fb4' },
  },
  {
    id: 'market',
    label: 'Rynek',
    eyebrow: 'Analiza rynku',
    title: 'Sprawdza rynek, zanim zacznie naukę',
    description:
      'Widzi widełki od juniora do leada i to, jak trudno wejść do zawodu. Od gotowości dzielą ją trzy umiejętności i kilka miesięcy nauki.',
    icon: ChartNoAxesCombined,
    href: '/market-analysis',
    cta: 'Zobacz analizę rynku',
    screen: 'Analiza rynku: Customer Success Manager',
    colors: { accent: '#14c1b6', soft: '#bdefea', tint: '#e2f7f5', ink: '#0b6f69' },
  },
  {
    id: 'roadmap',
    label: 'Plan',
    eyebrow: 'Twoja roadmapa',
    title: 'Dostaje plan na trzy miesiące',
    description:
      'Roadmapa rozpisuje drogę do celu na etapy i zadania, także te brakujące umiejętności. Marta oznacza kolejne kroki i widzi swój postęp.',
    icon: Route,
    href: '/roadmap',
    cta: 'Poznaj roadmapę',
    screen: 'Roadmapa Marty na trzy miesiące',
    colors: { accent: '#997edf', soft: '#ddd3fa', tint: '#efeafc', ink: '#5f45b8' },
  },
  {
    id: 'resume',
    label: 'CV',
    eyebrow: 'Kreator CV',
    title: 'Kończy z CV pod konkretną ofertę',
    description:
      'Wkleja ogłoszenie, a kreator buduje CV z jej profilu pod tę ofertę. Audyt jakości ocenia dokument i dopasowanie do stanowiska.',
    icon: FileText,
    href: '/resume-creator',
    cta: 'Zobacz kreator CV',
    screen: 'CV Marty dopasowane do oferty',
    colors: { accent: '#e07bdb', soft: '#f7d4f5', tint: '#fcebfb', ink: '#9b2f95' },
  },
] as const;

export type ProductFeature = (typeof productFeatures)[number];
export type ProductFeatureId = ProductFeature['id'];
