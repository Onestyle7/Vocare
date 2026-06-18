'use client';

import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';

import { arrow_01, arrow_02, arrow_03 } from '@/features/marketing/constants';

import { LightBeam } from './light-beam';

interface Step {
  number: string;
  prefix: string;
  link: string;
  href: string;
  description: string;
  position: string;
}

const steps: Step[] = [
  {
    number: '01',
    prefix: 'Uzupełnij dokładnie',
    link: 'swój profil',
    href: '/dashboard/profile',
    description:
      'To Twój punkt startowy. Algorytm analizuje każdy szczegół profilu - od kompetencji po cele zawodowe - żeby plan, który dostaniesz, był dopasowany wyłącznie do Ciebie, a nie do średniej z internetu.',
    position: 'lg:col-start-1 lg:row-start-1',
  },
  {
    number: '02',
    prefix: 'Przejdź do',
    link: 'Doradcy Zawodowego',
    href: '/assistant',
    description:
      'Mając Twój profil, algorytm analizuje tysiące scenariuszy i tworzy 3 realistyczne ścieżki kariery - każda z analizą SWOT, prawdopodobieństwem sukcesu i dopasowanymi ofertami od NoFluffJobs. Do każdej z wygenerowanych ścieżek otrzymasz również Roadmapę, aby jasno widzieć co musisz zrobić, aby zrealizować swój cel. To moment, w którym dane zamieniają się w konkretne kierunki.',
    position: 'lg:col-start-2 lg:row-start-2',
  },
  {
    number: '03',
    prefix: 'Przejdź do',
    link: 'Analizy Rynkowej',
    href: '/market-analysis',
    description:
      'Dla każdej rekomendowanej ścieżki dostajesz osobny raport rynkowy - widełki na czterech poziomach kariery, trudność wejścia i brakujące kompetencje. Wiesz nie tylko dokąd iść, ale i ile to realnie kosztuje.',
    position: 'lg:col-start-1 lg:row-start-3',
  },
  {
    number: '04',
    prefix: 'Przejdź do',
    link: 'Kreatora CV',
    href: '/resume-creator',
    description:
      'Ostatni krok to zmiana planu w aplikację. Wklej link do ogłoszenia, a kreator porówna je z Twoim profilem, uzupełni słowa kluczowe i wygeneruje CV w 100% odporne na ATS. Od pustego profilu do gotowego PDF - w jednym miejscu. Pamiętaj, że z Kreatora możesz skorzystać w dowolnym momencie.',
    position: 'lg:col-start-2 lg:row-start-4',
  },
];

const HowItWorks = () => {
  return (
    <div id="how-it-works" className="font-poppins flex flex-col bg-[#0F1013] p-3 sm:p-5">
      <div className="relative mx-auto flex w-full max-w-none flex-col overflow-hidden rounded-3xl 2xl:max-w-7xl">
        <LightBeam />

        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-12 sm:px-8 sm:py-16 md:px-12 lg:px-16 lg:py-20 2xl:py-24">
          <div className="relative z-10 flex flex-col items-center">
            <h1 className="w-full text-center text-[28px] leading-[1.15] font-light text-[#F1F4FF] sm:text-[36px] lg:text-[48px] lg:leading-[1.1]">
              <span className="bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text font-normal text-transparent">
                Twoja Przyszłość
              </span>
              <br />
              <span className="opacity-[0.79]">w 4 Krokach</span>
            </h1>
          </div>

          <div className="relative z-10 mx-auto mt-12 grid w-full max-w-4xl grid-cols-1 gap-y-12 sm:mt-16 lg:mt-24 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-20">
            <Image
              src={arrow_01}
              alt=""
              aria-hidden
              width={250}
              height={210}
              className="pointer-events-none absolute top-[2%] left-[40%] z-0 hidden h-auto w-[36%] select-none lg:block"
            />
            <Image
              src={arrow_02}
              alt=""
              aria-hidden
              width={260}
              height={150}
              className="pointer-events-none absolute top-[35%] left-[10%] z-0 hidden h-auto w-[33%] select-none lg:block"
            />
            <Image
              src={arrow_03}
              alt=""
              aria-hidden
              width={160}
              height={190}
              className="pointer-events-none absolute top-[59%] left-[44%] z-0 hidden h-auto w-[27%] select-none lg:block"
            />

            {steps.map((step) => (
              <div
                key={step.number}
                className={`relative z-10 w-full max-w-[440px] ${step.position}`}
              >
                <span className="block text-[56px] leading-none font-extralight text-[#C9CCD4] sm:text-[72px] lg:text-[88px]">
                  {step.number}
                </span>

                <p className="mt-4 flex flex-wrap items-center gap-x-1.5 text-[15px] leading-normal text-[#F1F4FF]/90 opacity-75 sm:text-[20px] lg:mt-5">
                  <span>{step.prefix}</span>
                  <a
                    href={step.href}
                    className="underline decoration-[#F1F4FF]/40 underline-offset-[5px] transition-colors hover:decoration-[#F1F4FF]"
                  >
                    {step.link}
                  </a>
                  <ArrowUpRight size={15} strokeWidth={1.5} className="text-[#F1F4FF]/80" />
                </p>

                <p className="mt-3 max-w-[420px] text-[13px] leading-relaxed font-light text-[#7B7D84] sm:text-[14px] lg:mt-4 lg:text-[15px]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
