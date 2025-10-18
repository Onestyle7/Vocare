'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/all';
import Section from '../SupportComponents/Section';

gsap.registerPlugin(SplitText);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const splitElement = document.querySelector('#split');
    if (!splitElement) return;

    const mySplitText = new SplitText(splitElement, { type: 'chars' });
    const chars = mySplitText.chars;

    gsap.from(chars, {
      yPercent: 140,
      stagger: 0.02,
      ease: 'back.out',
      duration: 0.8,
      scrollTrigger: {
        trigger: '#split',
        start: 'top 90%',
        toggleActions: 'play none none reset',
      },
    });

    return () => {
      mySplitText.revert();
    };
  }, []);

  return (
    <Section crosses customPaddings className="relative" crossesOffset id="faq">
      <section className="relative flex h-[100vh] 2xl:h-[50vh] overflow-hidden max-xl:mt-[320px] xl:px-10">
        <div className="font-bold xl:mt-20 my-10 flex w-full items-center justify-center bg-[#101014] dark:bg-[#F3F3F3]">
          <div
            ref={textRef}
            className="font-korbin flex w-full items-center justify-center text-3xl text-[#F3F3F3] xl:text-[180px] dark:text-[#101014]"
          >
            Ready to change your life?
          </div>
        </div>
      </section>
    </Section>
  );
};

export default Faq;
