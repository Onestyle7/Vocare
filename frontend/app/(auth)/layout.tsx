import React, { lazy, Suspense } from 'react';
import { VelocityScroll } from '@/components/magicui/scroll-based-velocity';
import { logo, Spinner } from '../constants';
import Image from 'next/image';

const LazySpline = lazy(() => import('@splinetool/react-spline'));

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="font-korbin flex min-h-screen flex-col">
      <div className="flex flex-1 flex-row p-2">
        <section className="hidden w-1/2 items-center justify-center bg-[#0f1014] p-10 lg:flex xl:w-2/5 dark:bg-neutral-300 rounded-[24px]">
          <div className="flex max-h-[800px] max-w-[430px] flex-col justify-center space-y-12">
            <Image src={logo} alt="vocare" width={256} height={256} className="dark:invert" />

            <div className="space-y-5 text-[#F3F3F3] dark:text-[#101014]">
              <h1 className="h1">Rocket You career</h1>
              <p className="body-1">learn more • earn more • grow more</p>
            </div>
            <div className="main-font-color relative flex h-[385px] flex-row px-[40px] lg:w-full">
              <Suspense fallback={<Image src={Spinner} alt="spinner" width={60} height={60} />}>
                <LazySpline
                  scene="https://prod.spline.design/mZBrYNcnoESGlTUG/scene.splinecode"
                  className="flex items-center justify-center"
                />
              </Suspense>
            </div>
          </div>
        </section>

        <section className="flex flex-1 flex-col items-center bg-neutral-100 p-4 py-10 lg:justify-center lg:p-10 lg:py-0 dark:bg-[#0f1014]">
          <div className="mb-16 lg:hidden">
            <Image
              src={logo}
              neutral-300
              alt="vocare"
              width={256}
              height={256}
              className="invert dark:invert-0"
            />
          </div>
          {children}
        </section>
      </div>
      <div className="flex w-full items-center justify-center border border-[#F3F3F3]">
        <div className="flex w-full items-center justify-between">
          <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
            <VelocityScroll numRows={1}>Vocare</VelocityScroll>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
