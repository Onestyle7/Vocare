'use client';
import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Image from 'next/image';
import { shape1 } from '@/app/constants';
import { SplitText, ScrollTrigger } from 'gsap/all';
import SectionGsap from '@/components/ui/SectionGsap';
import { ScrollParallax } from 'react-just-parallax';
import Copy from '../Copy';
import { Safari } from '@/components/magicui/safari';
import Link from 'next/link';

gsap.registerPlugin(SplitText, ScrollTrigger);

const Features = () => {
  const videoRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const clipAnimation = gsap.timeline({
      scrollTrigger: {
        trigger: '#clip',
        start: 'center center',
        end: '+=8000 center', // Zmniejszona długość scrollowania
        scrub: 0.5,
        pin: true,
        pinSpacing: true,
      },
    });

    // Pierwsza część animacji - powiększanie kwadratu
    clipAnimation
      .to('.mask-clip-path', {
        width: '97vw',
        height: '97vh',
        borderRadius: '0 0 40px 40px', // tylko dolne rogi
        duration: 0.25,
      })
      // Druga część - pojawienie się contentu tekstowego
      .fromTo(
        '.text-content',
        {
          opacity: 0,
          y: 50,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.2,
        }
      )
      // Trzecia część - ukrycie tekstu (szybciej)
      .to(
        '.text-content',
        {
          opacity: 0,
          y: -50,
          duration: 0.15,
        },
        '+=0.15'
      ) // Krótszy czas oczekiwania
      // Czwarta część - pojawienie się video i jego odtworzenie
      .fromTo(
        '.video-content',
        {
          opacity: 0,
          scale: 0.8,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.2,
          onComplete: () => {
            // Odtwórz video gdy się pojawi
            if (videoRef.current) {
              const video = videoRef.current.querySelector('video');
              if (video) {
                video.play();
              }
            }
          },
        }
      )
      // Piąta część - przesunięcie video na górę ekranu (responsywne)
      .to(
        '.video-content',
        {
          y: () => {
            // Na mobilnych urządzeniach video się nie przesuwa
            if (window.innerWidth < 768) {
              return '0vh';
            }
            // Na dużych ekranach mniejsze przesunięcie
            return '-20vh';
          },
          scale: () => {
            // Na mobilnych urządzeniach skala pozostaje bez zmian
            if (window.innerWidth < 768) {
              return 1;
            }
            // Na dużych ekranach lekkie zmniejszenie
            return 0.85;
          },
          duration: 0.2,
        },
        '+=0.15'
      )
      // Szósta część - pojawienie się tagu h2
      .fromTo(
        '.signup-tag',
        {
          y: '50px',
          opacity: 0,
        },
        {
          y: '0px',
          opacity: 1,
          duration: 0.15,
        },
        '-=0.05'
      )
      // Siódma część - pojawienie się buttona z dołu
      .fromTo(
        '.signup-button',
        {
          y: '100px',
          opacity: 0,
        },
        {
          y: '0px',
          opacity: 1,
          duration: 0.2,
        },
        '-=0.05'
      ); // Lekkie nakładanie się animacji
  });

  return (
    <SectionGsap
      className="relative -mt-[2.25rem] pt-[7.5rem]"
      crossesOffset="lg:translate-y-[7.5rem]"
      crosses
      customPaddings
      id="feature"
    >
      <div className="min-h-screen border-gray-700 xl:mr-[40px] xl:ml-[40px] xl:border-t-[0.5px] xl:border-r-[0.5px] xl:border-l-[0.5px]">
        <div className="relative mt-36 max-md:mt-0 mb-8 flex flex-col items-center gap-5">
          <h2 className="text-sm uppercase md:text-[12px]">seamless integration</h2>
          <Copy>
            <h1 className="font-poppins text-color mt-5 text-center text-4xl font-bold uppercase md:text-[4rem] xl:leading-[0.8]">
              Discover the world <br /> dive into it
            </h1>
          </Copy>
          <div className="font-circular-web font-poppins absolute bottom-[-80dvh] left-1/2 w-full max-w-96 -translate-x-1/2 text-center text-lg md:max-w-[34rem]">
            <p>The game of games begins</p>
            <p>let us rocket Your career to the sky</p>
          </div>
          <ScrollParallax isAbsolutelyPositioned zIndex={20}>
            <div className="absolute -bottom-30 left-0 z-20 sm:left-10 md:left-10 xl:bottom-1/5 xl:left-0">
              <Image src={shape1} alt="shape" width={78} height={78} className="-rotate-20" />
            </div>
          </ScrollParallax>
        </div>

        <div className="z-30 h-dvh" id="clip">
          <div className="mask-clip-path absolute top-0 left-1/2 z-30 h-[60vh] w-96 origin-center -translate-x-1/2 overflow-hidden rounded-3xl md:w-[30vw]">
            <div className="absolute top-0 left-0 h-full w-full bg-[#f3f3f3]">
              {/* Text Content - pojawia się gdy kwadrat osiągnie 100% */}
              <div className="text-content absolute inset-0 flex items-center justify-center px-4 opacity-0 sm:px-8 md:px-12 lg:px-16 xl:px-24">
                <div className="max-w-2xl text-center">
                  <h2 className="font-poppins text-2xl leading-tight font-semibold text-black sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl">
                    Designed to <br />
                    let you focus <br /> on <span className="text-[#915EFF]">opportunities</span>,
                    <br /> not searching.
                  </h2>
                </div>
              </div>

              {/* Video Content - pojawia się po zniknięciu tekstu, później przesuwa się na górę (tylko na dużych ekranach) */}
              <div
                className="video-content absolute inset-0 flex items-center justify-center p-4 opacity-0 sm:p-8 md:p-12 lg:p-16"
                ref={videoRef}
              >
                <div className="scale-90 max-lg:scale-55 max-sm:scale-30">
                  <Safari url="https://vocare.com" videoSrc="/videos/Search.mp4" />
                </div>
              </div>

              <div className="signup-tag absolute right-0 bottom-24 left-0 flex items-end justify-center opacity-0 sm:bottom-28 md:bottom-32 lg:bottom-36">
                <h3 className="font-poppins mb-4 px-4 text-center text-lg font-medium text-black sm:text-xl md:text-2xl lg:text-3xl">
                  Ready to transform your workflow?
                </h3>
              </div>

              {/* Sign-up Button - wsuwa się z dołu, prosty czarny button */}
              <div className="signup-button absolute right-0 bottom-0 left-0 flex items-end justify-center pb-8 opacity-0 sm:pb-12 md:pb-16 lg:pb-20">
                <Link href="/sign-up">
                  <button className="font-poppins rounded-full bg-black px-6 py-3 text-base font-semibold text-white transition-all duration-300 active:scale-95 sm:px-8 sm:py-4 sm:text-lg">
                    Get Started Now
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionGsap>
  );
};

export default Features;
