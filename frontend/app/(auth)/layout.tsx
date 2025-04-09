import React, { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { VelocityScroll } from "@/components/magicui/scroll-based-velocity";
import { Spinner } from "../constants";
import Image from "next/image";

const LazySpline = lazy(() => import("@splinetool/react-spline"));

const Layout = ({ children }: { children: React.ReactNode }) => {
    
  
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-row flex-1">
      <section className="hidden w-1/2 items-center justify-center bg-[#101014] dark:bg-[#F3F3F3] p-10 lg:flex xl:w-2/5">
        <div className="flex max-h-[800px] max-w-[430px] flex-col justify-center space-y-12">
        <Skeleton className="h-[125px] w-[250px] rounded-xl bg-gray-200/20" />


          <div className="space-y-5 text-[#F3F3F3] dark:text-[#101014]">
            <h1 className="h1">Rocket You career</h1>
            <p className="body-1">
              learn more • earn more • grow more
            </p>
          </div>
          <div className="relative h-[390px] lg:w-full flex flex-row px-[40px] main-font-color">
          <Suspense fallback={<Image src={Spinner} alt="spinner" width={60} height={60}/>}>
                          <LazySpline 
                            scene="https://prod.spline.design/mZBrYNcnoESGlTUG/scene.splinecode"
                            className="justify-center flex items-center"
                          />
                    </Suspense>
          </div>
        </div>
      </section>

      <section className="flex flex-1 flex-col items-center p-4 py-10 lg:justify-center lg:p-10 lg:py-0">
        <div className="mb-16 lg:hidden">
        <Skeleton className="h-[87px] w-[224px] rounded-xl bg-gray-200/80" />
        </div>
        {children}
      </section>
      </div>
      <div className="flex w-full justify-center items-center border border-[#F3F3F3]">
        <div className="flex w-full justify-between items-center">
          <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
            <VelocityScroll numRows={1}>Vocare</VelocityScroll>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;