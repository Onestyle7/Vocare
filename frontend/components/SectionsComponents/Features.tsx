"use client"
import React from 'react'
import gsap from 'gsap';
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/all';
import Image from 'next/image';
import { plus } from '@/app/constants';
import ContentPage from '../ui/ContentPage';
import ContentPage2 from '../ui/CustomPage2';
import ContentPage3 from '../ui/CustomPage3';

gsap.registerPlugin(ScrollTrigger);

const Features = () => {
  const colorPanels = [
    { 
      title: "First Panel", 
      content: <div className="panel-content">
        <ContentPage />
      </div>
    },
    { 
      title: "Second Panel", 
      content: <div className="panel-content">
        <ContentPage2 />
      </div>
    },
    { 
      title: "Third Panel", 
      content: <div className="panel-content">
        <ContentPage3 />
      </div>
    },
  ];
  

  useGSAP(() => {
    const clipAnimation = gsap.timeline({
      scrollTrigger: {
        trigger: "#clip",
        start: "center center",
        end: "+=3000 center",
        scrub: 0.5,
        pin: true,
        pinSpacing: true,
      },
    });
    
    clipAnimation.to(".mask-clip-path", {
      width: "100vw",
      height: "100vh",
      borderRadius: 0,
      duration: 1,
    });
    
    clipAnimation.to("#vocare-text", {
      opacity: 0,
      scale: 0.3,
      duration: 0.7,
    });
    
    colorPanels.forEach((_, index) => {
      const currentPanelId = `#panel-${index + 1}`;
      
      clipAnimation.fromTo(currentPanelId,
        {
          x: "100vw",
          opacity: 1,
        },
        {
          x: 0, 
          opacity: 1,
          duration: 1,
        }
      );

    });
    
    clipAnimation.fromTo("#vocare-text",
      {
        opacity: 0,
        scale: 0.2,
      },
      {
        opacity: 1,
        scale: 1,
        duration: 1.5,
      }
    );
    
    gsap.to("#plus", {
      rotation: 360,
      y: 300,
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
      ease: "none",
      scrollTrigger: {
        trigger: ".mask-clip-path",
        start: "top top",
        end: "+=400 top",
        scrub: true,
      }
    });
  });
  
  return (
    <div className='min-h-screen w-screen'>
      <div className="mb-8 mt-36 relative flex flex-col items-center gap-5">
        <h2 className='text-sm uppercase md:text-[10px]'>seamless integration</h2>
        <div className="mt-5 text-center text-4xl uppercase leading-[0.8] md:text-[6rem] font-bold">
          Discover the world <br /> <span>dive into it</span>
        </div>
        <div className="absolute bottom-[-80dvh] left-1/2 w-full max-w-96 -translate-x-1/2 text-center font-circular-web text-lg md:max-w-[34rem]">
          <p>The game of games beginns</p>
          <p>let us rocket Your career to the sky</p>
        </div>
      </div>
      <div className="h-dvh w-screen" id="clip">
        <div className="mask-clip-path absolute left-1/2 top-0 z-20 h-[60vh] w-96 origin-center -translate-x-1/2 overflow-hidden rounded-3xl md:w-[30vw]">
          <div className="absolute left-0 top-0 w-full h-full object-cover bg-[#101014] dark:bg-[#F3F3F3]">
            <div className='flex items-center justify-center h-full'>
              <div className='flex items-center justify-center text-black flex-col relative w-full h-full'>
                <h2 className='lg:text-[400px] text-4xl text-white opacity-0 uppercase font-bold absolute' id='subtext'>
                  <span id="vocare-text" className='dark:text-black'>VOCARE</span>
                </h2>
                {colorPanels.map((panel, index) => (
                  <div 
                    key={`panel-${index + 1}`} 
                    id={`panel-${index + 1}`} 
                    className="absolute w-full h-full flex items-center justify-center flex-col"
                    style={{ 
                      transform: 'translateX(100vw)' 
                    }}
                  >
                    {panel.content}
                  </div>
                ))}
                <Image src={plus} alt='plus' width={84} height={84} id='plus' className='absolute dark:invert'/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Features;
