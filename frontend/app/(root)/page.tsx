'use client';

import AboutCards from '@/components/SectionsComponents/AboutCards';
import CardFeature from '@/components/SectionsComponents/CardSwapper';
import Faq from '@/components/SectionsComponents/Faq';
import Footer from '@/components/SectionsComponents/Footer';
import Header from '@/components/SectionsComponents/Header';
import HeroTweak from '@/components/SectionsComponents/HeroTweak';
import MobileFeature from '@/components/SectionsComponents/MobileFeature';
import MobileFeatureImprovements from '@/components/SectionsComponents/MobileFeatureImprovements';

const page = () => {
  return (
    <>
      <main className="mx-auto max-w-7xl cursor-none">
        <Header />
        <HeroTweak />
        <AboutCards />
        {/* <Features /> */}
        {/* <MobileFeature /> */}
        <MobileFeatureImprovements />
        <CardFeature />
        <Faq />
        <Footer />
      </main>
    </>
  );
};

export default page;
