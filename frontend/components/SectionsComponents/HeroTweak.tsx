'use client';

import { useEffect, useState } from 'react';
import { lazy, Suspense } from 'react';
import Image from 'next/image';
import { companies, shape1, Spinner } from '@/app/constants';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ScrollParallax } from 'react-just-parallax';
// import CustomButton from '@/components/ui/CustomButton';
import { SpinningText } from '@/components/magicui/spinning-text';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import gsap from 'gsap';
import Section from '../SupportComponents/Section';
import CustomCursor from '../SupportComponents/CustomCursor';
import Copy from '../SupportComponents/Copy';
import { Button } from '../ui/button';

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
          <div className="font-korbin flex w-full flex-col items-center justify-center max-md:mt-10 max-md:mb-8 lg:w-1/2 lg:items-start">
            <Copy>
              <h1 className="overflow-hidden text-4xl font-bold whitespace-nowrap text-neutral-800 max-md:text-center sm:text-4xl md:text-5xl lg:text-4xl xl:text-5xl 2xl:text-7xl dark:text-neutral-300">
                Odblokuj swój <br /> potencjał
              </h1>
            </Copy>
            <Copy>
              <h2 className="text-muted-foreground font-grotesk mt-8 max-w-xl px-4 text-center text-sm max-md:block sm:mt-4 sm:text-base md:px-0 md:text-left md:text-lg lg:text-base xl:text-sm">
                Vocare to AI-owy doradca kariery, który zamienia Twój profil w konkretne ścieżki
                kariery, aktualne sygnały rynkowe oraz CV gotowe pod ATS - dzięki czemu dokładnie
                wiesz, co zrobić dalej, już dziś.
              </h2>
            </Copy>

            <Link
              href="/profile"
              className="mt-3 flex cursor-none max-md:items-center max-md:justify-center sm:mt-4 lg:w-full"
            >
              <Button
                className="group relative z-20 mt-4 h-12 w-full rounded-full bg-[linear-gradient(90deg,rgba(146,150,253,1)_0%,rgba(132,145,254,1)_50%,rgba(199,169,254,1)_100%,rgba(157,155,255,1)_77%)] font-bold text-white md:mt-2 md:w-2/3"
                variant="default"
              >
                Wypróbuj za darmo
                <ArrowRight className="ml-2 transition-all ease-in-out group-hover:translate-x-2" />
              </Button>
            </Link>
            {/* <p className='mt-2 text-xs text-gray-500'>Private by default. You control your data.</p> */}
          </div>
          <div className="font-grotesk flex h-full flex-col items-center justify-center max-md:mt-20 sm:w-full lg:w-1/2 2xl:w-1/4 2xl:items-end">
            <SpinningText>learn more • earn more • grow more •</SpinningText>
          </div>
        </div>
        {!isMobile && (
          <div className="inset-0 flex w-2/5 items-center lg:border-t lg:border-b lg:border-l">
            <Suspense fallback={<Image src={Spinner} alt="spinner" width={60} height={60} />}>
              {showSpline && (
                <LazySpline
                  scene="https://prod.spline.design/mZBrYNcnoESGlTUG/scene.splinecode"
                  className="flex items-center justify-center"
                />
              )}
            </Suspense>
          </div>
        )}
      </div>

      <div className="hidden h-[70px] w-full lg:flex">
        <div className="mx-10 flex h-full w-full">
          {companies.map((company) => (
            <div
              key={company.name}
              className="flex h-full flex-1 items-center justify-center border-r border-b border-l"
            >
              <div className="relative flex h-full w-full items-center justify-center">
                <Image
                  src={company.url}
                  alt={company.name}
                  width={84}
                  height={10}
                  className="object-contain opacity-30 grayscale transition-all duration-200 ease-out hover:opacity-100 hover:brightness-100 hover:grayscale-0 dark:brightness-0 dark:invert dark:hover:brightness-0 dark:hover:invert"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-14 flex flex-col items-center justify-center border-gray-300 px-[40px] max-md:mt-40 dark:border-gray-600/30">
        <div className="font-korbin mb-2 flex h-full flex-col items-center justify-center">
          <p className="font-bold text-gray-400">Poznaj nas</p>
          <Copy>
            <p className="text-color mt-8 text-center text-4xl font-bold md:text-[4rem] xl:leading-[0.8]">
              Co otrzymasz?
            </p>
          </Copy>
          <h2 className="font-grotesk mt-4 text-gray-400 max-md:text-center">
            Ścieżki kariery dopasowane do ciebie, analize rynkową oraz ATS-Ready CV.
          </h2>
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
