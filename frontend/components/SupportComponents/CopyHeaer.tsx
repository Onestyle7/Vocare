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

export default function CopyHeader({ children, animateOnScroll = true, delay = 0 }: CopyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRefs = useRef<HTMLElement[]>([]);
  const splitRefs = useRef<SplitText[]>([]);
  const lines = useRef<HTMLElement[]>([]);
  const masks = useRef<HTMLElement[]>([]); // 👈 NEW

  useGSAP(
    () => {
      if (!containerRef.current) return;

      splitRefs.current = [];
      lines.current = [];
      masks.current = [];
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
          linesClass: 'copy-line', // 👈 change from line++
          lineThreshold: 0.1,
        });

        splitRefs.current.push(split);

        // zachowanie indentu
        const computedStyle = window.getComputedStyle(element);
        const textIndent = computedStyle.textIndent;

        if (textIndent && textIndent !== '0px') {
          if (split.lines.length > 0) {
            (split.lines[0] as HTMLElement).style.paddingLeft = textIndent;
          }
          element.style.textIndent = '0';
        }

        // LINES
        const splitLines = split.lines as HTMLElement[];
        splitLines.forEach((l) => {
          l.style.display = 'block';
          l.style.willChange = 'transform';
        });
        lines.current.push(...splitLines);

        // MASKS (to one ucinają diakrytyki)
        // SplitText trzyma je pod split.masks (nie jest typowane w TS)
        const splitMasks = (split as unknown as { masks?: HTMLElement[] }).masks ?? [];
        splitMasks.forEach((m) => {
          m.style.display = 'block';
          m.style.overflow = 'hidden';
          // 👇 “bleed” żeby nie ucinało ł/ś/ć itp.
          m.style.paddingTop = '0.12em';
          m.style.paddingBottom = '0.18em';
          // żeby padding nie rozwalał spacingu
          m.style.marginTop = '-0.12em';
          m.style.marginBottom = '-0.18em';
        });
        masks.current.push(...splitMasks);
      });

      // start state: schowane linie
      gsap.set(lines.current, { yPercent: 110 });

      const animationProps = {
        yPercent: 0,
        duration: 1,
        stagger: 0.1,
        ease: 'power4.out',
        delay,
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
        splitRefs.current.forEach((split) => split?.revert());
      };
    },
    { scope: containerRef, dependencies: [animateOnScroll, delay] }
  );

  if (React.Children.count(children) === 1) {
    const child = React.Children.toArray(children)[0];

    if (React.isValidElement(child)) {
      const element = child as React.ReactElement<{ ref?: React.Ref<HTMLDivElement> }>;
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
