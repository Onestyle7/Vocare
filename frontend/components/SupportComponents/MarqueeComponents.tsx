'use client';

import { useEffect, useRef } from 'react';
import { setupMarqueeAnimation } from './marquee';

interface MarqueeProps {
  texts: string[];
  className?: string;
}

export default function MarqueeComponent({ texts, className = '' }: MarqueeProps) {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    // Setup animation when component mounts
    const timeline = setupMarqueeAnimation();
    timelineRef.current = timeline;

    // Cleanup function
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, []);

  return (
    <div ref={marqueeRef} className={`marquee overflow-hidden whitespace-nowrap ${className}`}>
      {texts.map((text, index) => (
        <h1 key={index} className="mr-8 inline-block text-4xl font-bold">
          {text}
        </h1>
      ))}
    </div>
  );
}
