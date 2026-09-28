import { ChartNoAxesCombined, Compass, FileText, Route } from 'lucide-react';

// Capabilities verified in assistant, market-analysis, roadmap and resume DAL/UI.
// Previews use illustrative data, never a request to a paid generation endpoint.
// Colors: accent fills the tab and label icon, soft backs the preview, tint backs chips,
// ink is the accessible text color on white and tint.
export const productFeatures = [
  {
    id: 'direction',
    label: 'Kierunek',
    eyebrow: 'Doradca kariery',
    title: 'Zobacz, dokąd prowadzi Twoje doświadczenie',
    description:
      'Porównaj ścieżki dopasowane do Twojego profilu. Zobacz uzasadnienie, potrzebne umiejętności i kolejne kroki.',
    icon: Compass,
    href: '/assistant',
    cta: 'Poznaj doradcę kariery',
    screen: 'Rekomendacje zawodowe',
    colors: { accent: '#4890e3', soft: '#c3dffe', tint: '#e6f0fd', ink: '#1a5fb4' },
  },
  {
    id: 'market',
    label: 'Rynek',
    eyebrow: 'Analiza rynku',
    title: 'Sprawdź rynek, zanim wybierzesz cel',
    description:
      'Porównaj wynagrodzenia na różnych poziomach doświadczenia. Sprawdź, które kompetencje warto rozwinąć przed wejściem do branży.',
    icon: ChartNoAxesCombined,
    href: '/market-analysis',
    cta: 'Zobacz analizę rynku',
    screen: 'Analiza rynku pracy',
    colors: { accent: '#14c1b6', soft: '#bdefea', tint: '#e2f7f5', ink: '#0b6f69' },
  },
  {
    id: 'roadmap',
    label: 'Plan',
    eyebrow: 'Twoja roadmapa',
    title: 'Zamień wybrany kierunek w plan działania',
    description:
      'Wybierz ścieżkę i czas na naukę. Otrzymasz mapę etapów z zadaniami. Oznaczaj postępy i sprawdzaj, co dalej.',
    icon: Route,
    href: '/roadmap',
    cta: 'Poznaj roadmapę',
    screen: 'Roadmapa rozwoju',
    colors: { accent: '#997edf', soft: '#ddd3fa', tint: '#efeafc', ink: '#5f45b8' },
  },
  {
    id: 'resume',
    label: 'CV',
    eyebrow: 'Kreator CV',
    title: 'Przygotuj CV do konkretnej oferty',
    description:
      'Wklej ofertę, a Vocare przygotuje CV z Twojego profilu. Uzupełnij treść w edytorze i pobierz gotowy dokument.',
    icon: FileText,
    href: '/resume-creator',
    cta: 'Zobacz kreator CV',
    screen: 'CV dopasowane do oferty',
    colors: { accent: '#e07bdb', soft: '#f7d4f5', tint: '#fcebfb', ink: '#9b2f95' },
  },
] as const;

export type ProductFeature = (typeof productFeatures)[number];
export type ProductFeatureId = ProductFeature['id'];
