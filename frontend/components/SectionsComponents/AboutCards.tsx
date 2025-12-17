'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AboutCard from '@/components/GhostComponents/AboutCard';
import Section from '@/components/SupportComponents/Section';
import { shape1 } from '@/app/constants';
import { ScrollParallax } from 'react-just-parallax';
import Image from 'next/image';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { landingCopy } from '@/app/constants/landingCopy';

gsap.registerPlugin(ScrollTrigger);

const AboutCards = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { language } = useLanguage();
  const copy = landingCopy[language];

  useEffect(() => {
    if (!window.matchMedia('(min-width: 1280px)').matches) return;
    if (!containerRef.current) return;

    const cards = containerRef.current.querySelectorAll('.about-card');

    cards.forEach((card, index) => {
      const offset = index * 60;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: `top+=${offset} 80%`,
          end: `+=400`,
          scrub: true,
        },
      });

      tl.fromTo(
        card,
        { autoAlpha: 0, y: 100, rotation: 0 },
        {
          autoAlpha: 1,
          y: 0,
          rotation: index % 2 === 0 ? -5 : 5,
          duration: 1,
          ease: 'power2.out',
        }
      )
        .to(card, { y: -40, duration: 1.6, ease: 'sine.inOut' })
        .to(card, { y: 40, duration: 1.6, ease: 'sine.inOut' })
        .to(card, { y: 0, duration: 1.5, ease: 'sine.inOut' })
        .to(card, {
          y: -600,
          autoAlpha: 0,
          rotation: 0,
          duration: 2,
          ease: 'power1.in',
        });
    });
  }, []);

  return (
    <Section
      className="relative -mt-[2.25rem] pt-[7.5rem] max-md:overflow-hidden"
      crossesOffset="lg:translate-y-[7.5rem]"
      customPaddings
      id="about"
    >
      <ScrollParallax isAbsolutelyPositioned zIndex={20}>
        <div className="absolute top-1/2 right-2 z-20">
          <Image src={shape1} alt="shape" width={78} height={78} className="rotate-20" />
        </div>
      </ScrollParallax>

      <div ref={containerRef} className="main-font-color relative flex max-md:-top-10 lg:w-full">
        <div className="mx-8 flex w-full flex-col items-center justify-center max-lg:space-y-4 lg:flex-row lg:space-x-4">
          {copy.aboutCards.map((cardData, index) => (
            <div className="about-card font-poppins z-30" key={index}>
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
