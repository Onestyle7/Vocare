'use client';

import { useRef } from 'react';

import BentoGrid from './ui/bento-grid';

const Personalization = () => {
  const bentoRef = useRef<HTMLDivElement>(null);

  return (
    <div className="font-poppins flex flex-col bg-[#0F1013] p-3 sm:p-5">
      <div className="relative mx-auto flex w-full max-w-none flex-col overflow-hidden rounded-3xl 2xl:max-w-7xl">
        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-12 sm:px-8 sm:py-16 md:px-12 lg:px-16 lg:py-20 2xl:py-24">
          <div className="flex flex-col items-center space-y-6 sm:space-y-7 lg:space-y-8">
            <h2 className="w-full text-center text-[28px] leading-[1.15] font-light text-[#F1F4FF] sm:text-[36px] lg:text-[48px] lg:leading-[1.1]">
              <span className="opacity-[0.79]">Dostosuj roadmapę do</span>
              <br />
              <span className="bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text font-normal text-transparent">
                swoich preferencji
              </span>
            </h2>
          </div>

          <div ref={bentoRef} className="mt-12 w-full sm:mt-16 lg:mt-20">
            <BentoGrid />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Personalization;
