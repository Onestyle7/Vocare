'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const GenerateWithBrackets = () => {
  const leftBracketRef = useRef<SVGSVGElement | null>(null);
  const rightBracketRef = useRef<SVGSVGElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    tl.from(leftBracketRef.current, {
      x: -100,
      opacity: 0,
      duration: 0.6,
    })
      .from(
        textRef.current,
        {
          y: 50,
          opacity: 0,
          duration: 0.6,
        },
        '-=0.3'
      )
      .from(
        rightBracketRef.current,
        {
          x: 100,
          opacity: 0,
          duration: 0.6,
        },
        '-=0.4'
      );
  }, []);

  return (
    <div className="mt-20 flex items-center justify-center gap-4 text-black">
      {/* Lewy nawias */}
      <svg
        ref={leftBracketRef}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="h-auto w-[clamp(1rem,5vw,4rem)]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M9 4c-2 2-3 4.5-3 8s1 6 3 8" />
      </svg>

      {/* Tekst */}
      <span ref={textRef} className="text-[clamp(2rem,6vw,6rem)] font-semibold">
        Generate
      </span>

      {/* Prawy nawias */}
      <svg
        ref={rightBracketRef}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="h-auto w-[clamp(1rem,5vw,4rem)]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M15 4c2 2 3 4.5 3 8s-1 6-3 8" />
      </svg>
    </div>
  );
};

export default GenerateWithBrackets;
