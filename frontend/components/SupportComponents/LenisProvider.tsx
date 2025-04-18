'use client';
import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.style.height = '100%';
    document.documentElement.style.height = '100%';

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.5,
      smoothWheel: true,
      wheelMultiplier: 1,
      lerp: 0.08,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    const wrapper = document.querySelector('[data-lenis-wrapper]');
    const resizeObserver = new ResizeObserver(() => {
      lenis.resize();
    });

    if (wrapper) {
      resizeObserver.observe(wrapper);
    }

    const handleLoad = () => {
      setTimeout(() => {
        lenis.resize();
      }, 500);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      lenis.destroy();
      resizeObserver.disconnect();
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  return <div data-lenis-wrapper className="min-h-screen">{children}</div>;
}
