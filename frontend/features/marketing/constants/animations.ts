import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RefObject } from 'react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const useCardsAnimation = (cardsContainerRef: RefObject<HTMLDivElement | null>) => {
  useGSAP(
    () => {
      if (!cardsContainerRef.current) return;

      const cards = gsap.utils.toArray('.desktop-card');

      const finalY = [112, 28, 0, 28, 112];
      const finalRotations = [-24, -12, 0, 12, 24];

      gsap.fromTo(
        cards,
        {
          opacity: 0,
          y: 300,
          x: (i) => (i - 2) * 150,
          rotation: (i) => (i - 2) * 45,
        },
        {
          opacity: 1,
          x: 0,
          y: (i) => finalY[i],
          rotation: (i) => finalRotations[i],
          transformOrigin: 'bottom center',
          ease: 'power2.out',
          scrollTrigger: {
            trigger: cardsContainerRef.current,
            start: 'top 85%',
            end: 'top 35%',
            scrub: 1.5,
          },
        }
      );
    },
    { scope: cardsContainerRef }
  );
};

export const useHeroDashboardAnimation = (dashboardImageRef: RefObject<HTMLDivElement | null>) => {
  useGSAP(
    () => {
      if (!dashboardImageRef.current) return;

      gsap.fromTo(
        dashboardImageRef.current,
        {
          autoAlpha: 0,
          x: 120,
          scale: 0.96,
          filter: 'blur(14px)',
        },
        {
          autoAlpha: 1,
          x: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.25,
          delay: 0.25,
          ease: 'power3.out',
        }
      );
    },
    { scope: dashboardImageRef }
  );
};
