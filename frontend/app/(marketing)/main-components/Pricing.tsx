'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';

import { PricingInteractive } from '@/features/billing/components/PricingInteractive';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

export default function Pricing() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(
        {
          isDesktop: '(min-width: 1024px)',
          isMobile: '(max-width: 1023px)',
          reduceMotion: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          if (context.conditions?.reduceMotion) return;

          const isDesktop = context.conditions?.isDesktop;
          const cards = gsap.utils.toArray<HTMLElement>('article');

          cards.forEach((card, index) => {
            gsap.fromTo(
              card,
              { y: isDesktop ? 64 : 40, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: isDesktop ? 0.8 : 0.65,
                delay: isDesktop ? index * 0.12 : 0,
                ease: 'power3.out',
                clearProps: 'transform,opacity',
                scrollTrigger: {
                  trigger: card,
                  start: 'top 88%',
                  once: true,
                },
              }
            );
          });
        }
      );

      return () => media.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="pricing"
      aria-labelledby="home-pricing-title"
      className="font-poppins bg-[#0F1013] px-3 pt-6 pb-12 sm:px-5 sm:pt-8 sm:pb-16 lg:pt-10 lg:pb-20 2xl:pb-24"
    >
      <div className="relative mx-auto w-full max-w-7xl">
        <div className="flex flex-col items-center gap-5 px-4 text-center sm:gap-6 sm:px-8 md:px-12 lg:px-16">
          <h2
            id="home-pricing-title"
            className="w-full text-[28px] leading-[1.15] font-light text-[#F1F4FF] sm:text-[36px] lg:text-[48px] lg:leading-[1.1]"
          >
            <span className="opacity-[0.79]">Plan dopasowany pod </span>
            <span className="bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text font-normal text-transparent">
              Ciebie
            </span>
          </h2>
          <p className="text-[14px] leading-normal font-light text-[#F1F4FF] opacity-[0.46] sm:text-[15px] lg:text-[18px]">
            Darmowy start. Bez karty płatniczej.
          </p>
        </div>

        <PricingInteractive showGlow={false} showShapes={false} />
      </div>
    </section>
  );
}
