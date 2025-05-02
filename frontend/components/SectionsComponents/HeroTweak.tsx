'use client';

import { useEffect, useState } from 'react';
import { lazy, Suspense } from 'react';
import Section from '../Section';
import Image from 'next/image';
import { shape1, Spinner } from '@/app/constants';
import { SpinningText } from '../magicui/spinning-text';
import CustomCursor from '../CustomCursor';
import CustomButton from '../ui/CustomButton';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ScrollParallax } from 'react-just-parallax';
import AnimatedHeadline from '../AnimatedText';

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
      <div className="main-font-color relative z-30 flex h-[390px] flex-row px-[40px] lg:w-full">
        <div className="inset-0 flex w-full flex-col items-center justify-center md:flex-row md:justify-start md:pl-[40px] lg:w-3/5 xl:border-t xl:border-b">
          <div className="flex flex-col justify-center max-md:mb-8 lg:w-1/2 xl:items-start">
            <h1 className="text-[60px] leading-17 font-bold uppercase max-md:text-center lg:text-[78px] xl:text-[88px] 2xl:text-[108px] 2xl:leading-21">
              <AnimatedHeadline
                lines={['unlock', 'your', 'growth']}
                className="items-start max-md:items-center"
              />
            </h1>
            <Link
              href="/assistant"
              className="flex max-md:items-center max-md:justify-center xl:w-full"
            >
              <CustomButton
                variant="primary"
                className="group mt-4 flex cursor-none items-center justify-center overflow-hidden xl:mt-8"
              >
                <span className="flex flex-row">
                  Try it out
                  <ArrowRight className="ml-2 scale-75 transition-transform duration-300 group-hover:translate-x-2" />
                </span>
              </CustomButton>
            </Link>
          </div>
          <div className="flex h-full flex-col items-center justify-center max-md:mt-6 sm:w-full lg:w-1/2 2xl:w-1/3 2xl:items-end">
            <SpinningText>learn more • earn more • grow more •</SpinningText>
          </div>
        </div>
        {!isMobile && (
          <Suspense fallback={<Image src={Spinner} alt="spinner" width={60} height={60} />}>
            {showSpline && (
              <div className="inset-0 flex w-2/5 items-center xl:border-t xl:border-b xl:border-l">
                <LazySpline
                  scene="https://prod.spline.design/mZBrYNcnoESGlTUG/scene.splinecode"
                  className="flex items-center justify-center"
                />
              </div>
            )}
          </Suspense>
        )}
      </div>
      <div className="relative mx-10 mt-14 flex flex-col items-center justify-center border-gray-300 px-[40px] xl:border-r xl:border-l dark:border-gray-700">
        <div className="mb-2 flex h-full flex-col items-center justify-center">
          <h3 className="mb-8 text-sm uppercase md:text-[10px]">Meet Us</h3>
          <h2 className="text-[42px] font-bold sm:text-[78px] md:text-[108px] lg:text-[138px] xl:text-[158px]">
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
      <ScrollParallax isAbsolutelyPositioned zIndex={20}>
        <div className="absolute -bottom-30 left-2 z-20 xl:bottom-1/5">
          <Image src={shape1} alt="shape" width={78} height={78} className="-rotate-20" />
        </div>
      </ScrollParallax>
    </Section>
  );
};

export default HeroTweak;
