'use client';

import AboutCards from '@/components/SupportComponents/SectionsComponents/AboutCards';
import CardFeature from '@/components/SupportComponents/SectionsComponents/CardSwapper';
import Faq from '@/components/SupportComponents/SectionsComponents/Faq';
import Features from '@/components/SupportComponents/SectionsComponents/Features';
import Footer from '@/components/SupportComponents/SectionsComponents/Footer';
import Header from '@/components/SupportComponents/SectionsComponents/Header';
import HeroTweak from '@/components/SupportComponents/SectionsComponents/HeroTweak';
import MobileFeature from '@/components/SupportComponents/SectionsComponents/MobileFeature';

const page = () => {
  return (
    <>
      <main className="mx-auto max-w-7xl cursor-none max-md:overflow-x-hidden">
        <Header />
        <HeroTweak />
        <AboutCards />
        {/* <Features /> */}
        <MobileFeature />
        <CardFeature />
        <Faq />
        <Footer />
      </main>
    </>
  );
};

export default page;
