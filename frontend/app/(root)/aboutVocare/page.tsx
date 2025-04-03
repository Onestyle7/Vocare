"use client"

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { plus } from '@/app/constants';
import AboutCard from '@/components/AboutCard';
import Section from '@/components/Section';
import { TextAnimate } from '@/components/magicui/text-animate';

gsap.registerPlugin(ScrollTrigger);

const About = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null); // Dodajemy ref dla h3

  // Animacja kart (pozostaje bez zmian)
  useEffect(() => {
    if (!window.matchMedia('(min-width: 1280px)').matches) return;
    if (!containerRef.current) return;
  
    const cards = containerRef.current.querySelectorAll('.about-card');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top center',
        end: '+=500 center',
        scrub: true,
      },
    });

    tl.fromTo(
      cards[2],
      { autoAlpha: 0, y: 100, rotation: 0 },
      { autoAlpha: 1, y: 0, rotation: -5, duration: 1 }
    );
    tl.fromTo(
      cards[1],
      { autoAlpha: 0, y: 100, rotation: 0 },
      { autoAlpha: 1, y: 0, rotation: -10, duration: 1 },
      "-=0.5"
    );
    tl.fromTo(
      cards[0],
      { autoAlpha: 0, y: 100, rotation: 0 },
      { autoAlpha: 1, y: 0, rotation: -3, duration: 1 },
      "-=0.5"
    );

    tl.to(cards[2], { y: 0, duration: 1 }, 1.5);
    tl.to(cards[1], { y: -20, duration: 1 }, 1.75);
    tl.to(cards[0], { y: -20, duration: 1 }, 1.9);

    tl.to(cards[2], { y: -660, rotation: 0, duration: 2 }, 3.0);
    tl.to(cards[1], { y: -640, rotation: 0, duration: 2 }, 3.25);
    tl.to(cards[0], { y: -620, rotation: 0, duration: 2 }, 3.5);
  }, []);

  // Nowa animacja dla h3
  useEffect(() => {
    if (!titleRef.current) return;

    gsap.fromTo(
      titleRef.current,
      { opacity: 0 }, // Początkowy stan
      {
        opacity: 1, // Końcowy stan
        duration: 1,
        scrollTrigger: {
          trigger: titleRef.current,
          start: 'bottom 80%', // Zaczyna się, gdy góra h3 jest w 80% wysokości viewportu
          end: 'top 20%',   // Kończy się, gdy góra h3 jest w 20% wysokości viewportu
          scrub: true,      // Płynne przejście zsynchronizowane ze scrollem
        },
      }
    );
  }, []);

  return (
    <Section
      className="pt-[7.5rem] -mt-[2.25rem] relative"
      crossesOffset="lg:translate-y-[7.5rem]"
      customPaddings
      id="about"
    >
      <div ref={containerRef} className="relative lg:w-full flex main-font-color">
        <div className="flex items-center justify-center w-full flex-col lg:flex-row lg:space-x-4 max-lg:space-y-4 mx-8">
          <div className="about-card">
            <AboutCard 
              img={plus} 
              title="Beginners friendly" 
              description="Jump right in! Our resources cater to all skill levels, ensuring a smooth learning curve for newcomers." 
            />
          </div>
          <div className="about-card">
            <AboutCard 
              img={plus} 
              title="Beginners friendly" 
              description="Jump right in! Our resources cater to all skill levels, ensuring a smooth learning curve for newcomers." 
            />
          </div>
          <div className="about-card">
            <AboutCard 
              img={plus} 
              title="Beginners friendly" 
              description="Jump right in! Our resources cater to all skill levels, ensuring a smooth learning curve for newcomers." 
            />
          </div>
        </div>
      </div>
      {/* <div className='w-full flex items-center justify-center px-[100px] lg:flex-row flex-col sm:mt-16 xl:-mt-[200px]'>
        <h3 
          ref={titleRef} 
          className='text-center lg:text-[108px] md:text-[80px] text-4xl lg:leading-20 font-bold uppercase'
        >
          Outmove <br /> the others. <br />Everyone.
        </h3>
      </div> */}
    </Section>
  );
};

export default About;