// components/HorizontalCarousel.tsx
'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalCarouselProps {
  children: React.ReactNode;
  /** Ile px przewinąć po kliknięciu strzałki */
  scrollByPx?: number;
  /** Ile kart ma być widać jednocześnie (desktop). Np. 2.33 */
  desktopCardsPerView?: number;
}

export default function HorizontalCarousel({
  children,
  scrollByPx = 520,
  desktopCardsPerView = 2.33,
}: HorizontalCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!trackRef.current) return;
    const delta = dir === 'left' ? -scrollByPx : scrollByPx;
    trackRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <div
      className="relative w-full max-w-full" // ⬅️ Dodane max-w-full
      style={
        {
          // mobile 1 karta, na lg ~2.33 karty
          '--cards': 1,
          '--cards-lg': desktopCardsPerView,
        } as React.CSSProperties
      }
    >
      {/* TOR */}
      <div
        ref={trackRef}
        className="no-scrollbar flex w-full max-w-full snap-x snap-mandatory overflow-x-auto px-1"
        style={{
          width: '100%',
          maxWidth: '80vw',
        }}
      >
        {children}
      </div>

      {/* Strzałki – wewnątrz kontenera, desktop only */}
      <button
        onClick={() => scroll('left')}
        className="bg-background/80 absolute top-1/2 left-1 z-10 hidden -translate-y-1/2 rounded-full border p-2 shadow md:block"
        aria-label="Prev"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => scroll('right')}
        className="bg-background/80 absolute top-1/2 right-1 z-10 hidden -translate-y-1/2 rounded-full border p-2 shadow md:block"
        aria-label="Next"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
