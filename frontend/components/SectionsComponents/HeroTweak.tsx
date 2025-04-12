'use client';

import { useEffect, useState } from 'react';
import { lazy, Suspense } from 'react';
import Section from '../Section';
import Image from 'next/image';
import { Spinner } from '@/app/constants';
import { SpinningText } from '../magicui/spinning-text';
import CustomCursor from '../CustomCursor';
import CustomButton from '../ui/CustomButton';
import { ArrowRight } from 'lucide-react';

const LazySpline = lazy(() => import('@splinetool/react-spline'));

const HeroTweak = () => {
  const [showSpline, setShowSpline] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      const timer = setTimeout(() => {
        setShowSpline(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  return (
    <Section
      className="relative -mt-[5.25rem] cursor-none pt-[7.5rem]"
      crosses
      crossesOffset="lg:translate-y-[7.5rem]"
      customPaddings
      id="hero"
    >
      <CustomCursor />
      <div className="main-font-color relative flex h-[390px] flex-row px-[40px] lg:w-full">
        <div className="inset-0 flex w-full flex-col items-center justify-center sm:pl-[40px] md:flex-row md:justify-start md:border-t md:border-b lg:w-3/5">
          <div className="flex flex-col justify-center max-md:mb-8 lg:w-1/2 xl:items-start">
            <h1 className="text-[60px] leading-17 font-bold uppercase max-md:text-center lg:text-[78px] xl:text-[88px] 2xl:text-[108px] 2xl:leading-21">
              Unlock <br />
              Your
              <br /> growth
            </h1>
            <CustomButton
              variant="primary"
              className="group mt-4 flex cursor-none items-center justify-center overflow-hidden xl:mt-8"
            >
              <span className="flex flex-row">
                Try it out
                <ArrowRight className="ml-2 scale-75 transition-transform duration-300 group-hover:translate-x-2" />
              </span>
            </CustomButton>
          </div>
          <div className="flex h-full flex-col items-center justify-center max-md:mt-6 sm:w-full lg:w-1/2">
            <SpinningText>learn more • earn more • grow more •</SpinningText>
          </div>
        </div>
        {!isMobile && (
          <Suspense fallback={<Image src={Spinner} alt="spinner" width={60} height={60} />}>
            {showSpline && (
              <div className="inset-0 flex w-2/5 items-center border-t border-b border-l">
                <LazySpline
                  scene="https://prod.spline.design/mZBrYNcnoESGlTUG/scene.splinecode"
                  className="flex items-center justify-center"
                />
              </div>
            )}
          </Suspense>
        )}
      </div>
      <div className="relative mt-14 flex w-full flex-col items-center justify-center px-[40px]">
        <div className="mb-2 flex h-full flex-col items-center justify-center">
          <h3 className="mb-8 text-sm uppercase md:text-[10px]">Meet Us</h3>
          <h2 className="text-5xl font-bold sm:text-[78px] md:text-[108px] lg:text-[138px] xl:text-[158px]">
            OUR VISION
          </h2>
          <div className="flex w-full items-center justify-between text-xl uppercase sm:px-1 md:px-1 lg:flex-row lg:px-2 xl:px-3">
            <h3>learn</h3>
            <h3>grow</h3>
            <h3>earn</h3>
          </div>
        </div>
      </div>
      {/* <BottomLine /> */}
    </Section>
  );
};

export default HeroTweak;
