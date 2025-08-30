import { info_circle } from '@/app/constants';
import Image from 'next/image';
import React from 'react';

const Timeline = () => {
  return (
    <section>
      <div className="flex w-full flex-col items-center justify-center sm:flex-row">
        {/* first section */}
        <div className="flex h-[300px] w-1/4 flex-col items-center justify-center space-y-2 border">
          <div className="flex flex-row items-center justify-center space-x-2">
            {/* Box icon */}
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-xl border border-gray-800 bg-[#09090b] p-[6px]">
              <div className="flex h-full w-full items-center justify-center rounded-md border bg-[#27272a] text-black">
                <Image
                  src={info_circle}
                  alt="info_circle"
                  width={20}
                  height={20}
                  className="invert"
                />
              </div>
            </div>

            <div className="h-[1px] w-[200px] bg-[#dde0ce]" />
          </div>
          <div className="flex w-full flex-col items-start justify-center border px-2">
            <p className="text-sm text-gray-500">Current</p>
            <h2 className="text-md font-bold text-[#dde0ce]">Phase 1</h2>
            {/* <h3 className='text-sm text-[#dde0ce]'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Deserunt cupiditate sint, possimus odio in.</h3> */}
          </div>
        </div>

        {/* second section */}
        <div className="flex h-[300px] w-1/4 flex-col items-center justify-center border">
          <div className="ml-2 flex flex-row items-center justify-center space-x-2">
            {/* Box icon */}
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-xl border border-gray-800 bg-[#09090b] p-[6px]">
              <div className="flex h-full w-full items-center justify-center rounded-md border bg-[#27272a] text-black">
                <Image
                  src={info_circle}
                  alt="info_circle"
                  width={20}
                  height={20}
                  className="invert"
                />
              </div>
            </div>

            <div className="h-[1px] w-[200px] bg-[#dde0ce]" />
          </div>
        </div>

        {/* third section */}
        <div className="flex h-[300px] w-1/4 flex-col items-center justify-center border">
          <div className="ml-2 flex flex-row items-center justify-center space-x-2">
            {/* Box icon */}
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-xl border border-gray-800 bg-[#09090b] p-[6px]">
              <div className="flex h-full w-full items-center justify-center rounded-md border bg-[#27272a] text-black">
                <Image
                  src={info_circle}
                  alt="info_circle"
                  width={20}
                  height={20}
                  className="invert"
                />
              </div>
            </div>

            <div className="h-[0.5px] w-[200px] bg-[#575b51]" />
          </div>
        </div>

        {/* fourth section */}
        <div className="flex h-[300px] w-1/4 flex-col items-center justify-center border">
          <div className="ml-2 flex flex-row items-center justify-center space-x-2">
            {/* Box icon */}
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-xl border border-gray-800 bg-[#09090b] p-[6px]">
              <div className="flex h-full w-full items-center justify-center rounded-md border bg-[#27272a] text-black">
                <Image
                  src={info_circle}
                  alt="info_circle"
                  width={20}
                  height={20}
                  className="invert"
                />
              </div>
            </div>

            <div className="h-[0.5px] w-[200px] bg-[#575b51]" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Timeline;
