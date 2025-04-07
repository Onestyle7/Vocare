"use client"
import React, { useRef, useEffect } from 'react'
import Section from '../Section'
import Iphone15Pro from '../magicui/iphone-15-pro'
import { ScrollParallax } from "react-just-parallax";
import CustomButton from '../ui/CustomButton';
import { ArrowRight, Search, CheckCircle, ListChecks } from 'lucide-react';

import { gsap } from 'gsap';
import { AvatarCircles } from '../magicui/avatar-circles';
import { avatars, mobileView } from '@/app/constants';

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
      { text: "thinking...", icon: <ListChecks size={16} /> },
      { text: "searching...", icon: <Search size={16} /> },
      { text: "completed", icon: <CheckCircle size={16} /> }
    ];
    
    const tl = gsap.timeline({
      repeat: -1,
    });
    
    states.forEach((state, index) => {
      tl.call(() => {
        if (textElement) {
          textElement.textContent = state.text;
        }
        if (iconElement) {
          while (iconElement.firstChild) {
            iconElement.removeChild(iconElement.firstChild);
          }
          
          const IconComponent = state.icon.type;
          const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svgElement.setAttribute("width", "16");
          svgElement.setAttribute("height", "16");
          svgElement.setAttribute("viewBox", "0 0 24 24");
          svgElement.setAttribute("stroke", "currentColor");
          svgElement.setAttribute("stroke-width", "2");
          svgElement.setAttribute("fill", "none");
          svgElement.setAttribute("stroke-linecap", "round");
          svgElement.setAttribute("stroke-linejoin", "round");
          
          if (IconComponent === ListChecks) {
            const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path1.setAttribute("d", "M9 6h11");
            svgElement.appendChild(path1);
            
            const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path2.setAttribute("d", "M9 12h11");
            svgElement.appendChild(path2);
            
            const path3 = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path3.setAttribute("d", "M9 18h11");
            svgElement.appendChild(path3);
            
            const path4 = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path4.setAttribute("d", "M5 6l-1 1-1-1");
            svgElement.appendChild(path4);
            
            const path5 = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path5.setAttribute("d", "M5 12l-1 1-1-1");
            svgElement.appendChild(path5);
            
            const path6 = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path6.setAttribute("d", "M5 18l-1 1-1-1");
            svgElement.appendChild(path6);
          } else if (IconComponent === Search) {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", "11");
            circle.setAttribute("cy", "11");
            circle.setAttribute("r", "8");
            svgElement.appendChild(circle);
            
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", "21");
            line.setAttribute("y1", "21");
            line.setAttribute("x2", "16.65");
            line.setAttribute("y2", "16.65");
            svgElement.appendChild(line);
          } else if (IconComponent === CheckCircle) {
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", "M22 11.08V12a10 10 0 1 1-5.93-9.14");
            svgElement.appendChild(path);
            
            const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
            polyline.setAttribute("points", "22 4 12 14.01 9 11.01");
            svgElement.appendChild(polyline);
          }
          
          iconElement.appendChild(svgElement);
        }
      });
      
      tl.fromTo(containerRef.current, 
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
    <Section crosses
      customPaddings
      id="brain"
      className='min-h-screen w-screen'>
      <div className='min-h-screen w-screen'>
        <div className="mb-8 relative flex flex-col items-center gap-5 mx-[10%]">
          <h2 className='text-sm uppercase mt-[36px] md:text-[10px]'>Always in Your pocket
          </h2>
          <div className="mt-5 text-center text-4xl uppercase leading-[0.9] md:text-[6rem] font-bold">
            Take Your Advisor <br /> <span className='bg-[#915EFF] p-[1px] rounded-[8px] items-center justify-center'>with You</span>
          </div>
          <div className='mt-10 flex flex-col lg:flex-row items-center justify-center w-full h-[60dvh]'>
            <div className='flex w-full lg:flex-row flex-col h-full max-md:space-y-12'>
              <div className='flex lg:w-1/2 h-full relative' ref={parallaxRef}>
                <Iphone15Pro className='size-full' src={mobileView}/>
                <ScrollParallax isAbsolutelyPositioned>
                  <div className='bg-[#F3F3F3]/30 backdrop-blur-sm rounded-xl border border-white/40 w-[150px] translate-y-10 h-[50px] translate-x-1/2 absolute top-1/4 max-sm:translate-x-3 flex items-center justify-center'>
                    <div className='flex items-center justify-center'>
                      <AvatarCircles avatarUrls={avatars} numPeople={99}/>
                    </div>
                  </div>
                </ScrollParallax>
                <ScrollParallax isAbsolutelyPositioned>
                  <div className='bg-[#F3F3F3]/30 backdrop-blur-sm rounded-xl border border-white/40 w-[150px] translate-y-10 h-[50px] absolute bottom-1/3 right-1/6 max-sm:translate-x-16 items-center justify-center flex' ref={containerRef}>
                    <div className='flex items-center justify-center font-semibold'>
                      <div className='mr-2' ref={iconRef}>
                        <ListChecks size={16} />
                      </div>
                      <span ref={textRef}>recommendations...</span>
                    </div>
                  </div>
                </ScrollParallax>
              </div>
              <div className='flex lg:w-1/2 h-full justify-center text-xl sm:text-3xl items-center px-6 font-light flex-col'>
                <p className='font-poppins'>Discover your perfect <del className='bg-[#915EFF]/40 px-[6px] rounded-[8px]'>job</del> <strong>career</strong> path with our mobile application Get personalized advice, insights, and recommendations tailored to your skills and aspirations—right at your fingertips. Start your journey today!</p>
                <div className='flex w-full max-md:items-center max-md:justify-center '>
                  <CustomButton variant="outline" className="group xl:mt-8 max-md:mt-8 cursor-none flex items-center justify-center overflow-hidden max-md:w-full scale-90">
                    <span className="flex flex-row items-center justify-center">
                      Try it out
                      <ArrowRight className="ml-2 transition-transform duration-300 group-hover:translate-x-2"/>
                    </span>
                  </CustomButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

export default MobileFeature;