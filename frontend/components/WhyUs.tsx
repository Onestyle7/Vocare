"use client"

import React, { useEffect, useRef } from 'react'
import Section from './Section'
import Image from 'next/image'
import { plus } from '@/app/constants'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { AspectRatio } from '@radix-ui/react-aspect-ratio'

gsap.registerPlugin(ScrollTrigger)

const WhyUs = () => {
  const plusRef = useRef(null)

  useEffect(() => {
    const element = plusRef.current
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
    })
  }, [])

  return (
    <Section
      className="pt-[7.5rem] -mt-[2.25rem] relative"
      crossesOffset="lg:translate-y-[7.5rem]"
      customPaddings
      id="LearnMore"
    >
      <div className="flex flex-col mx-6 items-center justify-center">
        <div className="flex w-full items-center justify-center" ref={plusRef}>
          <Image src={plus} alt="plus" width={128} height={128} className='rotate-45 mb-10'/>
        </div>
        <div className='flex flex-col lg:flex-row items-start justify-between w-full lg:px-10 mt-10'>
          <div className='flex flex-row lg:w-1/2 w-full justify-between items-center'>
            <div className='flex items-center justify-start w-1/2'>
                <p className='text-4xl font-semibold'>1</p>
            </div>
            <div className='flex items-center lg:justify-start justify-end w-1/2'>
              <p className='text-4xl font-semibold'>Effects</p>
            </div>
          </div>
          <div className='flex flex-col items-center justify-center lg:justify-start lg:w-1/2'>
            <p className='lg:text-4xl text-2xl text-left max-sm:mt-6 lg:indent-[30%] font-semibold'>Made With Gsap brings together 50 effects that showcase fundamental web motion techniques:
            ❶ scroll animations ❷ mouse-based interactions ❸ drag movements, and more. Each effect is designed to inspire others.</p>
            <AspectRatio ratio={16 / 9} className="bg-muted mt-4">
              <Image
                src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
                alt="Photo by Drew Beamer"
                fill
                className="h-full w-full rounded-md object-cover"
              />
            </AspectRatio>
            <div className='flex flex-col w-full space-y-10'>
              <div className='flex flex-row w-full justify-between'>
                <p className='text-[14px] w-1/2'>
                  FREE GSAP CORE
                  NO WEBGL
                </p>
                <p className='text-right'>
                  Our effects use only the free GSAP core and plugins.
                </p>
              </div>
              <div className='flex flex-row w-full justify-between'>
                <div className='flex w-full'>
                <p className='text-[14px] w-1/2'>
                  FREE GSAP CORE
                  NO WEBGL
                </p>
                <p className='text-right'>
                All effects are fully compatible with Webflow, making it simple to integrate them into your website. By adding the code and assets, you can seamlessly add dynamic animations to your template.
                </p>
                </div>
              </div>
            </div>
          </div>
          </div>
      </div>
    </Section>
  )
}

export default WhyUs
