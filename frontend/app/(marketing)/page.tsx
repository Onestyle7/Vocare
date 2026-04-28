import type { Metadata } from 'next';

import AboutCards from '@/components/SectionsComponents/AboutCards';
import CardFeature from '@/components/SectionsComponents/CardSwapper';
import Faq from '@/components/SectionsComponents/Faq';
import Footer from '@/components/SectionsComponents/Footer';
import Header from '@/components/SectionsComponents/Header';
import HeroTweak from '@/components/SectionsComponents/HeroTweak';
import MobileFeatureImprovements from '@/components/SectionsComponents/MobileFeatureImprovements';

import { toAbsoluteUrl } from '../blog/_utils/blogUtils';

export const metadata: Metadata = {
  description:
    'Vocare pomaga odkryc Twoja sciezke kariery z AI. Sprawdz mocne strony, analizuj rynek i podejmuj trafne decyzje zawodowe na podstawie danych.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    title: 'Vocare',
    description:
      'Vocare pomaga odkryc Twoja sciezke kariery z AI. Sprawdz mocne strony, analizuj rynek i podejmuj trafne decyzje zawodowe na podstawie danych.',
    url: '/',
    images: [
      {
        url: toAbsoluteUrl('/metadata/og-image.png'),
        width: 1200,
        height: 630,
        alt: 'Vocare',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vocare',
    description:
      'Vocare pomaga odkryc Twoja sciezke kariery z AI. Sprawdz mocne strony, analizuj rynek i podejmuj trafne decyzje zawodowe na podstawie danych.',
    images: [toAbsoluteUrl('/metadata/og-image.png')],
  },
};

const page = () => {
  return (
    <>
      <main className="mx-auto max-w-7xl">
        <Header />
        <HeroTweak />
        <AboutCards />
        <MobileFeatureImprovements />
        <CardFeature />
        <Faq />
        <Footer />
      </main>
    </>
  );
};

export default page;
