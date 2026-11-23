import type { Metadata } from 'next';

import { JsonLd } from '@/components/seo/JsonLd';
import { buildMarketingMetadata } from '@/features/marketing/utils/metadata';
import { buildPageBreadcrumbJsonLd } from '@/features/marketing/utils/structuredData';

import Footer from '../assistant/components/Footer';
import TrustScore from '../assistant/components/TrustScore';
import Features from './components/Features';
import Hero from './components/Hero';
import Personalization from './components/Personalization';

export const metadata: Metadata = buildMarketingMetadata({
  path: '/roadmap',
  title: 'Interaktywna Mapa Rozwoju Kariery',
  description:
    'Przekształć cele zawodowe w konkretne etapy. Wygeneruj spersonalizowaną roadmapę kariery z AI w Vocare i rozwijaj kompetencje krok po kroku.',
  ogAlt: 'Interaktywna Mapa Rozwoju Kariery - Vocare',
});

const page = () => {
  return (
    <div className="font-poppins w-full overflow-x-hidden">
      <JsonLd data={buildPageBreadcrumbJsonLd('Roadmapa kariery', '/roadmap')} />
      <Hero />
      <Features />
      <Personalization />
      <TrustScore />
      <Footer />
    </div>
  );
};

export default page;
