import type { Metadata } from 'next';

import Footer from './assistant/components/Footer';
import TrustScore from './assistant/components/TrustScore';
import Features from './main-components/Features';
import Hero from './main-components/Hero';
import HowItWorks from './main-components/HowItWorks';
import Pricing from './main-components/Pricing';
import ProductShowcase from './main-components/product-showcase/ProductShowcase';

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
        <ProductShowcase />
        <Features />
        <HowItWorks />
        <TrustScore />
        <Pricing />
        <Footer />
      </main>
    </>
  );
}
