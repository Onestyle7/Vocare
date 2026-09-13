import type { Metadata } from 'next';
import React from 'react';

import { toAbsoluteUrl } from '@/features/blog/utils/blogUtils';

import Approach from './components/Approach';
import Features from './components/Features';
import Footer from './components/Footer';
import Hero from './components/Hero';
import TrustScore from './components/TrustScore';

const title = 'Inteligentny Asystent Kariery AI | Vocare';
const description =
  'Zaplanuj całą karierę z AI. Algorytm Vocare analizuje tysiące scenariuszy, pomagając stworzyć precyzyjny i wieloletni plan Twojego rozwoju zawodowego.';
const ogImage = toAbsoluteUrl('/metadata/og-image.png');

export const metadata: Metadata = {
  title: 'Inteligentny Asystent Kariery AI',
  description,
  alternates: {
    canonical: '/assistant',
  },
  openGraph: {
    title,
    description,
    url: '/assistant',
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: 'Inteligentny Asystent Kariery AI - Vocare',
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
      <Approach />
      <TrustScore />
      <Footer />
    </div>
  );
};

export default page;
