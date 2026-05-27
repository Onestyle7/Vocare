import Features from './components/Features';
import Hero from './components/Hero';
import Personalization from './components/Personalization';

const page = () => {
  return (
    <div className="font-poppins w-full overflow-x-hidden">
      <Hero />
      <Features />
      <Personalization />
    </div>
  );
};

export default page;
