import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

export class SmoothScroll {
  private lenis: Lenis | null = null;
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    if (this.isInitialized) return;

    // Rejestracja pluginu GSAP
    gsap.registerPlugin(ScrollTrigger);

    // Inicjalizacja Lenis
    this.lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    // Połączenie Lenis z ScrollTrigger
    this.lenis.on('scroll', ScrollTrigger.update);

    // Dodanie do GSAP ticker
    gsap.ticker.add((time) => {
      if (this.lenis) {
        this.lenis.raf(time * 1000);
      }
    });

    gsap.ticker.lagSmoothing(0);

    this.isInitialized = true;
  }

  public scrollTo(target: string | number, options?: { offset?: number; duration?: number }) {
    if (this.lenis) {
      this.lenis.scrollTo(target, {
        offset: options?.offset || 0,
        duration: options?.duration || 1.2,
      });
    }
  }

  public stop() {
    if (this.lenis) {
      this.lenis.stop();
    }
  }

  public start() {
    if (this.lenis) {
      this.lenis.start();
    }
  }

  public destroy() {
    if (this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }
    this.isInitialized = false;
  }
}

// Hook dla React
export const useSmoothScroll = () => {
  const smoothScrollRef = React.useRef<SmoothScroll | null>(null);

  React.useEffect(() => {
    smoothScrollRef.current = new SmoothScroll();

    return () => {
      if (smoothScrollRef.current) {
        smoothScrollRef.current.destroy();
      }
    };
  }, []);

  return {
    scrollTo: (target: string | number, options?: { offset?: number; duration?: number }) => {
      smoothScrollRef.current?.scrollTo(target, options);
    },
    stop: () => smoothScrollRef.current?.stop(),
    start: () => smoothScrollRef.current?.start(),
  };
};

// Wersja dla komponentów klasowych lub bezpośredniego użycia
export const initSmoothScroll = (): SmoothScroll => {
  return new SmoothScroll();
};

// Import React dla hooka
import React from 'react';
