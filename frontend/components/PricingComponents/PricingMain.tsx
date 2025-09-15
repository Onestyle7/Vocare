'use client';

import {
  circle_pricing,
  curve_pricing,
  shape1,
  square_pricing,
  trapez_pricing,
} from '@/app/constants';
import Section from '@/components/SupportComponents/Section';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import React from 'react';
import { ScrollParallax } from 'react-just-parallax';
import Copy from '../SupportComponents/Copy';
import { Code2, EyeOffIcon, PhoneIcon, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const PricingMain = () => {
  return (
    <Section
      className="relative -mt-[5.25rem] pt-[7.5rem]"
      crosses
      crossesOffset="lg:translate-y-[7.5rem]"
      customPaddings
      id="pricing"
    >
      <div className="main-font-color relative flex flex-col items-center justify-center max-lg:overflow-x-hidden xl:mx-10 xl:border">
        <div
          className={cn(
            'absolute inset-0',
            '[background-size:90px_90px]',
            '[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]',
            'dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]',
            // mask grid to be visible only within the central gradient
            '[mask-image:radial-gradient(ellipse_at_center,white_0%,transparent_60%)]',
            '[-webkit-mask-image:radial-gradient(ellipse_at_center,white_0%,transparent_60%)]',
            '[mask-size:200%_200%]',
            '[mask-position:center]',
            '[mask-repeat:no-repeat]'
          )}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_bottom,transparent_40%,black_70%)] dark:bg-[#0f1014]"></div>
        <div className="font-korbin relative mx-auto flex max-w-7xl flex-col items-center justify-center">
          <div className="relative flex flex-col items-center justify-center sm:mt-8">
            <p className="mb-4 font-bold text-gray-400 sm:mb-6">Pricing</p>
            <Copy>
              <h1 className="text-color text-center text-3xl font-bold md:text-[3rem] xl:leading-[0.8]">
                <span>Tailored to </span>
                <span className="relative inline-block pb-4 md:pb-6">
                  your needs
                  <Image
                    src={curve_pricing}
                    alt="line"
                    width={224}
                    height={124}
                    className="pointer-events-none absolute bottom-2 left-1/2 h-auto w-[85%] max-w-[320px] -translate-x-1/2 md:max-w-[360px]"
                  />
                </span>
              </h1>
            </Copy>
            <p className="text-md mt-4 w-3/4 text-center font-light text-gray-300 sm:mt-8 sm:text-lg">
              Select plan plan that fits You the most to unlock full potential and rocket Your
              career.
            </p>
            <div className="mt-6 flex w-4/5 flex-row items-center justify-between text-gray-100 sm:w-3/5">
              <p className="flex flex-row gap-2 text-xs sm:text-[16px]">
                <span>
                  <Code2 className="scale-80" />
                </span>
                Open source
              </p>
              <p className="flex flex-row gap-2 text-xs sm:text-[16px]">
                <span>
                  <EyeOffIcon className="scale-80" />
                </span>
                No logs policy
              </p>
              <p className="flex flex-row gap-2 text-xs sm:text-[16px]">
                <span>
                  <PhoneIcon className="scale-80" />
                </span>
                Contact Us
              </p>
            </div>
          </div>
          <div className="relative mt-10 mb-10 w-full px-4 md:px-6 xl:mt-18">
            {/* Subtle purple circular glow under the cards */}
            <div
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
              style={{
                width: 'min(80vw, 960px)',
                height: 'min(70vh, 780px)',
                background:
                  'radial-gradient(ellipse at center, rgba(145,94,255,0.28) 0%, rgba(145,94,255,0.16) 45%, rgba(145,94,255,0.06) 65%, transparent 75%)',
                filter: 'blur(32px)',
              }}
            />
            <div className="font-poppins grid items-end gap-8 md:grid-cols-3">
              <ScrollParallax isAbsolutelyPositioned zIndex={20}>
                <div className="absolute top-1/5 -left-4 z-20 sm:top-1/7 xl:top-0">
                  <Image src={shape1} alt="shape" width={78} height={78} className="-rotate-20" />
                </div>
                <div className="absolute top-1/2 -right-4 z-20">
                  <Image src={shape1} alt="shape" width={78} height={78} className="-rotate-20" />
                </div>
              </ScrollParallax>
              {/* Personal */}
              <div
                className={`font-korbin relative z-30 flex h-full flex-col justify-between rounded-[24px] border bg-[linear-gradient(to_top_right,rgba(9,13,22,1)_20%,rgba(9,13,22,0.2)_100%)] p-6 backdrop-blur-md sm:h-[87%] dark:border-gray-500/40`}
              >
                {/* subtle glass gradient overlay */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-br from-white/25 via-white/10 to-transparent dark:from-white/10 dark:via-white/5"
                />
                <div className="relative">
                  <div className="mb-4 flex h-[40px] w-[40px] items-center justify-center rounded-full border bg-white/20 shadow-xl backdrop-blur-md dark:bg-white/10">
                    <Image src={circle_pricing} alt="square" width={32} height={32} />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Personal
                  </h3>
                  <p className="mb-4 text-gray-700 dark:text-gray-500">
                    Perfect for getting started with our platform.
                  </p>
                  <div className="font-poppins mb-6 text-4xl font-bold text-gray-900 dark:text-white">
                    $9{' '}
                    <span className="text-xl font-normal text-gray-600 dark:text-gray-300">
                      /1,000 tokens
                    </span>
                  </div>
                  <ul className="mb-6 space-y-3 text-gray-900 dark:text-gray-100">
                    {[
                      '1,000 tokens included',
                      'Basic access to AI models',
                      'Up to 5 requests per day',
                      'Standard response time',
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <svg
                          className="mr-2 h-5 w-5 text-[#915EFF]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button className="mt-auto h-12 w-full rounded-full font-bold" variant="outline">
                  Buy plan
                </Button>
              </div>

              {/* Growth (Most popular) — glassmorphism */}
              <div className="relative rounded-[28px] bg-[linear-gradient(90deg,rgba(146,150,253,1)_0%,rgba(132,145,254,1)_50%,rgba(199,169,254,1)_100%,rgba(157,155,255,1)_77%)] px-1 pt-16 pb-1">
                <div className="absolute top-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
                  <Undo2 className="h-5 w-5 -rotate-90 text-white" />
                  <span className="text-lg font-semibold text-white">Best Deal</span>
                </div>
                <div
                  className={`font-korbin relative z-30 flex flex-col justify-between rounded-[24px] border p-6 backdrop-blur-md dark:border-gray-500/40 dark:bg-[#090d16]`}
                >
                  {/* subtle glass gradient overlay */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-br from-white/25 via-white/10 to-transparent dark:from-white/10 dark:via-white/5"
                  />
                  <div className="relative">
                    <div className="relative flex w-full flex-row items-start justify-between">
                      <div className="mb-4 flex h-[40px] w-[40px] items-center justify-center rounded-full border bg-white/20 shadow-xl backdrop-blur-md dark:bg-white/10">
                        <Image src={square_pricing} alt="square" width={32} height={32} />
                      </div>
                      <div className="font-poppins flex h-[32px] w-fit items-center justify-center rounded-full bg-[#818fff] px-4 py-2 text-xs font-semibold text-white">
                        <p>Save 75%</p>
                      </div>
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Growth
                    </h3>
                    <p className="mb-4 text-gray-700 dark:text-gray-500">
                      The best choice for scaling your projects.
                    </p>
                    <div className="font-poppins mb-6 text-4xl font-bold text-gray-900 dark:text-white">
                      $32{' '}
                      <span className="text-xl font-normal text-gray-600 dark:text-gray-300">
                        /5,000 tokens
                      </span>
                    </div>
                    <ul className="mb-6 space-y-3 text-gray-900 dark:text-gray-100">
                      {[
                        '5,000 tokens included',
                        'Full access to all AI models',
                        'Unlimited daily requests',
                        'Priority response time',
                        'Export results in multiple formats',
                      ].map((feature, i) => (
                        <li key={i} className="flex items-center">
                          <svg
                            className="mr-2 h-5 w-5 text-[#915EFF]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    className="relative mt-auto h-12 w-full rounded-full font-bold bg-[linear-gradient(90deg,rgba(146,150,253,1)_0%,rgba(132,145,254,1)_50%,rgba(199,169,254,1)_100%,rgba(157,155,255,1)_77%)] text-white"
                    variant="default"
                  >
                    Buy plan
                  </Button>
                </div>
              </div>

              {/* Extras (glassmorphism) */}
              <div
                className={`font-korbin relative z-30 flex h-full flex-col justify-between rounded-[24px] border bg-[linear-gradient(to_top_right,rgba(9,13,22,1)_20%,rgba(9,13,22,0.2)_100%)] p-6 backdrop-blur-md sm:h-[87%] dark:border-gray-500/40`}
              >
                {/* subtle glass gradient overlay */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-br from-white/25 via-white/10 to-transparent dark:from-white/10 dark:via-white/5"
                />
                <div className="relative">
                  <div className="relative flex w-full flex-row items-start justify-between">
                    <div className="mb-4 flex h-[40px] w-[40px] items-center justify-center rounded-full border bg-white/20 shadow-xl backdrop-blur-md dark:bg-white/10">
                      <Image
                        src={trapez_pricing}
                        alt="square"
                        width={32}
                        height={32}
                        className="scale-80"
                      />
                    </div>
                    <div className="font-poppins flex h-[32px] w-fit items-center justify-center rounded-full bg-[#818fff] px-4 py-2 text-xs font-semibold text-white">
                      <p>Save 65%</p>
                    </div>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Extras
                  </h3>
                  <p className="mb-4 text-gray-700 dark:text-gray-300">
                    Unlimited tokens and premium experience for personal use.
                  </p>
                  <div className="font-poppins mb-6 text-4xl font-bold text-gray-900 dark:text-white">
                    $48{' '}
                    <span className="text-xl font-normal text-gray-600 dark:text-gray-300">
                      /Unlimited tokens
                    </span>
                  </div>
                  <ul className="mb-6 space-y-3 text-gray-900 dark:text-gray-100">
                    {[
                      'Unlimited tokens for one user',
                      'Access to all advanced AI models',
                      'Dedicated premium support',
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <svg
                          className="mr-2 h-5 w-5 text-[#915EFF]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  className="relative mt-auto h-12 w-full rounded-full font-bold"
                  variant="outline"
                >
                  Buy plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default PricingMain;
