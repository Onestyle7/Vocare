'use client';

import { pricingPlans, shape1 } from '@/app/constants';
import AnimatedHeadline from '@/components/AnimatedText';
import { GridBackgroundDemo } from '@/components/MarketComponents/GridBackgroundDemo';
import Section from '@/components/Section';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import React from 'react';
import { ScrollParallax } from 'react-just-parallax';

const PricingMain = () => {
  return (
    <Section
      className="relative -mt-[5.25rem] pt-[7.5rem]"
      crosses
      crossesOffset="lg:translate-y-[7.5rem]"
      customPaddings
      id="pricing"
    >
      <div className="main-font-color relative mx-10 flex flex-col items-center justify-center xl:border">
        <GridBackgroundDemo />

        <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-center">
          <h1 className="text-[60px] leading-17 font-bold uppercase max-md:text-center lg:text-[78px] xl:mt-10 xl:text-[88px] 2xl:text-[108px] 2xl:leading-21">
            <AnimatedHeadline
              lines={['Tailored to', 'Your Needs']}
              className="items-start max-md:items-center"
            />
          </h1>
          <div className="font-poppins mt-10 mb-10 grid gap-8 px-4 md:grid-cols-3 md:px-6 xl:mt-20">
            <ScrollParallax isAbsolutelyPositioned zIndex={20}>
              <div className="absolute top-1/7 -left-4 z-20 xl:top-0">
                <Image src={shape1} alt="shape" width={78} height={78} className="-rotate-20" />
              </div>
              <div className="absolute bottom-20 left-0 z-20 xl:bottom-0">
                <Image src={shape1} alt="shape" width={78} height={78} className="-rotate-20" />
              </div>
              <div className="absolute top-1/2 -right-4 z-20">
                <Image src={shape1} alt="shape" width={78} height={78} className="-rotate-20" />
              </div>
            </ScrollParallax>
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`z-30 flex flex-col justify-between rounded-lg border bg-[#f3f3f3] p-6 dark:border-[0.5px] dark:bg-[#0e100f] ${
                  plan.popular ? 'border-primary' : 'border-gray-200'
                } ${index === 1 ? 'md:origin-bottom md:scale-y-105 md:transform' : ''}`}
              >
                <div>
                  {plan.popular && (
                    <div className="bg-primary text-primary-foreground mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold">
                      Most popular
                    </div>
                  )}
                  <h3 className="mb-2 text-2xl font-semibold">{plan.name}</h3>
                  <p className="mb-4 text-gray-600">{plan.description}</p>
                  <div className="mb-6 text-4xl font-bold">
                    ${plan.price}
                    <span className="text-xl font-normal text-gray-600">/{plan.tokens} tokens</span>
                  </div>
                  <ul className="mb-6 space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
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
                <Button className="mt-auto w-full rounded-full h-10" variant={plan.popular ? 'default' : 'outline'}>
                  Buy plan
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
};

export default PricingMain;
