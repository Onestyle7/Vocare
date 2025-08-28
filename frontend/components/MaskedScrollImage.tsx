'use client';

import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Rejestrujemy plugin ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

interface ScrollMaskProps {
  imageUrl: string;
  alt?: string;
}

const ScrollMask: React.FC<ScrollMaskProps> = ({ imageUrl, alt = 'Masked image' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const mask = maskRef.current;

    if (!container || !mask) return;

    // Tworzymy animację scroll trigger z pinowaniem
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'center center', // Zaczyna gdy sekcja jest na środku ekranu
        end: '+=150vh', // Trwa przez 1.5 viewport height
        scrub: 1, // Płynna animacja związana ze scrollem
        pin: true, // Pinuje sekcję podczas animacji
        pinSpacing: true, // Zachowuje spacing po pinowaniu
      },
    });

    // Animujemy powiększenie maski z małego rozmiaru do pełnego ekranu
    tl.fromTo(
      mask,
      {
        // Stan początkowy - mała maska
        maskSize: '1000px',
        WebkitMaskSize: '1000px',
      },
      {
        // Stan końcowy - maska na cały ekran
        maskSize: '500dvw',
        WebkitMaskSize: '500dvw',
        duration: 1,
        ease: 'power2.out',
      }
    );

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* Sekcja przed maską */}
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <h1 className="text-4xl font-bold">Scroll w dół aby zobaczyć efekt</h1>
      </div>

      {/* Kontener z maską */}
      <div
        ref={containerRef}
        className="relative flex h-screen items-center justify-center overflow-hidden border border-red-500 bg-gray-900 p-4"
      >
        <div className="h-full w-full overflow-hidden rounded-3xl">
          <div
            ref={maskRef}
            className="relative h-full w-full"
            style={{
              maskImage: 'url("/masks/bubble.svg")', // Twój plik PNG
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
              maskSize: 'contain',
              WebkitMaskImage: 'url("/masks/bubble.svg")', // Twój plik PNG
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              WebkitMaskSize: 'contain',
            }}
          >
            <img src={imageUrl} alt={alt} className="h-full w-full object-cover" />
          </div>
        </div>
      </div>

      {/* Sekcja po masce */}
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <h1 className="text-4xl font-bold text-black">Reszta treści strony</h1>
      </div>
    </div>
  );
};

export default ScrollMask;
