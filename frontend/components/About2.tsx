"use client"

import React from 'react'
import gsap from 'gsap';
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/all';


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
      });

  return (
    <div className='min-h-screen w-screen'>
            <div className="mb-8 mt-36 relative flex flex-col items-center gap-5">
                <h2 className='text-sm uppercase md:text-[10px]'>seamless integration</h2>
                <div className="mt-5 text-center text-4xl uppercase leading-[0.8] md:text-[6rem] font-semibold">
                    Discover the world <br /> dive into it
                </div>
                <div className="absolute bottom-[-80dvh] left-1/2 w-full max-w-96 -translate-x-1/2 text-center font-circular-web text-lg md:max-w-[34rem]"><p>The game of games beginns</p>
                    <p>
                        let us rocket Your career to the sky
                    </p>
                </div>
            </div>

            <div className="h-dvh w-screen" id="clip">
                <div className="mask-clip-path absolute left-1/2 top-0 z-20 h-[60vh] w-96 origin-center -translate-x-1/2 overflow-hidden rounded-3xl md:w-[30vw]">
                <img
                    src="/images/about.webp"
                    alt="Background"
                    className="absolute left-0 top-0 w-full h-full object-cover"
                />
                </div>
            </div>
            </div>
  )
}

export default About2