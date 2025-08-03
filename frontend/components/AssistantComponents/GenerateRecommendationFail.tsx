import React from 'react';
import SpotlightCard from '../SpotlightCard/SpotlightCard';
import Link from 'next/link';
import Image from 'next/image';
import { curved1, upper_arrow } from '@/app/constants';

const GenerateRecommendationFail = () => {
  return (
    <div className="mt-16 flex flex-col items-center space-y-10">
      <div className="flex flex-col items-center justify-center">
        <h1 className="font-poppins text-3xl font-bold">How to use Vocare?</h1>
        <p className="font-poppins text-md text-gray-500">It&apos;s that simple.</p>
      </div>
      <div className="flex flex-col max-lg:space-y-3 lg:flex-row lg:space-x-4">
        <SpotlightCard className="bg-muted h-[300px] w-[350px]">
          <div className="font-poppins flex h-full flex-col items-center justify-center">
            <div className="w-full items-center justify-start">
              <p className="text-muted-foreground text-xl">1.</p>
            </div>
            <div className="mt-4 h-full w-full items-center justify-start">
              <p className="text-muted-foreground text-lg">
                Start by updating <b>Your profile</b>. Simply use the <i>profile</i> button
              </p>
            </div>
            <div className="w-full">
              <Link
                href="/profile"
                className="text-md text-muted-foreground group flex flex-row items-center transition-all duration-300"
              >
                Navigate to profile
                <Image
                  src={upper_arrow}
                  alt="arrow"
                  width={24}
                  height={24}
                  className="ml-1 scale-90 opacity-50 transition-transform duration-300 group-hover:translate-x-2 dark:invert"
                />
              </Link>
            </div>
          </div>
        </SpotlightCard>
        {/* <Image src={curved1} alt='curved' width={324} height={324} className='invert opacity-30'/> */}
        <SpotlightCard className="bg-muted h-[300px] w-[350px]">
          <div className="font-poppins flex h-full flex-col items-center justify-center">
            <div className="w-full items-center justify-start">
              <p className="text-muted-foreground text-xl">2.</p>
            </div>
            <div className="mt-4 h-full w-full items-center justify-start">
              <p className="text-muted-foreground text-lg">
                After updating Your profile, you&apos;ll gain access to every <br /> <b>AI tool</b>{' '}
                that Vocare offers.
              </p>
            </div>
            <div className="w-full">
              <Link
                href="/profile"
                className="text-md text-muted-foreground group flex flex-row items-center transition-all duration-300"
              >
                Learn how we protect data
                <Image
                  src={upper_arrow}
                  alt="arrow"
                  width={24}
                  height={24}
                  className="ml-1 scale-90 opacity-50 transition-transform duration-300 group-hover:translate-x-2 dark:invert"
                />
              </Link>
            </div>
          </div>
        </SpotlightCard>
        <SpotlightCard className="bg-muted h-[300px] w-[350px]">
          <div className="font-poppins flex h-full flex-col items-center justify-center">
            <div className="w-full items-center justify-start">
              <p className="text-muted-foreground text-xl">3.</p>
            </div>
            <div className="mt-4 h-full w-full items-center justify-start">
              <p className="text-muted-foreground text-lg">
                Build Your future with <b>Vocare</b>. You <b>grow</b>, we automate.
              </p>
            </div>
            <div className="w-full">
              <Link
                href="/profile"
                className="text-md text-muted-foreground group flex flex-row items-center transition-all duration-300"
              >
                Visit the FAQ section
                <Image
                  src={upper_arrow}
                  alt="arrow"
                  width={24}
                  height={24}
                  className="ml-1 scale-90 opacity-50 transition-transform duration-300 group-hover:translate-x-2 dark:invert"
                />
              </Link>
            </div>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
};

export default GenerateRecommendationFail;
