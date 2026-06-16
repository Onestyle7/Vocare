import Footer from '../assistant/components/Footer';
import TrustScore from '../assistant/components/TrustScore';
import Benefits from './components/Benefits';
import Features from './components/Features';
import Hero from './components/Hero';

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
