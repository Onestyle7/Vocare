"use client";

import AboutCards from '@/components/SupportComponents/SectionsComponents/AboutCards';
import Faq from '@/components/SupportComponents/SectionsComponents/Faq';
import Features from '@/components/SupportComponents/SectionsComponents/Features';
import Footer from '@/components/SupportComponents/SectionsComponents/Footer';
import Header from '@/components/SupportComponents/SectionsComponents/Header';
import HeroTweak from '@/components/SupportComponents/SectionsComponents/HeroTweak';
import MobileFeature from '@/components/SupportComponents/SectionsComponents/MobileFeature';

const page = () => {
  return (
    <main className="mx-auto max-w-7xl overflow-x-hidden">
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
