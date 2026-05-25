import Features from './components/Features';
import Hero from './components/Hero';

const page = () => {
  return (
    <div className="font-poppins w-full overflow-x-hidden">
      <Hero />
      <Features />
    </div>
  );
};

export default page;
