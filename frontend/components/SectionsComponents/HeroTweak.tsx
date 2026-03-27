'use client';

import { useEffect, useState } from 'react';
import { lazy, Suspense } from 'react';
import Image from 'next/image';
import { companies, shape1, Spinner } from '@/app/constants';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ScrollParallax } from 'react-just-parallax';
// import CustomButton from '@/components/ui/CustomButton';
// import { SpinningText } from '@/components/magicui/spinning-text';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import gsap from 'gsap';
import Section from '../SupportComponents/Section';
// import CustomCursor from '../SupportComponents/CustomCursor';
import Copy from '../SupportComponents/Copy';
import { Button } from '../ui/button';
import CopyHeader from '../SupportComponents/CopyHeaer';

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
      className="relative -mt-[5.25rem] pt-[7.5rem]"
      crosses
      crossesOffset="lg:translate-y-[7.5rem]"
      customPaddings
      id="hero"
    >
      {/* <CustomCursor /> */}
      <div className="main-font-color relative z-30 flex h-[390px] flex-row px-[40px] max-md:h-auto lg:w-full">
        <div className="inset-0 flex w-full flex-col items-center justify-center md:flex-row md:justify-start md:pl-[40px] lg:w-3/5 lg:border-t lg:border-b">
          <div className="font-poppins flex w-full flex-col items-center justify-center max-md:mt-4 max-md:mb-8 lg:w-1/2 lg:items-start">
            <CopyHeader>
              <h1 className="font-zona-semibold text-3xl whitespace-nowrap text-neutral-800 max-md:text-center sm:text-4xl md:text-4xl lg:text-4xl xl:text-4xl dark:text-neutral-300">
                Znajdź ścieżkę
                <br />
                kariery dzięki AI
              </h1>
            </CopyHeader>
            <Copy>
              <h2 className="font-zona text-muted-foreground font-zona mt-4 max-w-xl px-4 text-center text-sm text-balance max-md:block sm:mt-4 sm:text-base md:px-0 md:text-left md:text-lg lg:text-base xl:text-sm">
                AI analizuje Twój profil i tworzy ścieżki kariery, CV pod ATS i plan działania.
              </h2>
            </Copy>
            <div className="relative mt-10 flex w-full max-w-[28rem] justify-center lg:hidden">
              <div className="pointer-events-none absolute -top-10 left-1/2 h-56 w-[92%] max-w-[12rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(146,150,253,0.44)_0%,rgba(168,85,247,0.28)_38%,rgba(199,169,254,0.14)_60%,transparent_82%)] blur-3xl" />
              <div
                className="relative z-10 h-[550px] w-full overflow-hidden"
                style={{
                  WebkitMaskImage:
                    'linear-gradient(to bottom, black 0%, black 35%, transparent 95%)',
                  maskImage: 'linear-gradient(to bottom, black 0%, black 35%, transparent 95%)',
                }}
              >
                <Image
                  src="/images/iphone-mobile-hero-1.avif"
                  alt="Podgląd analizy profilu na telefonie"
                  fill
                  className="object-contain object-top"
                  sizes="320px"
                  priority
                />
              </div>
            </div>

            <Link
              href="/profile"
              className="mt-3 hidden cursor-none max-md:items-center max-md:justify-center sm:mt-4 lg:flex lg:w-full"
            >
              <Button
                className="group relative z-20 mt-4 h-12 w-full rounded-full bg-[linear-gradient(90deg,rgba(146,150,253,1)_0%,rgba(132,145,254,1)_50%,rgba(199,169,254,1)_100%,rgba(157,155,255,1)_77%)] font-bold text-white md:mt-2 md:w-2/3"
                variant="default"
              >
                Analiza w 60 sekund
                <ArrowRight className="ml-2 transition-all ease-in-out group-hover:translate-x-2" />
              </Button>
            </Link>
            {/* <p className='mt-2 text-xs text-gray-500'>Private by default. You control your data.</p> */}
          </div>
          {/* <div className="font-grotesk flex h-full flex-col items-center justify-center max-md:mt-20 sm:w-full lg:w-1/2 2xl:w-1/4 2xl:items-end">
            <SpinningText>learn more • earn more • grow more •</SpinningText>
          </div> */}
        </div>
        {!isMobile && (
          <div className="inset-0 flex w-2/5 items-center justify-center lg:border-t lg:border-b lg:border-l">
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
      <div className="relative hidden h-[70px] w-full items-center justify-center lg:flex">
        <div className="pointer-events-none absolute inset-x-0 top-px z-0 flex justify-center">
          <div className="h-[170px] w-[82%] max-w-[980px] -translate-y-full rounded-t-full bg-[radial-gradient(ellipse_at_bottom,rgba(146,150,253,0.12)_0%,rgba(146,150,253,0.08)_28%,rgba(199,169,254,0.05)_46%,transparent_74%)] opacity-60 blur-3xl dark:bg-[radial-gradient(ellipse_at_bottom,rgba(146,150,253,0.16)_0%,rgba(146,150,253,0.1)_28%,rgba(199,169,254,0.06)_46%,transparent_74%)]" />
        </div>
        <div className="relative z-10 mx-10 flex h-full w-full">
          {companies.map((company) => (
            <div
              key={company.name}
              className="flex h-full flex-1 items-center justify-center border-r border-b"
            >
              <div className="relative flex h-full w-full items-center justify-center">
                <p className="font-grotesk text-gray-500">
                  <span className="bg-[linear-gradient(90deg,rgba(146,150,253,1)_0%,rgba(132,145,254,1)_50%,rgba(199,169,254,1)_100%,rgba(157,155,255,1)_77%)] bg-clip-text font-bold text-transparent">
                    {' '}
                    {company.specialText}
                  </span>
                  {company.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="relative flex flex-col items-center justify-center border-gray-300 px-[40px] sm:mt-14 dark:border-gray-600/30">
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
