'use client';

import { useEffect, useState } from 'react';
import { lazy, Suspense } from 'react';
import Image from 'next/image';
import { shape1, Spinner } from '@/app/constants';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ScrollParallax } from 'react-just-parallax';
import CustomCursor from '../CustomCursor';
import Section from '../Section';
import CustomButton from '@/components/ui/CustomButton';
import { SpinningText } from '@/components/magicui/spinning-text';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import gsap from 'gsap';
import Copy from '../Copy';

gsap.registerPlugin(ScrollTrigger, SplitText);

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
        <div className="inset-0 flex w-full flex-col items-center justify-center md:flex-row md:justify-start md:pl-[40px] lg:w-3/5 lg:border-t lg:border-b">
          <div className="flex w-full flex-col items-center justify-center max-md:mt-10 max-md:mb-8 lg:w-1/2 lg:items-start">
            <Copy>
              <h1 className="font-poppins overflow-hidden text-4xl leading-tight font-bold whitespace-nowrap text-neutral-800 max-md:text-center sm:text-4xl md:text-5xl lg:text-4xl xl:text-5xl 2xl:text-7xl dark:text-neutral-300">
                Unlock Your <br /> Growth
              </h1>
            </Copy>
            <Copy>
              <h2 className="text-muted-foreground ibm-plex-mono-regular mt-8 max-w-xl px-4 text-center text-sm max-md:block sm:mt-4 sm:text-base md:px-0 md:text-left md:text-lg lg:text-base xl:text-sm">
                An intelligent AI-powered career advisor that analyzes your skills, goals, and
                market trends to guide you toward the best professional path.
              </h2>
            </Copy>

            <Link
              href="/assistant"
              className="mt-3 flex cursor-none max-md:items-center max-md:justify-center sm:mt-4 lg:w-full"
            >
              <CustomButton
                variant="primary"
                className="group mt-4 flex cursor-none items-center justify-center overflow-hidden max-md:mt-10"
              >
                <span className="flex flex-row">
                  Try it out
                  <ArrowRight className="ml-2 scale-75 transition-transform duration-300 group-hover:translate-x-2" />
                </span>
              </CustomButton>
            </Link>
          </div>
          <div className="flex h-full flex-col items-center justify-center max-md:mt-20 sm:w-full lg:w-1/2 2xl:w-1/4 2xl:items-end">
            <SpinningText>learn more • earn more • grow more •</SpinningText>
          </div>
        </div>
        {!isMobile && (
          <Suspense fallback={<Image src={Spinner} alt="spinner" width={60} height={60} />}>
            {showSpline && (
              <div className="inset-0 flex w-2/5 items-center lg:border-t lg:border-b lg:border-l">
                <LazySpline
                  scene="https://prod.spline.design/mZBrYNcnoESGlTUG/scene.splinecode"
                  className="flex items-center justify-center"
                />
              </div>
            )}
          </Suspense>
        )}
      </div>
      <div className='h-[70px] w-full flex'>
        <div className='border-b w-full h-full mx-10'>

        </div>

        </div>
      <div className="relative mt-14 flex flex-col items-center justify-center border-gray-300 px-[40px] max-md:mt-40 dark:border-gray-600/30">
        <div className="mb-2 flex h-full flex-col items-center justify-center">
          <h3 className="font-poppins font-normal text-gray-400">Meet Us</h3>
          <Copy>
            <h1 className="font-poppins text-color mt-8 text-center text-4xl font-bold md:text-[4rem] xl:leading-[0.8]">
              Our Vision
            </h1>
          </Copy>
        </div>
      </div>
      <ScrollParallax isAbsolutelyPositioned zIndex={20}>
        <div className="absolute -bottom-30 left-2 z-20 xl:bottom-1/5">
          <Image src={shape1} alt="shape" width={78} height={78} className="-rotate-20" />
        </div>
      </ScrollParallax>
    </Section>
  );
};

export default HeroTweak;
