// Market-analysis LP

import Footer from '../assistant/components/Footer';
import TrustScore from '../assistant/components/TrustScore';
import Features from './components/Features';
import Hero from './components/Hero';

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
