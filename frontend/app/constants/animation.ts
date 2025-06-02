// animation.ts
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import React from 'react';

// Rejestrujemy plugin ScrollTrigger
gsap.registerPlugin(ScrollTrigger, SplitText);

interface TextAnimationOptions {
  selector?: string;
  duration?: number;
  stagger?: number;
  ease?: string;
  scrollTrigger?: {
    markers?: boolean;
    start?: string;
    end?: string;
    toggleActions?: string;
  };
}

export const animateTextLines = (
  element: HTMLElement | string,
  options: TextAnimationOptions = {}
): (() => void) => {
  // Domyślne opcje
  const defaultOptions = {
    duration: 0.8,
    stagger: 0.2,
    ease: 'power2.out',
    scrollTrigger: {
      markers: false,
      start: 'top 85%',
      end: 'bottom 20%',
      toggleActions: 'play none none reset',
    },
  };

  const config = { ...defaultOptions, ...options };

  // Pobieramy element
  const targetElement =
    typeof element === 'string' ? (document.querySelector(element) as HTMLElement) : element;

  if (!targetElement) {
    console.warn('Element not found for text animation');
    return () => {};
  }

  // Dzielimy tekst na linie
  const splitText = new SplitText(targetElement, { type: 'lines' });
  const lines = splitText.lines;

  // Opakowujemy każdą linię w dodatkowy div
  lines.forEach((line) => {
    const wrapper = document.createElement('div');
    wrapper.style.overflow = 'hidden';
    line.parentNode?.insertBefore(wrapper, line);
    wrapper.appendChild(line);
  });

  // Animujemy linie
  gsap.fromTo(
    lines,
    {
      yPercent: 100,
      opacity: 0,
    },
    {
      yPercent: 0,
      opacity: 1,
      duration: config.duration,
      stagger: config.stagger,
      ease: config.ease,
      scrollTrigger: {
        trigger: targetElement,
        start: config.scrollTrigger.start,
        end: config.scrollTrigger.end,
        toggleActions: config.scrollTrigger.toggleActions,
      },
    }
  );

  // Zwracamy funkcję cleanup
  return () => {
    splitText.revert();
  };
};

// Eksportujemy również wersję dla useEffect
export const useTextLinesAnimation = (
  elementRef: React.RefObject<HTMLElement> | string,
  options: TextAnimationOptions = {},
  dependencies: React.DependencyList = []
) => {
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const element =
      typeof elementRef === 'string'
        ? (document.querySelector(elementRef) as HTMLElement)
        : elementRef.current;

    if (!element) return;

    const cleanup = animateTextLines(element, options);

    return cleanup;
  }, dependencies);
};
