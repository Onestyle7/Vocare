import type { Metadata } from 'next';

import { JsonLd } from '@/components/seo/JsonLd';
import { buildMarketingMetadata } from '@/features/marketing/utils/metadata';
import { buildPageBreadcrumbJsonLd } from '@/features/marketing/utils/structuredData';

import Footer from '../assistant/components/Footer';
import TrustScore from '../assistant/components/TrustScore';
import Features from './components/Features';
import Hero from './components/Hero';

export const metadata: Metadata = buildMarketingMetadata({
  path: '/market-analysis',
  title: 'Analiza Rynku Pracy AI',
  description:
    'Poznaj realne widełki płacowe, trendy rynkowe i brakujące kompetencje. Raport Vocare analizuje trudność wejścia i perspektywy dla Twojej ścieżki zawodowej.',
  ogAlt: 'Analiza Rynku Pracy AI - Vocare',
});

const page = () => {
  return (
    <div>
      <JsonLd data={buildPageBreadcrumbJsonLd('Analiza rynku pracy', '/market-analysis')} />
      <Hero />
      <Features />
      <TrustScore />
      <Footer />
    </div>
  );
};

export default page;
