'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Rejestrujemy plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface AnimatedTextH3Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const AnimatedTextH3: React.FC<AnimatedTextH3Props> = ({ children, className = '', delay = 0 }) => {
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    // Dzielimy tekst na poszczególne litery
    const text = element.textContent || '';
    const letters = text
      .split('')
      .map((letter) => {
        return `<span style="display: inline-block; transform: translateY(20px); opacity: 0; overflow: hidden;">${letter === ' ' ? '&nbsp;' : letter}</span>`;
      })
      .join('');

    element.innerHTML = letters;
    const letterElements = element.querySelectorAll('span');

    // Ustaw początkowy stan - niewidoczne ale w pozycji
    gsap.set(letterElements, {
      y: 20,
      opacity: 0,
    });

    // Animacja z ScrollTrigger - płynne pojawianie się
    const animation = gsap.to(letterElements, {
      y: 0,
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out',
      stagger: 0.04,
      paused: true, // Zatrzymujemy animację
    });

    // ScrollTrigger z właściwym delay
    ScrollTrigger.create({
      trigger: element,
      start: 'top 85%',
      end: 'bottom 20%',
      onEnter: () => {
        gsap.delayedCall(delay, () => animation.play());
      },
      onLeave: () => animation.reverse(),
      onEnterBack: () => {
        gsap.delayedCall(delay, () => animation.play());
      },
      onLeaveBack: () => animation.reverse(),
    });

    // Cleanup function
    return () => {
      animation.kill();
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.trigger === element) {
          trigger.kill();
        }
      });
    };
  }, [delay]);

  return (
    <h3 ref={textRef} className={className}>
      {children}
    </h3>
  );
};

export default AnimatedTextH3;
