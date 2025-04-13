'use client';
import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.style.height = '100%';
    document.documentElement.style.height = '100%';

    const lenis = new Lenis({
      duration: 1.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.5,
      smoothWheel: true,
      wheelMultiplier: 1,
      lerp: 0.1,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    const resizeObserver = new ResizeObserver(() => {
      lenis.resize();
    });

    resizeObserver.observe(document.body);

    window.addEventListener('load', () => {
      setTimeout(() => {
        lenis.resize();
      }, 500);
    });

    return () => {
      lenis.destroy();
      resizeObserver.disconnect();
    };
  }, []);

  return <div data-lenis-wrapper>{children}</div>;
}
