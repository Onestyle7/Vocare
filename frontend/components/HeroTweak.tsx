"use client"

import { useEffect, useState } from "react";
import { lazy, Suspense } from "react";
import Section from "./Section";
import Image from "next/image";
import { Spinner } from "@/app/constants";
import { SpinningText } from "./magicui/spinning-text";
import CustomCursor from "./CustomCursor";
import CustomButton from "./ui/CustomButton";
import { ArrowRight } from "lucide-react";

const LazySpline = lazy(() => import("@splinetool/react-spline"));

const HeroTweak = () => {
  const [showSpline, setShowSpline] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); 
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      const timer = setTimeout(() => {
        setShowSpline(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  return (
    <Section
      className="pt-[7.5rem] -mt-[5.25rem] relative cursor-none"
      crosses
      crossesOffset="lg:translate-y-[7.5rem]"
      customPaddings
      id="hero"
    >
      <CustomCursor />
      <div className="relative h-[390px] lg:w-full flex flex-row px-[40px] main-font-color">
        <div className="inset-0 flex md:flex-row flex-col items-center justify-center md:justify-start lg:w-3/5 w-full md:border-b md:border-t sm:pl-[40px]">
            <div className="flex xl:items-start justify-center flex-col lg:w-1/2 max-md:mb-8">
                <h1 className="text-[60px] 2xl:text-[108px] xl:text-[88px] lg:text-[78px] uppercase font-bold leading-17 2xl:leading-21 max-md:text-center">Unlock <br />Your<br /> growth
                </h1>
                <CustomButton variant="primary" className="group xl:mt-8 mt-4 cursor-none flex items-center justify-center overflow-hidden">
                  <span className="flex flex-row">
                    Try it out
                    <ArrowRight className="ml-2 transition-transform duration-300 group-hover:translate-x-2"/>
                  </span>
                </CustomButton>
            </div>
            <div className="flex items-center justify-center flex-col sm:w-full lg:w-1/2 h-full max-md:mt-6">
              <SpinningText>learn more • earn more • grow more •</SpinningText>
            </div>
        </div>
        {!isMobile && (
          <Suspense fallback={<Image src={Spinner} alt="spinner" width={60} height={60}/>}>
            {showSpline && (
              <div
                className="inset-0 flex items-center w-2/5 border-l border-b border-t"
              >
                <LazySpline
                  scene="https://prod.spline.design/mZBrYNcnoESGlTUG/scene.splinecode"
                  className="justify-center flex items-center"
                />
              </div>
            )}
          </Suspense>
        )}
      </div>
        <div className="flex items-center justify-center relative flex-col px-[40px] mt-14 w-full">
          <div className="flex items-center justify-center h-full flex-col mb-2">
          <h3 className='text-sm uppercase md:text-[10px] mb-8'>Meet Us</h3>
            <h2 className="xl:text-[158px] lg:text-[138px] md:text-[108px] sm:text-[78px] text-5xl font-bold">
              OUR VISION</h2>
            <div className="flex lg:flex-row items-center justify-between w-full text-xl uppercase xl:px-3 lg:px-2 md:px-1 sm:px-1">
              <h3>learn</h3>
              <h3>grow</h3>
              <h3>earn</h3>
            </div>
          </div>
        </div>
      {/* <BottomLine /> */}
    </Section>
  );
};

export default HeroTweak;