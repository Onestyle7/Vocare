import type { Metadata } from 'next';

import { toAbsoluteUrl } from '@/features/blog/utils/blogUtils';

import Footer from '../assistant/components/Footer';
import TrustScore from '../assistant/components/TrustScore';
import Features from './components/Features';
import Hero from './components/Hero';
import Personalization from './components/Personalization';

const title = 'Interaktywna Mapa Rozwoju Kariery | Vocare';
const description =
  'Przekształć cele zawodowe w konkretne etapy. Wygeneruj spersonalizowaną roadmapę kariery z AI w Vocare i rozwijaj kompetencje krok po kroku.';
const ogImage = toAbsoluteUrl('/metadata/og-image.png');

export const metadata: Metadata = {
  title: 'Interaktywna Mapa Rozwoju Kariery',
  description,
  alternates: {
    canonical: '/roadmap',
  },
  openGraph: {
    title,
    description,
    url: '/roadmap',
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: 'Interaktywna Mapa Rozwoju Kariery - Vocare',
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
    <div className="font-poppins w-full overflow-x-hidden">
      <Hero />
      <Features />
      <Personalization />
      <TrustScore />
      <Footer />
    </div>
  );
};

export default page;
