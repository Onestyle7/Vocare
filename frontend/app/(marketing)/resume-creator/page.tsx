import type { Metadata } from 'next';

import { JsonLd } from '@/components/seo/JsonLd';
import { buildMarketingMetadata } from '@/features/marketing/utils/metadata';
import { buildPageBreadcrumbJsonLd } from '@/features/marketing/utils/structuredData';

import Footer from '../assistant/components/Footer';
import TrustScore from '../assistant/components/TrustScore';
import Benefits from './components/Benefits';
import Features from './components/Features';
import Hero from './components/Hero';

export const metadata: Metadata = buildMarketingMetadata({
  path: '/resume-creator',
  title: 'Kreator CV z AI i audytem ATS',
  description:
    'Stwórz profesjonalne CV odporne na systemy ATS. Kreator Vocare wyróżnia kluczowe osiągnięcia i optymalizuje dokument pod wymagania rekruterów.',
  ogAlt: 'Kreator CV z AI i audytem ATS - Vocare',
});

const page = () => {
  return (
    <div className="w-full overflow-x-hidden">
      <JsonLd data={buildPageBreadcrumbJsonLd('Kreator CV', '/resume-creator')} />
      <Hero />
      <Features />
      <Benefits />
      <TrustScore />
      <Footer />
    </div>
  );
};

export default page;
