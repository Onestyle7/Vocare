import Footer from '../assistant/components/Footer';
import TrustScore from '../assistant/components/TrustScore';
import Features from './components/Features';
import Hero from './components/Hero';
import Personalization from './components/Personalization';

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
