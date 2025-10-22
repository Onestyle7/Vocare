import React from 'react';
import SpotlightCard from '../SpotlightCard/SpotlightCard';
import Link from 'next/link';
import Image from 'next/image';
import { upper_arrow } from '@/app/constants';
import AnimatedContent from '../AnimatedContent/AnimatedContent';
import Section from '../SupportComponents/Section';

const GenerateRecommendationFail = () => {
  return (
    <Section
      className="relative -mt-[5.25rem] pt-[7.5rem]"
      crosses
      crossesOffset="lg:translate-y-[7.5rem]"
      customPaddings
      id="pricing"
    >
      <div className="mx-10 flex flex-col items-center space-y-10 lg:border-t">
        <div className="mt-10 flex flex-col items-center justify-center">
          <h1 className="font-poppins font-korbin text-3xl font-bold max-md:text-center">
            Get your career plan in 60 seconds.
          </h1>
          <p className="font-poppins text-md mt-4 text-gray-500">It&apos;s that simple.</p>
        </div>
        <div className="flex flex-col max-lg:space-y-3 lg:flex-row lg:space-x-4">
          <AnimatedContent
            distance={150}
            direction="horizontal"
            reverse={false}
            duration={1.2}
            initialOpacity={0.2}
            animateOpacity
            scale={1}
            threshold={0.2}
            delay={0.3}
          >
            <SpotlightCard className="bg-muted h-[300px] w-[350px]">
              <div className="font-poppins flex h-full flex-col items-center justify-center">
                <div className="w-full items-center justify-start">
                  <p className="text-muted-foreground text-xl">1.</p>
                </div>
                <div className="mt-4 h-full w-full items-center justify-start">
                  <p className="text-muted-foreground text-lg">
                    Start by updating <b>Your profile</b>. Simply use the <i>profile</i> button
                  </p>
                </div>
                <div className="w-full">
                  <Link
                    href="/profile"
                    className="text-md text-muted-foreground group flex flex-row items-center transition-all duration-300"
                  >
                    Navigate to profile
                    <Image
                      src={upper_arrow}
                      alt="arrow"
                      width={24}
                      height={24}
                      className="ml-1 scale-90 opacity-50 transition-transform duration-300 group-hover:translate-x-2 dark:invert"
                    />
                  </Link>
                </div>
              </div>
            </SpotlightCard>
          </AnimatedContent>
          {/* <Image src={curved1} alt='curved' width={324} height={324} className='invert opacity-30'/> */}
          <AnimatedContent
            distance={150}
            direction="horizontal"
            reverse={false}
            duration={1.2}
            initialOpacity={0.2}
            animateOpacity
            scale={1}
            threshold={0.2}
            delay={0.6}
          >
            <SpotlightCard className="bg-muted h-[300px] w-[350px]">
              <div className="font-poppins flex h-full flex-col items-center justify-center">
                <div className="w-full items-center justify-start">
                  <p className="text-muted-foreground text-xl">2.</p>
                </div>
                <div className="mt-4 h-full w-full items-center justify-start">
                  <p className="text-muted-foreground text-lg">
                    After updating Your profile, you&apos;ll gain access to every <br />{' '}
                    <b>AI tool</b> that Vocare offers.
                  </p>
                </div>
                <div className="w-full">
                  <Link
                    href="/profile"
                    className="text-md text-muted-foreground group flex flex-row items-center transition-all duration-300"
                  >
                    Learn how we protect data
                    <Image
                      src={upper_arrow}
                      alt="arrow"
                      width={24}
                      height={24}
                      className="ml-1 scale-90 opacity-50 transition-transform duration-300 group-hover:translate-x-2 dark:invert"
                    />
                  </Link>
                </div>
              </div>
            </SpotlightCard>
          </AnimatedContent>
          <AnimatedContent
            distance={150}
            direction="horizontal"
            reverse={false}
            duration={1.2}
            initialOpacity={0.2}
            animateOpacity
            scale={1}
            threshold={0.2}
            delay={0.9}
          >
            <SpotlightCard className="bg-muted h-[300px] w-[350px]">
              <div className="font-poppins flex h-full flex-col items-center justify-center">
                <div className="w-full items-center justify-start">
                  <p className="text-muted-foreground text-xl">3.</p>
                </div>
                <div className="mt-4 h-full w-full items-center justify-start">
                  <p className="text-muted-foreground text-lg">
                    Turn your plan into a clean, <b>ATS-friendly</b> resume. Save versions, tailor
                    to roles, and export instantly.
                  </p>
                </div>
                <div className="w-full">
                  <Link
                    href="/profile"
                    className="text-md text-muted-foreground group flex flex-row items-center transition-all duration-300"
                  >
                    Open Resume Builder
                    <Image
                      src={upper_arrow}
                      alt="arrow"
                      width={24}
                      height={24}
                      className="ml-1 scale-90 opacity-50 transition-transform duration-300 group-hover:translate-x-2 dark:invert"
                    />
                  </Link>
                </div>
              </div>
            </SpotlightCard>
          </AnimatedContent>
        </div>
      </div>
    </Section>
  );
};

export default GenerateRecommendationFail;
