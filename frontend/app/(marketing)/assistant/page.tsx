import React from 'react';

import Approach from './components/Approach';
import Features from './components/Features';
import Footer from './components/Footer';
import Hero from './components/Hero';
import TrustScore from './components/TrustScore';

const page = () => {
  // Assistant LP
  return (
    <div>
      <Hero />
      <Features />
      <Approach />
      <TrustScore />
      <Footer />
    </div>
  );
};

export default page;
