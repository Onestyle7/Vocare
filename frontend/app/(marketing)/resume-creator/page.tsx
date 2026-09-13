import type { Metadata } from 'next';

import { toAbsoluteUrl } from '@/features/blog/utils/blogUtils';

import Footer from '../assistant/components/Footer';
import TrustScore from '../assistant/components/TrustScore';
import Benefits from './components/Benefits';
import Features from './components/Features';
import Hero from './components/Hero';

const title = 'Kreator CV z AI i audytem ATS | Vocare';
const description =
  'Stwórz profesjonalne CV odporne na systemy ATS. Kreator Vocare wyróżnia kluczowe osiągnięcia i optymalizuje dokument pod wymagania rekruterów.';
const ogImage = toAbsoluteUrl('/metadata/og-image.png');

export const metadata: Metadata = {
  title: 'Kreator CV z AI i audytem ATS',
  description,
  alternates: {
    canonical: '/resume-creator',
  },
  openGraph: {
    title,
    description,
    url: '/resume-creator',
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: 'Kreator CV z AI i audytem ATS - Vocare',
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
    <div className="w-full overflow-x-hidden">
      <Hero />
      <Features />
      <Benefits />
      <TrustScore />
      <Footer />
    </div>
  );
};

export default page;
