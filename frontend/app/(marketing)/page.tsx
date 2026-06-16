import Footer from './assistant/components/Footer';
import TrustScore from './assistant/components/TrustScore';
import Features from './main-components/Features';
import Hero from './main-components/Hero';
import HowItWorks from './main-components/HowItWorks';

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
