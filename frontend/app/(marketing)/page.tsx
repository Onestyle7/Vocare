import type { Metadata } from 'next';

import { buildMarketingMetadata } from '@/features/marketing/utils/metadata';
import {
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from '@/features/marketing/utils/structuredData';

import Footer from './assistant/components/Footer';
import TrustScore from './assistant/components/TrustScore';
import Features from './main-components/Features';
import Hero from './main-components/Hero';
import HowItWorks from './main-components/HowItWorks';
import LatestArticles from './main-components/LatestArticles';
import Pricing from './main-components/Pricing';
import ProductShowcase from './main-components/product-showcase/ProductShowcase';

export const metadata: Metadata = buildMarketingMetadata({
  path: '/',
  title: 'Vocare – AI doradca kariery, analiza rynku pracy i kreator CV',
  description:
    'Vocare pomaga odkryć Twoją ścieżkę kariery z AI. Sprawdź mocne strony, analizuj rynek i podejmuj trafne decyzje zawodowe na podstawie danych.',
  ogAlt: 'Vocare – AI doradca kariery',
  absoluteTitle: true,
});

export default function MainPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebSiteJsonLd()) }}
      />
      <main className="font-poppins w-full overflow-x-hidden">
        <Hero />
        <ProductShowcase />
        <Features />
        <HowItWorks />
        <TrustScore />
        <Pricing />
        <LatestArticles />
        <Footer />
      </main>
    </>
  );
}
