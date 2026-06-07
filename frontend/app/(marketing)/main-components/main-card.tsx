import { ArrowUpRight } from 'lucide-react';
import React from 'react';

interface MainCardProps {
  title: string;
  description: string;
}

const maskStyle: React.CSSProperties = {
  maskImage: `url('/main-page/card-mask.svg')`,
  WebkitMaskImage: `url('/main-page/card-mask.svg')`,
  maskSize: '100% 100%',
  WebkitMaskSize: '100% 100%',
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
};

const borderGradient = 'bg-gradient-to-br from-white/15 via-white/15 via-[70%] to-white/[0.03]';

const MainCard = ({ title, description }: MainCardProps) => {
  return (
    <div className="group font-poppins relative aspect-[300/380] w-full max-w-[300px] cursor-pointer justify-self-center lg:max-w-none xl:max-w-[300px]">
      <div className={`absolute inset-0 p-px ${borderGradient}`} style={maskStyle}>
        <div
          className="h-full w-full bg-[#1a1c21] px-6 py-7 sm:px-7 sm:py-8 lg:px-6 lg:py-7 xl:p-8"
          style={maskStyle}
        >
          <div className="flex max-w-[100%] flex-col items-start gap-5 sm:gap-7 xl:gap-8">
            <h3 className="text-[22px] leading-tight font-normal text-[#e2e4e9] opacity-75 sm:text-[20px] xl:text-[22px]">
              {title}
            </h3>

            <p className="text-lg leading-relaxed font-extralight text-[#e2e4e9] opacity-50 sm:text-[15px] xl:text-base">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div
        className={`absolute right-3 bottom-3 rounded-full p-px sm:right-4 sm:bottom-4 ${borderGradient} `}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1c1d22] sm:h-16 sm:w-16 xl:h-[72px] xl:w-[72px]">
          <ArrowUpRight
            size={22}
            className="text-white transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-1"
            strokeWidth={1.5}
          />
        </div>
      </div>
    </div>
  );
};

export default MainCard;
