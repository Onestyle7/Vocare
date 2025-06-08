'use client';
import React, { useRef, ReactNode } from 'react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(SplitText, ScrollTrigger);

interface CopyProps {
  children: ReactNode;
  animateOnScroll?: boolean;
  delay?: number;
}

export default function Copy({ children, animateOnScroll = true, delay = 0 }: CopyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRefs = useRef<HTMLElement[]>([]);
  const splitRefs = useRef<SplitText[]>([]);
  const lines = useRef<HTMLElement[]>([]);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      splitRefs.current = [];
      lines.current = [];
      elementRefs.current = [];

      let elements: HTMLElement[] = [];

      if (containerRef.current.hasAttribute('data-copy-wrapper')) {
        elements = Array.from(containerRef.current.children) as HTMLElement[];
      } else {
        elements = [containerRef.current];
      }

      elements.forEach((element: HTMLElement) => {
        elementRefs.current.push(element);

        const split = SplitText.create(element, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'line++',
          lineThreshold: 0.1,
        });

        splitRefs.current.push(split);

        const computedStyle = window.getComputedStyle(element);
        const textIndent = computedStyle.textIndent;

        if (textIndent && textIndent !== '0px') {
          if (split.lines.length > 0) {
            (split.lines[0] as HTMLElement).style.paddingLeft = textIndent;
          }
          element.style.textIndent = '0';
        }

        lines.current.push(...(split.lines as HTMLElement[]));
      });

      gsap.set(lines.current, { y: '100%' });

      const animationProps = {
        y: '0%',
        duration: 1,
        stagger: 0.1,
        ease: 'power4.out',
        delay: delay,
      };

      if (animateOnScroll) {
        gsap.to(lines.current, {
          ...animationProps,
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 75%',
            once: true,
          },
        });
      } else {
        gsap.to(lines.current, animationProps);
      }

      return () => {
        splitRefs.current.forEach((split: SplitText) => {
          if (split) {
            split.revert();
          }
        });
      };
    },
    { scope: containerRef, dependencies: [animateOnScroll, delay] }
  );

  if (React.Children.count(children) === 1) {
    const child = React.Children.toArray(children)[0];

    // Sprawdzamy czy to jest React element (nie string, number, etc.)
    if (React.isValidElement(child)) {
      const element = child as React.ReactElement<{
        ref?: React.Ref<HTMLDivElement>;
      }>;
      return React.cloneElement(element, { ref: containerRef });
    }

    return <div ref={containerRef}>{child}</div>;
  }

  return (
    <div ref={containerRef} data-copy-wrapper="true">
      {children}
    </div>
  );
}
