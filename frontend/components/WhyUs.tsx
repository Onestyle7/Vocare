'use client';

import React, { useEffect, useRef } from 'react';
import Section from './Section';
import Image from 'next/image';
import { plus } from '@/app/constants';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AspectRatio } from '@radix-ui/react-aspect-ratio';

gsap.registerPlugin(ScrollTrigger);

const WhyUs = () => {
  const plusRef = useRef(null);

  useEffect(() => {
    const element = plusRef.current;
    gsap.to(element, {
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        end: 'bottom center',
        scrub: true,
      },
      rotation: 360,
      scale: 1.1,
      ease: 'none',
    });
  }, []);

  return (
    <Section
      className="relative -mt-[2.25rem] pt-[7.5rem]"
      crossesOffset="lg:translate-y-[7.5rem]"
      customPaddings
      id="LearnMore"
    >
      <div className="mx-6 flex flex-col items-center justify-center">
        <div className="flex w-full items-center justify-center" ref={plusRef}>
          <Image src={plus} alt="plus" width={128} height={128} className="mb-10 rotate-45" />
        </div>
        <div className="mt-10 flex w-full flex-col items-start justify-between lg:flex-row lg:px-10">
          <div className="flex w-full flex-row items-center justify-between lg:w-1/2">
            <div className="flex w-1/2 items-center justify-start">
              <p className="text-4xl font-semibold">1</p>
            </div>
            <div className="flex w-1/2 items-center justify-end lg:justify-start">
              <p className="text-4xl font-semibold">Effects</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center lg:w-1/2 lg:justify-start">
            <p className="text-left text-2xl font-semibold max-sm:mt-6 lg:indent-[30%] lg:text-4xl">
              Made With Gsap brings together 50 effects that showcase fundamental web motion
              techniques: ❶ scroll animations ❷ mouse-based interactions ❸ drag movements, and more.
              Each effect is designed to inspire others.
            </p>
            <AspectRatio ratio={16 / 9} className="bg-muted mt-4">
              <Image
                src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
                alt="Photo by Drew Beamer"
                fill
                className="h-full w-full rounded-md object-cover"
              />
            </AspectRatio>
            <div className="flex w-full flex-col space-y-10">
              <div className="flex w-full flex-row justify-between">
                <p className="w-1/2 text-[14px]">FREE GSAP CORE NO WEBGL</p>
                <p className="text-right">Our effects use only the free GSAP core and plugins.</p>
              </div>
              <div className="flex w-full flex-row justify-between">
                <div className="flex w-full">
                  <p className="w-1/2 text-[14px]">FREE GSAP CORE NO WEBGL</p>
                  <p className="text-right">
                    All effects are fully compatible with Webflow, making it simple to integrate
                    them into your website. By adding the code and assets, you can seamlessly add
                    dynamic animations to your template.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default WhyUs;
