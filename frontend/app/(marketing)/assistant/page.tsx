import type { Metadata } from 'next';
import React from 'react';

import { JsonLd } from '@/components/seo/JsonLd';
import { buildMarketingMetadata } from '@/features/marketing/utils/metadata';
import { buildPageBreadcrumbJsonLd } from '@/features/marketing/utils/structuredData';

import Approach from './components/Approach';
import Features from './components/Features';
import Footer from './components/Footer';
import Hero from './components/Hero';
import TrustScore from './components/TrustScore';

export const metadata: Metadata = buildMarketingMetadata({
  path: '/assistant',
  title: 'Inteligentny Asystent Kariery AI',
  description:
    'Zaplanuj całą karierę z AI. Algorytm Vocare analizuje tysiące scenariuszy, pomagając stworzyć precyzyjny i wieloletni plan Twojego rozwoju zawodowego.',
  ogAlt: 'Inteligentny Asystent Kariery AI - Vocare',
});

const page = () => {
  return (
    <div>
      <JsonLd data={buildPageBreadcrumbJsonLd('Doradca kariery AI', '/assistant')} />
      <Hero />
      <Features />
      <Approach />
      <TrustScore />
      <Footer />
    </div>
  );
};

export default page;
