import type { Metadata } from 'next';

import Footer from './assistant/components/Footer';
import TrustScore from './assistant/components/TrustScore';
import Features from './main-components/Features';
import Hero from './main-components/Hero';
import HowItWorks from './main-components/HowItWorks';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

export default function MainPage() {
  return (
    <>
      <main className="font-poppins w-full overflow-x-hidden">
        <Hero />
        <Features />
        <HowItWorks />
        <TrustScore />
        <Footer />
      </main>
    </>
  );
}
