import type { Metadata } from 'next';

import { toAbsoluteUrl } from '@/features/blog/utils/blogUtils';

import Footer from '../assistant/components/Footer';
import TrustScore from '../assistant/components/TrustScore';
import Features from './components/Features';
import Hero from './components/Hero';

const title = 'Analiza Rynku Pracy AI | Vocare';
const description =
  'Poznaj realne widełki płacowe, trendy rynkowe i brakujące kompetencje. Raport Vocare analizuje trudność wejścia i perspektywy dla Twojej ścieżki zawodowej.';
const ogImage = toAbsoluteUrl('/metadata/og-image.png');

export const metadata: Metadata = {
  title: 'Analiza Rynku Pracy AI',
  description,
  alternates: {
    canonical: '/market-analysis',
  },
  openGraph: {
    title,
    description,
    url: '/market-analysis',
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: 'Analiza Rynku Pracy AI - Vocare',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [ogImage],
  },
};

const page = () => {
  return (
    <div>
      <Hero />
      <Features />
      <TrustScore />
      <Footer />
    </div>
  );
};

export default page;
