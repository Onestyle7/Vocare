"use client"

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const Faq: React.FC = () => {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textRef.current) {
      gsap.set(textRef.current, { 
        x: '-90%',
        whiteSpace: 'nowrap',
      });

      gsap.to(textRef.current, {
        x: '80%',
        ease: 'power2.out',
        scrollTrigger: {
          trigger: textRef.current,
          start: 'top 80%',   
          end: 'bottom -50%', 
          scrub: true,
        },
      });
    }
  }, []);

  return (
    <section className="relative w-[100vw] h-[100vh] flex overflow-hidden max-xl:mt-[220px]">
      <div className="items-center justify-center flex w-full my-10 bg-[#101014] dark:bg-[#F3F3F3]">
        <div
          ref={textRef}
          className="w-full items-center justify-center flex xl:text-[180px] text-4xl font-bold text-[#F3F3F3] dark:text-[#101014]"
        >
          Ready to change Your life?
        </div>
      </div>
    </section>
  );
};

export default Faq;