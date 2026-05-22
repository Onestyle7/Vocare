import { ChevronRight } from 'lucide-react';
import Image from 'next/image';

import Header from '@/components/SectionsComponents/Header';
import Button from '@/components/ui/assistant-button';
import {
  expand_icon,
  resume_hero_img_1,
  resume_hero_img_2,
  resume_hero_img_3,
} from '@/features/marketing/constants';

const expandIconSize = {
  width: 14,
  height: 14,
};

const heroStats = [
  { value: '99%', label: 'Dopasowania do konkretnej oferty' },
  { value: '3 min', label: 'Do gotowego CV odpornego na ATS*' },
  { value: '1200+', label: 'Zadowolonych użytkowników' },
];

const heroCards = [
  {
    src: resume_hero_img_1,
    alt: 'Pokrycie z ofertą',
    className: 'top-[2%] left-[10%] lg:top-[8%] lg:left-0',
    priority: true,
    z: 'z-10',
  },
  {
    src: resume_hero_img_2,
    alt: 'Analiza wymagań i dopasowywanie',
    className: 'top-[35%] right-[4%] lg:top-[37%] lg:right-0',
    priority: false,
    z: 'z-10',
  },
  {
    src: resume_hero_img_3,
    alt: 'Dopasowane umiejętności',
    className: 'top-[68%] left-[14%] lg:bottom-[0%] lg:left-[14%]',
    priority: false,
    z: 'z-20',
  },
];

const Hero = () => {
  return (
    <div className="font-poppins flex flex-col bg-[#0F1013] p-3 sm:p-5">
      <div className="relative mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-none flex-col overflow-hidden rounded-3xl bg-[#16161A] sm:min-h-[calc(100dvh-2.5rem)] 2xl:min-h-0 2xl:max-w-7xl">
        <Header />

        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-8 sm:py-8 md:px-12 lg:px-16 lg:pt-8 lg:pb-12 2xl:pt-20">
          <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-10 lg:flex-1 lg:flex-row lg:items-start lg:gap-10">
            <div className="flex w-full max-w-142.75 flex-col items-center text-center lg:flex-1 lg:items-start lg:self-stretch lg:text-left">
              <h1 className="w-full text-[28px] leading-[1.15] text-[#F1F4FF] sm:text-[36px] lg:text-[48px] lg:leading-[1.1]">
                <span className="bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text font-medium text-transparent">
                  Stwórz CV
                </span>
                <span className="opacity-[0.79]">
                  , które <br /> trafia do rekruterów
                </span>
              </h1>

              <p className="mt-5 w-full max-w-124.5 text-[14px] leading-normal font-light text-[#F1F4FF] opacity-[0.46] sm:mt-6 sm:text-[15px] lg:mt-7 lg:text-[16px] lg:leading-[1.45]">
                Przestań wysyłać aplikacje w próżnię. Poznaj narzędzie budujące CV odporne na
                systemy ATS, gwarantując, że Twoje doświadczenie w końcu zostanie zauważone przez
                człowieka.
              </p>

              <div className="mt-7 flex w-full flex-wrap items-center justify-center gap-3 sm:mt-8 lg:mt-10 lg:justify-start lg:gap-4">
                <Button
                  href="/sign-up"
                  variant="primary"
                  size="sm"
                  icon={<ChevronRight size={18} />}
                  iconPosition="right"
                  className="lg:h-13 lg:px-6 lg:text-[15px]"
                >
                  Sprawdź za darmo
                </Button>

                <Button
                  href="/explore"
                  variant="secondary"
                  size="sm"
                  icon={
                    <Image
                      src={expand_icon}
                      alt="expand"
                      fill
                      className="pointer-events-none object-contain"
                    />
                  }
                  iconPosition="left"
                  iconWrapperClassName="relative"
                  iconWrapperStyle={{
                    width: expandIconSize.width,
                    height: expandIconSize.height,
                  }}
                  className="lg:h-13 lg:px-6 lg:text-[15px]"
                >
                  <span className="bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text text-transparent">
                    Sprawdź pozostałe
                  </span>
                </Button>
              </div>

              <div className="mt-8 grid w-full max-w-127.5 grid-cols-3 gap-3 sm:mt-10 sm:gap-6 lg:gap-8">
                {heroStats.map((stat) => (
                  <div
                    key={stat.value}
                    className="flex flex-col items-center space-y-1.5 text-[#686A71] lg:items-start lg:space-y-2"
                  >
                    <span className="bg-[linear-gradient(180deg,#8FBCFE_0%,#91A3FE_60%,#B09FFE_100%)] bg-clip-text text-[28px] leading-none text-transparent sm:text-[36px] lg:text-[46px]">
                      {stat.value}
                    </span>
                    <span className="text-[10px] leading-tight sm:text-[11px] lg:text-[14px]">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>

              <p className="hidden truncate text-[16px] font-light text-[#7B7D84] opacity-25 lg:mt-auto lg:block lg:pt-6">
                *Przy uzupełnionym profilu użytkownika
              </p>
            </div>
          </div>

          <div
            aria-hidden
            className="pointer-events-none relative z-10 mx-auto mt-8 aspect-[5/4] w-full max-w-[480px] sm:mt-10 sm:max-w-[560px] lg:absolute lg:top-0 lg:right-8 lg:bottom-24 lg:z-0 lg:mx-0 lg:mt-0 lg:aspect-auto lg:h-auto lg:w-[46%] lg:max-w-[640px] xl:right-12"
          >
            {heroCards.map((card) => (
              <div
                key={card.alt}
                className={`absolute aspect-[414/214] w-[46%] max-w-[280px] lg:w-[58%] lg:max-w-[290px] ${card.z} ${card.className}`}
              >
                <Image
                  src={card.src}
                  alt={card.alt}
                  fill
                  priority={card.priority}
                  sizes="(max-width: 1024px) 56vw, 290px"
                  className="object-contain"
                />
              </div>
            ))}
          </div>

          <p className="mt-6 truncate text-center text-[16px] font-light text-[#7B7D84] opacity-25 sm:mt-8 lg:hidden">
            *Przy uzupełnionym profilu użytkownika
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hero;
