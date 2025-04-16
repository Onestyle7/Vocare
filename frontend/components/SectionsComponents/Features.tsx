'use client';
import React from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/all';
import Image from 'next/image';
import { plus } from '@/app/constants';
import ContentPage from '../ui/ContentPage';
import ContentPage2 from '../ui/CustomPage2';
import ContentPage3 from '../ui/CustomPage3';
import Section from '../Section';

gsap.registerPlugin(ScrollTrigger);

const Features = () => {
  const colorPanels = [
    {
      title: 'First Panel',
      content: (
        <div className="panel-content">
          <ContentPage />
        </div>
      ),
    },
    {
      title: 'Second Panel',
      content: (
        <div className="panel-content">
          <ContentPage2 />
        </div>
      ),
    },
    {
      title: 'Third Panel',
      content: (
        <div className="panel-content">
          <ContentPage3 />
        </div>
      ),
    },
  ];

  useGSAP(() => {
    const clipAnimation = gsap.timeline({
      scrollTrigger: {
        trigger: '#clip',
        start: 'center center',
        end: '+=3000 center',
        scrub: 0.5,
        pin: true,
        pinSpacing: true,
      },
    });

    clipAnimation.to('.mask-clip-path', {
      width: '100vw',
      height: '100vh',
      borderRadius: 0,
      duration: 1,
    });

    clipAnimation.to('#vocare-text', {
      opacity: 0,
      scale: 0.3,
      duration: 0.7,
    });

    colorPanels.forEach((_, index) => {
      const currentPanelId = `#panel-${index + 1}`;

      clipAnimation.fromTo(
        currentPanelId,
        {
          x: '100vw',
          opacity: 1,
        },
        {
          x: 0,
          opacity: 1,
          duration: 1,
        }
      );
    });

    clipAnimation.fromTo(
      '#vocare-text',
      {
        opacity: 0,
        scale: 0.2,
      },
      {
        opacity: 1,
        scale: 1,
        duration: 1.5,
      }
    );

    gsap.to('#plus', {
      rotation: 360,
      y: 300,
      ease: 'none',
      scrollTrigger: {
        trigger: '.mask-clip-path',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    gsap.to('#subtext', {
      opacity: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: '.mask-clip-path',
        start: 'top top',
        end: '+=400 top',
        scrub: true,
      },
    });
  });

  return (
    <Section
      className="relative -mt-[2.25rem] pt-[7.5rem]"
      crossesOffset="lg:translate-y-[7.5rem]"
      crosses
      customPaddings
      id="about"
    >
    <div className="min-h-screen w-screen border">
      <div className="relative mt-36 mb-8 flex flex-col items-center gap-5">
        <h2 className="text-sm uppercase md:text-[10px]">seamless integration</h2>
        <div className="mt-5 text-center text-4xl leading-[0.8] font-bold uppercase md:text-[6rem]">
          Discover the world <br /> <span>dive into it</span>
        </div>
        <div className="font-circular-web absolute bottom-[-80dvh] left-1/2 w-full max-w-96 -translate-x-1/2 text-center text-lg md:max-w-[34rem]">
          <p>The game of games beginns</p>
          <p>let us rocket Your career to the sky</p>
        </div>
      </div>
      <div className="h-dvh w-screen" id="clip">
        <div className="mask-clip-path absolute top-0 left-1/2 z-20 h-[60vh] w-96 origin-center -translate-x-1/2 overflow-hidden rounded-3xl md:w-[30vw]">
          <div className="absolute top-0 left-0 h-full w-full bg-[#101014] object-cover dark:bg-[#F3F3F3]">
            <div className="flex h-full items-center justify-center">
              <div className="relative flex h-full w-full flex-col items-center justify-center text-black">
                <h2
                  className="absolute text-4xl font-bold text-white uppercase opacity-0 lg:text-[400px]"
                  id="subtext"
                >
                  <span id="vocare-text" className="dark:text-black">
                    VOCARE
                  </span>
                </h2>
                {colorPanels.map((panel, index) => (
                  <div
                    key={`panel-${index + 1}`}
                    id={`panel-${index + 1}`}
                    className="absolute flex h-full w-full flex-col items-center justify-center"
                    style={{
                      transform: 'translateX(100vw)',
                    }}
                  >
                    {panel.content}
                  </div>
                ))}
                <Image
                  src={plus}
                  alt="plus"
                  width={84}
                  height={84}
                  id="plus"
                  className="absolute dark:invert"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </Section>
  );
};

export default Features;
