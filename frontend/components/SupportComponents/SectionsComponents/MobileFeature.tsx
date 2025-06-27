'use client';
import React, { useRef, useEffect } from 'react';
import { ScrollParallax } from 'react-just-parallax';
import { Search, CheckCircle, ListChecks } from 'lucide-react';
import { SplitText, ScrollTrigger } from 'gsap/all';

import { gsap } from 'gsap';
import { avatars, mobileView, shape1 } from '@/app/constants';
import Section from '../Section';
import Iphone15Pro from '@/components/magicui/iphone-15-pro';
import { AvatarCircles } from '@/components/magicui/avatar-circles';
import Image from 'next/image';
import Copy from '../Copy';

gsap.registerPlugin(SplitText, ScrollTrigger);

const MobileFeature = () => {
  const parallaxRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const textElement = textRef.current;
    const iconElement = iconRef.current;

    const states = [
      { text: 'thinking...', icon: <ListChecks size={16} /> },
      { text: 'searching...', icon: <Search size={16} /> },
      { text: 'completed', icon: <CheckCircle size={16} /> },
    ];

    const tl = gsap.timeline({
      repeat: -1,
    });

    states.forEach((state) => {
      tl.call(() => {
        if (textElement) {
          textElement.textContent = state.text;
        }
        if (iconElement) {
          while (iconElement.firstChild) {
            iconElement.removeChild(iconElement.firstChild);
          }

          const IconComponent = state.icon.type;
          const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svgElement.setAttribute('width', '16');
          svgElement.setAttribute('height', '16');
          svgElement.setAttribute('viewBox', '0 0 24 24');
          svgElement.setAttribute('stroke', 'currentColor');
          svgElement.setAttribute('stroke-width', '2');
          svgElement.setAttribute('fill', 'none');
          svgElement.setAttribute('stroke-linecap', 'round');
          svgElement.setAttribute('stroke-linejoin', 'round');

          if (IconComponent === ListChecks) {
            const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path1.setAttribute('d', 'M9 6h11');
            svgElement.appendChild(path1);

            const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path2.setAttribute('d', 'M9 12h11');
            svgElement.appendChild(path2);

            const path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path3.setAttribute('d', 'M9 18h11');
            svgElement.appendChild(path3);

            const path4 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path4.setAttribute('d', 'M5 6l-1 1-1-1');
            svgElement.appendChild(path4);

            const path5 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path5.setAttribute('d', 'M5 12l-1 1-1-1');
            svgElement.appendChild(path5);

            const path6 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path6.setAttribute('d', 'M5 18l-1 1-1-1');
            svgElement.appendChild(path6);
          } else if (IconComponent === Search) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '11');
            circle.setAttribute('cy', '11');
            circle.setAttribute('r', '8');
            svgElement.appendChild(circle);

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', '21');
            line.setAttribute('y1', '21');
            line.setAttribute('x2', '16.65');
            line.setAttribute('y2', '16.65');
            svgElement.appendChild(line);
          } else if (IconComponent === CheckCircle) {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M22 11.08V12a10 10 0 1 1-5.93-9.14');
            svgElement.appendChild(path);

            const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            polyline.setAttribute('points', '22 4 12 14.01 9 11.01');
            svgElement.appendChild(polyline);
          }

          iconElement.appendChild(svgElement);
        }
      });

      tl.fromTo(
        containerRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.5 }
      );

      tl.to({}, { duration: 3.5 });

      tl.to(containerRef.current, { opacity: 0, scale: 0.9, duration: 0.5 });

      tl.to({}, { duration: 0.2 });
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <Section
      crosses
      customPaddings
      className="relative px-10 max-md:mt-14"
      crossesOffset
      id="brain"
    >
      <ScrollParallax isAbsolutelyPositioned zIndex={-20}>
        <div className="absolute top-1/4 left-2 z-20 max-sm:-left-10 xl:bottom-1/5">
          <Image src={shape1} alt="shape" width={78} height={78} className="-rotate-20" />
        </div>
        <div className="absolute right-2 bottom-1/4 z-20 max-sm:-right-10 xl:bottom-1/5">
          <Image src={shape1} alt="shape" width={78} height={78} className="-rotate-20" />
        </div>
      </ScrollParallax>
      <div className="mt-4 min-h-screen xl:border-t xl:border-b">
        <div className="relative mx-[10%] mb-8 flex flex-col items-center gap-5">
          <h2 className="mt-[36px] text-sm uppercase md:text-[12px]">Always in Your pocket</h2>
          <Copy>
            <h1 className="font-poppins text-color mt-5 text-center text-4xl font-bold md:text-[4rem] xl:leading-[0.8]">
              Your advisor <br /> always with you
            </h1>
          </Copy>

          <div className="mt-10 flex h-[45dvh] w-full flex-col items-center justify-center lg:flex-row">
            <div className="flex h-full w-full flex-col max-xl:space-x-20 max-lg:space-y-12 max-lg:space-x-0 lg:flex-row">
              <div className="relative flex h-full lg:w-1/2" ref={parallaxRef}>
                <Iphone15Pro className="size-full" src={mobileView} />
                <ScrollParallax isAbsolutelyPositioned>
                  <div className="absolute top-1/4 flex h-[50px] w-[150px] translate-x-1/2 translate-y-10 items-center justify-center rounded-xl border border-white/40 bg-[#F3F3F3]/30 backdrop-blur-sm max-sm:translate-x-3">
                    <div className="flex items-center justify-center">
                      <AvatarCircles avatarUrls={avatars} numPeople={99} />
                    </div>
                  </div>
                </ScrollParallax>
                <ScrollParallax isAbsolutelyPositioned>
                  <div
                    className="absolute right-1/6 bottom-1/3 flex h-[50px] w-[150px] translate-y-10 items-center justify-center rounded-xl border border-white/40 bg-[#F3F3F3]/30 backdrop-blur-sm max-sm:translate-x-16"
                    ref={containerRef}
                  >
                    <div className="flex items-center justify-center font-semibold">
                      <div className="mr-2" ref={iconRef}>
                        <ListChecks size={16} />
                      </div>
                      <span ref={textRef}>recommendations...</span>
                    </div>
                  </div>
                </ScrollParallax>
              </div>
              <div className="flex h-full flex-col items-center justify-center text-xl font-light sm:text-3xl lg:w-1/2">
                <div className="overflow-hidden p-2">
                  <Copy>
                    <h3 className="font-poppins mx-0 text-3xl leading-[1.2]">
                      Unlock your future with our mobile app, designed to guide you through every
                      step of your career journey.
                    </h3>
                  </Copy>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default MobileFeature;
