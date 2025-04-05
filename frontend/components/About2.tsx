"use client"

import React from 'react'
import gsap from 'gsap';
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/all';
import Image from 'next/image';
import { plus } from '@/app/constants';

gsap.registerPlugin(ScrollTrigger)

const About2 = () => {

  useGSAP(() => {
    const clipAnimation = gsap.timeline({
      scrollTrigger: {
        trigger: "#clip",
        start: "center center",
        end: "+=800 center",
        scrub: 0.5,
        pin: true,
        pinSpacing: true,
      },
    });
  
    clipAnimation.to(".mask-clip-path", {
      width: "100vw",
      height: "100vh",
      borderRadius: 0,
    });
  
    gsap.to("#plus", {
      rotation: 360,
      x: -150,
      ease: "none",
      scrollTrigger: {
        trigger: ".mask-clip-path",
        start: "top top",
        end: "bottom top",
        scrub: true,
      }
    });

    gsap.to("#subtext", {
      opacity: 1,
      xPercent: -50,
      ease: "none",
      scrollTrigger: {
        trigger: ".mask-clip-path",
        start: "top top",
        end: "bottom top",
        scrub: true,
      }
    });
  });

  return (
    <div className='min-h-screen w-screen'>
      <div className="mb-8 mt-36 relative flex flex-col items-center gap-5">
          <h2 className='text-sm uppercase md:text-[10px]'>seamless integration</h2>
          <div className="mt-5 text-center text-4xl uppercase leading-[0.8] md:text-[6rem] font-bold">
              Discover the world <br /> dive into it
          </div>
          <div className="absolute bottom-[-80dvh] left-1/2 w-full max-w-96 -translate-x-1/2 text-center font-circular-web text-lg md:max-w-[34rem]">
            <p>The game of games beginns</p>
            <p>let us rocket Your career to the sky</p>
          </div>
      </div>

      <div className="h-dvh w-screen" id="clip">
          <div className="mask-clip-path absolute left-1/2 top-0 z-20 h-[60vh] w-96 origin-center -translate-x-1/2 overflow-hidden rounded-3xl md:w-[30vw]">
            <div className="absolute left-0 top-0 w-full h-full object-cover bg-black dark:bg-white">
                <div className='flex items-center justify-center h-full'>
                  <div className='flex items-center justify-center text-black'>
                      <Image src={plus} alt='plus' width={84} height={84} id='plus' className='absolute'/>
                      <p className='text-white opacity-0 text-4xl font-bold ml-[500px] flex' id='subtext'>AI Assisstant</p>
                  </div>
                </div>
            </div>
          </div>
      </div>
    </div>
  )
}

export default About2
