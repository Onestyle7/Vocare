import { info_circle } from '@/app/constants';
import Image from 'next/image';
import React from 'react';

const Timeline = () => {
  const timelineData = [
    {
      date: "January 15, 2024",
      phase: "Phase I",
      description: "Project initialization and strategic planning begins.",
      status: "Current",
      icon: "/svg/info-circle.svg", 
    },
    {
      date: "March 10, 2024", 
      phase: "Phase II",
      description: "Detailed research and preliminary development stage.",
      status: "Upcoming",
      icon: "/svg/info-circle.svg", 
    },
    {
      date: "June 5, 2024",
      phase: "Phase III", 
      description: "Core implementation and major milestones achieved.",
      status: "Upcoming",
      icon: "/svg/info-circle.svg", 
    },
    {
      date: "September 20, 2024",
      phase: "Phase IV",
      description: "Final refinements and project completion.",
      status: "Upcoming",
      icon: "/svg/info-circle.svg", 
    }
  ];

  return (
    <section className='sm:max-w-5xl sm:mx-auto w-full mx-8'>
      {/* Desktop Layout - Horizontal */}
      <div className="hidden sm:flex w-full flex-row items-center justify-center">
        {timelineData.map((item, index) => (
          <div key={index} className="flex h-[300px] w-1/4 flex-col items-center justify-center space-y-2">
            <div className="flex flex-row items-center justify-center space-x-2">
              {/* Box icon */}
              <div className="flex h-[44px] w-[44px] items-center justify-center rounded-xl border border-gray-800 bg-[#09090b] p-[6px]">
                <div className="flex h-full w-full items-center justify-center rounded-md border bg-[#27272a] text-black">
                  <Image
                    src={item.icon || info_circle}
                    alt={item.phase}
                    width={20}
                    height={20}
                    className="invert"
                  />
                </div>
              </div>

              {/* Horizontal line - hide on last item */}
              {index < timelineData.length && (
                <div className="h-[1px] w-[200px] bg-[#dde0ce]" />
              )}
            </div>
            <div className="flex w-full flex-col items-start justify-center px-2">
              <p className="text-sm text-gray-500">{item.date}</p>
              <h2 className="text-md font-bold text-[#dde0ce]">{item.phase}</h2>
              <h3 className='text-sm text-[#dde0ce] mt-2'>{item.description}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Layout - Vertical */}
      <div className="flex sm:hidden w-full flex-col items-start justify-center space-y-6">
        {timelineData.map((item, index) => (
          <div key={index} className="flex w-full flex-row items-start justify-start space-x-4">
            {/* Left side - Icon and vertical line */}
            <div className="flex flex-col items-center">
              {/* Box icon */}
              <div className="flex h-[44px] w-[44px] items-center justify-center rounded-xl border border-gray-800 bg-[#09090b] p-[6px]">
                <div className="flex h-full w-full items-center justify-center rounded-md border bg-[#27272a] text-black">
                  <Image
                    src={item.icon || info_circle}
                    alt={item.phase}
                    width={20}
                    height={20}
                    className="invert"
                  />
                </div>
              </div>
              
              {/* Vertical line - hide on last item */}
              {index < timelineData.length - 1 && (
                <div className="w-[2px] h-[80px] bg-[#dde0ce] mt-4" />
              )}
            </div>

            {/* Right side - Content */}
            <div className="flex flex-col items-start justify-start flex-1 pt-2">
              <p className="text-sm text-gray-500">{item.date}</p>
              <h2 className="text-lg font-bold text-[#dde0ce]">{item.phase}</h2>
              <h3 className='text-sm text-[#dde0ce] mt-2 leading-relaxed'>{item.description}</h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Timeline;
