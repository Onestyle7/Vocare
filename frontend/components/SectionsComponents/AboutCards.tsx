'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AboutCard from '@/components/GhostComponents/AboutCard';
import Section from '@/components/SupportComponents/Section';
import { aboutCardsData } from '@/app/constants';
// import { ScrollParallax } from 'react-just-parallax';
// import Image from 'next/image';

gsap.registerPlugin(ScrollTrigger);

const AboutCards = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!window.matchMedia('(min-width: 1280px)').matches) return;
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.about-card');

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          pin: true,
          start: 'top 15%',
          end: '+=2500',
          scrub: 1,
        },
      });

      cards.forEach((card, index) => {
        const reverseIndex = cards.length - 1 - index;

        const delay = reverseIndex * 0.6;

        const enterDur = 1.2;
        const dipDur = 1.4;
        const exitDur = 1.5;

        tl.fromTo(
          card as Element,
          { autoAlpha: 0, y: '100vh', rotation: 0 },
          {
            autoAlpha: 1,
            y: 0,
            rotation: index % 2 === 0 ? -5 : 5,
            duration: enterDur,
            ease: 'power2.out',
          },
          delay
        )
          .to(
            card as Element,
            {
              y: 80,
              rotation: index % 2 === 0 ? -8 : 8,
              duration: dipDur,
              ease: 'sine.inOut',
            },
            delay + enterDur
          )
          .to(
            card as Element,
            {
              y: '-100vh',
              autoAlpha: 0,
              rotation: 0,
              duration: exitDur,
              ease: 'power2.in',
            },
            delay + enterDur + dipDur
          );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <Section
      className="relative -mt-9 pt-30 max-md:overflow-hidden"
      crossesOffset="lg:translate-y-[7.5rem]"
      customPaddings
      id="about"
    >
      {/* <ScrollParallax isAbsolutelyPositioned zIndex={20}>
        <div className="absolute top-1/2 right-2 z-20">
          <Image src={shape1} alt="shape" width={78} height={78} className="rotate-20" />
        </div>
      </ScrollParallax> */}

      <div ref={containerRef} className="main-font-color relative flex max-md:-top-10 lg:w-full">
        <div className="mx-8 flex w-full flex-col items-center justify-center max-lg:space-y-4 lg:flex-row lg:space-x-4">
          {aboutCardsData.map((cardData, index) => (
            <div className="about-card font-grotesk z-30" key={index}>
              <AboutCard
                img={cardData.img}
                title={cardData.title}
                description={cardData.description}
              />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

export default AboutCards;
