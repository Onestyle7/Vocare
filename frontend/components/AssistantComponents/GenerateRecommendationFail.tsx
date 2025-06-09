'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowRight } from 'lucide-react';
import { letterImg } from '@/app/constants';
import Image from 'next/image';
import Link from 'next/link';
import CustomButton from '../ui/CustomButton';

const GenerateRecommendationFail = () => {
  const flippingURef = useRef<HTMLSpanElement | null>(null);
  const shakeRef = useRef<HTMLSpanElement | null>(null);
  const flowerRef = useRef<HTMLImageElement | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    if (flippingURef.current) {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 2, defaults: { ease: 'power2.inOut' } });
      tl.to(flippingURef.current, {
        rotateX: 180,
        duration: 0.6,
      }).to(flippingURef.current, {
        rotateX: 0,
        duration: 0.6,
      });
    }

    if (shakeRef.current) {
      gsap.to(shakeRef.current, {
        keyframes: [
          { x: -1, rotation: -2 },
          { x: 1, rotation: 2 },
          { x: -1, rotation: -1 },
          { x: 1, rotation: 1 },
          { x: 0, rotation: 0 },
        ],
        duration: 0.4,
        repeat: -1,
        repeatDelay: 2,
        ease: 'power1.inOut',
      });
    }

    if (flowerRef.current) {
      gsap.to(flowerRef.current, {
        rotate: 360,
        duration: 3,
        ease: 'power4.out',
        repeat: -1,
        repeatDelay: 1,
        transformOrigin: '50% 50%',
      });
    }
  }, []);

  return (
    <div className="fixed inset-0 flex h-screen w-screen items-center justify-center overflow-hidden">
      <div className="flex max-w-full flex-col items-center justify-center">
        <div className="flex w-full flex-col">
          <div className="flex">
            <h1 className="text-[clamp(4rem,18vw,14rem)] leading-none font-semibold">
              Crea
              <span ref={shakeRef} className="inline-block origin-center">
                t
              </span>
              e
            </h1>
          </div>

          <div className="flex items-center justify-end gap-4">
            <Image
              ref={flowerRef}
              width={64}
              height={64}
              src={letterImg}
              alt="letter"
              className="mr-10 h-auto w-[clamp(50px,8vw,120px)] scale-125 object-contain"
            />

            <h1 className="flex items-center text-[clamp(4rem,18vw,14rem)] leading-none font-semibold">
              f<span>u</span>t
              <span ref={flippingURef} className="inline-block origin-center">
                u
              </span>
              re
            </h1>
          </div>

          <div className="mt-8 flex w-full flex-col items-center justify-between space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="flex items-center">
              <div className="-mr-4 flex scale-125 items-center xl:scale-150">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="h-[60px] w-auto text-black dark:text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                >
                  <path d="M12 4c-1.5 0-2.5 1.2-2.5 2.5v3c0 1-1 2-2 2 1 0 2 1 2 2v3c0 1.3 1 2.5 2.5 2.5" />
                </svg>
              </div>
              <div className="flex min-h-[60px] items-center text-center text-[clamp(1.2rem,1vw,2rem)] leading-snug text-black dark:text-white">
                <span>
                  You have to fill the <br /> profile form first
                </span>
              </div>
              <div className="-ml-4 flex scale-125 items-center xl:scale-150">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="h-[60px] w-auto text-black dark:text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                >
                  <path d="M12 4c1.5 0 2.5 1.2 2.5 2.5v3c0 1 1 2 2 2-1 0-2 1-2 2v3c0 1.3-1 2.5-2.5 2.5" />
                </svg>
              </div>
            </div>

            <Link href={isLoggedIn ? '/profile' : '/sign-in'}>
              <CustomButton className="group flex h-[56px] cursor-pointer items-center justify-center rounded-full bg-[#915EFF] px-6 text-[clamp(1.1rem,1vw,1.5rem)] font-medium text-white hover:bg-[#7b4ee0] max-md:mt-6 xl:w-[280px] font-poppins">
                <span className="flex flex-row items-center">
                  {isLoggedIn ? 'Profile' : 'Create an account'}
                  <ArrowRight className="ml-2 scale-90 transition-transform duration-300 group-hover:translate-x-2" />
                </span>
              </CustomButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateRecommendationFail;
