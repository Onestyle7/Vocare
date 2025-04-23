import HeroTweak from '@/components/SectionsComponents/HeroTweak';
import Header from '@/components/SectionsComponents/Header';
import React from 'react';
import MobileFeature from '@/components/SectionsComponents/MobileFeature';
import Faq from '@/components/SectionsComponents/Faq';
import Footer from '@/components/SectionsComponents/Footer';
import AboutCards from '@/components/SectionsComponents/AboutCards';
import Features from '@/components/SectionsComponents/Features';

const page = () => {
  return (
    <main className='max-w-7xl mx-auto overflow-x-hidden'>
      <Header />
      <HeroTweak />
      <AboutCards />
      <Features />
      <MobileFeature />
      <Faq />
      <Footer />
    </main>
  );
};

export default page;
