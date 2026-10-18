'use client';

import Image from 'next/image';
import { useRef } from 'react';

import Button from '@/components/ui/assistant-button';
import { arrow_icon } from '@/features/marketing/constants';

import BentoGrid from './ui/bento-grid';

const Features = () => {
  const bentoRef = useRef<HTMLDivElement>(null);

  const scrollToBento = () => {
    bentoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="font-poppins flex flex-col bg-[#0F1013] p-3 sm:p-5">
      <div className="relative mx-auto flex w-full max-w-none flex-col overflow-hidden rounded-3xl 2xl:max-w-7xl">
        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-12 sm:px-8 sm:py-16 md:px-12 lg:px-16 lg:py-20 2xl:py-24">
          <div className="flex flex-col items-center space-y-6 sm:space-y-7 lg:space-y-8">
            <h1 className="w-full text-center text-[28px] leading-[1.15] font-light text-[#F1F4FF] sm:text-[36px] lg:text-[48px] lg:leading-[1.1]">
              <span className="opacity-[0.79]">Poznaj</span>{' '}
              <span className="bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text font-normal text-transparent">
                Potęgę AI
              </span>
              <br />
              <span className="opacity-[0.79]">w Doradztwie Zawodowym</span>
            </h1>

            <p className="w-full max-w-178 text-center text-[14px] leading-normal font-light text-[#F1F4FF] opacity-[0.46] sm:text-[15px] lg:text-[18px] lg:leading-[1.45]">
              Wykorzystaj moc zaawansowanych algorytmów, które analizują globalne trendy i Twoje
              unikalne kompetencje. Nasz system AI eliminuje domysły, dostarczając precyzyjny plan
              rozwoju, który realnie zwiększa Twoją wartość na rynku pracy.
            </p>

            <Button
              onClick={scrollToBento}
              variant="secondary"
              size="sm"
              icon={<Image src={arrow_icon} alt="expand" width={20} height={20} />}
              iconPosition="right"
              className="cursor-pointer lg:h-13 lg:px-6 lg:text-[15px]"
            >
              <span className="cursor-pointer bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text text-transparent">
                Poznaj funckcjonalności
              </span>
            </Button>
          </div>

          <div ref={bentoRef} className="mt-12 w-full sm:mt-16 lg:mt-20">
            <BentoGrid />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
