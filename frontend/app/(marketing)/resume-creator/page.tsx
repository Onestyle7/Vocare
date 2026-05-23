import Benefits from './components/Benefits';
import Features from './components/Features';
import Hero from './components/Hero';

const page = () => {
  return (
    <div className="w-full overflow-x-hidden">
      <Hero />
      <Features />
      <Benefits />
    </div>
  );
};

export default page;
