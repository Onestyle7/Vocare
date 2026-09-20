import Footer from './assistant/components/Footer';
import TrustScore from './assistant/components/TrustScore';
import Features from './main-components/Features';
import Hero from './main-components/Hero';
import HowItWorks from './main-components/HowItWorks';
import Pricing from './main-components/Pricing';
// import ProductExample from './main-components/ProductExample';

export default function MainPage() {
  return (
    <>
      <main className="font-poppins w-full overflow-x-hidden">
        <Hero />
        {/* <ProductExample /> */}
        <Features />
        <HowItWorks />
        <TrustScore />
        <Pricing />
        <Footer />
      </main>
    </>
  );
}
