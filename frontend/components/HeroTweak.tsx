"use client"

import { useEffect, useState } from "react";
import { lazy, Suspense } from "react";
import Section from "./Section";
import { BottomLine } from "./ui/BottomLine";
import Image from "next/image";
import { Spinner } from "@/app/constants";

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
      className="pt-[7.5rem] -mt-[5.25rem] relative"
      crosses
      crossesOffset="lg:translate-y-[7.5rem]"
      customPaddings
      id="hero"
    >
      <div className="relative h-[390px] lg:w-full flex flex-row px-[40px]">
        <div className="inset-0 flex md:items-center items-start justify-center md:justify-start lg:w-3/5 w-full md:border-b md:border-t sm:pl-[40px]">
            <div className="flex items-center justify-center flex-col">
                <h1 className="text-[60px] sm:text-[88px] uppercase font-bold leading-17 max-md:text-center">Unlock <br />Your<br /> growth
                </h1>
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
      <BottomLine />
    </Section>
  );
};

export default HeroTweak;