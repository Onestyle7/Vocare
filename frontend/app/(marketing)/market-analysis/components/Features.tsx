'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ArrowUp } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

import Button from '@/components/ui/assistant-button';
import { ai_icon, arrow_icon, path_icon, user_icon_1 } from '@/features/marketing/constants';

import JobAttributesChart from './charts/JobAttributesChart';
import SalaryProgressionChart from './charts/SalaryProgressionChart';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const ICON_STAGE_W = 500;
const ICON_STAGE_H = 450;

const Features = () => {
  const bentoRef = useRef<HTMLDivElement>(null);
  const rightSectionRef = useRef<HTMLDivElement>(null);

  const iconWrapRef = useRef<HTMLDivElement>(null);
  const iconStageRef = useRef<HTMLDivElement>(null);

  const card02Ref = useRef<HTMLDivElement>(null);
  const mobileLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = iconWrapRef.current;
    const stage = iconStageRef.current;
    if (!wrap || !stage) return;

    const update = () => {
      const scale = Math.min(1, wrap.clientWidth / ICON_STAGE_W);
      stage.style.transform = `scale(${scale})`;
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const container = bentoRef.current;
    const wrap = iconWrapRef.current;
    const card02 = card02Ref.current;
    const line = mobileLineRef.current;
    if (!container || !wrap || !card02 || !line) return;

    const update = () => {
      const c = container.getBoundingClientRect();
      const w = wrap.getBoundingClientRect();
      const k = card02.getBoundingClientRect();

      const overlap = 2;
      const top = w.bottom - c.top - overlap;
      const height = Math.max(0, k.top - w.bottom + overlap);

      line.style.top = `${top}px`;
      line.style.height = `${height}px`;
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  useGSAP(
    () => {
      const paths = gsap.utils.toArray<SVGPathElement>('.connection-path');
      paths.forEach((path) => {
        const length = path.getTotalLength();
        gsap.set(path, {
          strokeDasharray: length,
          strokeDashoffset: length,
          opacity: 1,
        });
      });
      gsap.set('.mobile-connector', { scaleY: 0, transformOrigin: 'top' });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: bentoRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      });

      tl.to('.arc-path', {
        strokeDashoffset: 0,
        duration: 0.8,
        ease: 'power2.out',
        stagger: 0.12,
      })
        .to('.stem-path', { strokeDashoffset: 0, duration: 0.45, ease: 'power1.inOut' }, '-=0.2')
        .to('.main-path', { strokeDashoffset: 0, duration: 1.0, ease: 'power2.inOut' }, '-=0.1')
        .to('.mobile-connector', { scaleY: 1, duration: 0.9, ease: 'power2.inOut' }, '<');
    },
    { scope: bentoRef }
  );

  return (
    <div className="font-poppins flex flex-col bg-[#0F1013] p-3 sm:p-5" ref={rightSectionRef}>
      <div className="relative mx-auto flex w-full max-w-none flex-col overflow-hidden rounded-3xl 2xl:max-w-7xl">
        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-12 sm:px-8 sm:py-16 md:px-12 lg:px-16 lg:py-20 2xl:py-24">
          <div className="flex flex-col items-center space-y-6 sm:space-y-7 lg:space-y-8">
            <h2 className="w-full text-center text-[28px] leading-[1.15] font-light text-[#F1F4FF] sm:text-[36px] lg:text-[48px] lg:leading-[1.1]">
              <span className="opacity-[0.79]">Poznaj</span>{' '}
              <span className="bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text font-normal text-transparent">
                Potęgę AI
              </span>
              <br />
              <span className="opacity-[0.79]">Analizie Rynkowej</span>
            </h2>

            <p className="w-full max-w-178 text-center text-[14px] leading-normal font-light text-[#F1F4FF] opacity-[0.46] sm:text-[15px] lg:text-[18px] lg:leading-[1.45]">
              Nie analizujemy całego rynku, tylko Twoje konkretne ścieżki. Algorytm bierze
              rekomendacje z Doradcy AI, Twoją lokalizację i profil - i buduje raport, który mówi
              nie tylko ile zarobisz, ale też kiedy będziesz gotów.
            </p>

            <Button
              href="/dashboard"
              variant="secondary"
              size="sm"
              icon={<Image src={arrow_icon} alt="expand" width={20} height={20} />}
              iconPosition="right"
              className="lg:h-13 lg:px-6 lg:text-[15px]"
            >
              <span className="cursor-pointer bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text text-transparent">
                Wygeneruj analizę
              </span>
            </Button>
          </div>
        </div>

        <div
          ref={bentoRef}
          className="relative mx-auto flex w-full max-w-6xl flex-col items-center justify-center space-y-16 px-4 pb-20 sm:space-y-24 sm:px-0 lg:space-y-[120px]"
        >
          <svg
            className="pointer-events-none absolute top-0 left-0 z-0 hidden w-full lg:block"
            style={{ height: '700px' }}
            viewBox="0 0 1152 700"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              className="connection-path main-path"
              d="M 856 450 C 856 547, 576 547, 576 644"
              stroke="#9296FD"
              strokeWidth="2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div
            ref={mobileLineRef}
            className="pointer-events-none absolute left-1/2 z-20 w-[1.5px] -translate-x-1/2 overflow-hidden lg:hidden"
            style={{ top: 0, height: 0 }}
          >
            <div className="mobile-connector h-full w-full origin-top bg-[#9296FD]" />
          </div>

          <div className="z-10 flex w-full flex-col gap-4 rounded-[14px] bg-[#16171B] p-4 lg:h-[450px] lg:flex-row lg:items-center lg:justify-between lg:gap-0">
            <div className="flex w-full flex-col justify-center space-y-4 rounded-[10px] bg-[#202125] p-6 lg:h-full lg:w-1/2">
              <p className="text-[28px] opacity-50">01</p>
              <div className="space-y-4">
                <p className="text-[20px] sm:text-[24px]">AI łączy Twoje dane w jedną analizę</p>
                <p className="text-[15px] font-light opacity-75 sm:text-[18px]">
                  Analiza nie zaczyna się od pustej kartki. AI bierze Twój profil zawodowy -
                  doświadczenie, umiejętności i lokalizację - oraz ścieżki kariery wygenerowane
                  wcześniej przez Doradcę. Łączy te dane i tworzy raport rynkowy dopasowany
                  wyłącznie do Twojej sytuacji, a nie do średniej z internetu.
                </p>
              </div>
            </div>

            <div className="relative flex w-full items-center justify-center rounded-[10px] p-2 sm:p-6 lg:h-full lg:w-1/2">
              <div
                ref={iconWrapRef}
                className="relative w-full max-w-[500px]"
                style={{ aspectRatio: `${ICON_STAGE_W} / ${ICON_STAGE_H}` }}
              >
                <div
                  ref={iconStageRef}
                  className="absolute top-0 left-0 origin-top-left"
                  style={{ width: ICON_STAGE_W, height: ICON_STAGE_H }}
                >
                  <svg
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    viewBox="0 0 500 450"
                    fill="none"
                  >
                    <path
                      className="connection-path arc-path"
                      d="M 90 160 C 90 245, 170 250, 250 250"
                      stroke="#9296FD"
                      strokeWidth="2"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      className="connection-path arc-path"
                      d="M 410 160 C 410 245, 330 250, 250 250"
                      stroke="#9296FD"
                      strokeWidth="2"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      className="connection-path stem-path"
                      d="M 250 310 L 250 450"
                      stroke="#9296FD"
                      strokeWidth="2"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>

                  <div className="absolute top-[40px] left-[30px] z-10 h-[120px] w-[120px] rounded-[20px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-white/[0.04] p-[1px] shadow-lg">
                    <div className="flex h-full w-full items-center justify-center rounded-[19px] bg-[#202125]">
                      <Image src={user_icon_1} alt="user" width={40} height={40} />
                    </div>
                  </div>

                  <div className="absolute top-[40px] right-[30px] z-10 h-[120px] w-[120px] rounded-[20px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-white/[0.04] p-[1px] shadow-lg">
                    <div className="flex h-full w-full items-center justify-center rounded-[19px] bg-[#202125]">
                      <Image src={path_icon} alt="path" width={60} height={60} />
                    </div>
                  </div>

                  <div className="absolute top-[190px] left-1/2 z-10 h-[120px] w-[120px] -translate-x-1/2 rounded-[20px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-white/[0.04] p-[1px] shadow-lg">
                    <div className="flex h-full w-full items-center justify-center rounded-[19px] bg-[#202125]">
                      <Image src={ai_icon} alt="ai" width={80} height={80} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="z-10 flex w-full flex-col items-start justify-center p-2 sm:p-4">
            <p className="mb-4 ml-2 text-[28px] opacity-50 sm:ml-6">02</p>

            <div
              ref={card02Ref}
              className="flex min-h-[600px] w-full flex-col space-y-4 rounded-[14px] bg-[#16171B] [mask-image:linear-gradient(to_bottom,#000_0%,#000_92%,transparent_100%)] p-4 [-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_92%,transparent_100%)] sm:p-6 lg:[mask-image:linear-gradient(to_bottom,#000_0%,#000_62%,transparent_100%)] lg:[-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_62%,transparent_100%)]"
            >
              <p className="opacity-50">Ścieżka kariery</p>
              <p className="w-fit max-w-full rounded-[10px] bg-[#D9D9D9] px-4 py-3 text-[14px] font-medium text-black sm:text-[16px] lg:text-[18px]">
                Inżynier ds. jakości w produkcji (Quality Engineer, Industry 4.0)
              </p>
              <div className="flex flex-row flex-wrap items-center justify-start gap-2">
                <div className="flex h-[56px] w-[136px] flex-row items-center justify-center gap-2 rounded-[14px] bg-[#202125]">
                  <ArrowDown className="text-white" />
                  <p>6000PLN</p>
                </div>
                <div className="flex h-[56px] w-[136px] flex-row items-center justify-center gap-2 rounded-[14px] bg-[#202125]">
                  <ArrowUp className="text-white" />
                  <p>9600PLN</p>
                </div>
              </div>
              <div className="glass-card rounded-[10px] p-3 font-light">
                Prognoza: Stabilnie, z lekkim wzrostem w firmach produkcyjnych wdrażających
                digitalizację jakości; więcej ofert jest w dużych zakładach niż w małych firmach.
              </div>

              <div className="flex flex-col items-stretch justify-center gap-4 lg:flex-row">
                <div className="glass-card flex h-[393px] w-full flex-col gap-4 rounded-[16px] p-4 lg:w-1/2">
                  <div className="glass-card flex w-fit items-center justify-center rounded-[10px] px-4 py-3">
                    <p>Progresja wynagrodzeń</p>
                  </div>
                  <SalaryProgressionChart />
                </div>

                <div className="glass-card flex h-[393px] w-full flex-col gap-4 rounded-[16px] p-4 lg:w-1/2">
                  <div className="glass-card flex w-fit items-center justify-center rounded-[10px] px-4 py-3">
                    <p>Atrybuty pracy</p>
                  </div>
                  <JobAttributesChart />
                </div>
              </div>
            </div>

            <p className="mt-2 w-full max-w-6xl px-2 text-[12px] leading-[1.55] font-light text-[#F1F4FF] sm:px-6 sm:text-[16px] lg:text-[20px] lg:leading-[1.5]">
              Dla{' '}
              <span className="bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text font-normal text-transparent">
                każdej rekomendowanej ścieżki
              </span>{' '}
              dostajesz osobny pakiet: widełki wynagrodzeń od Juniora po Lidera, trudność wejścia z
              listą brakujących kompetencji, radar ośmiu wymiarów stylu pracy, trendy rynkowe z
              opisem ich wpływu na Ciebie i komentarz AI, który tłumaczy dane Twoim językiem.
              Wszystko zapisuje się na koncie i możesz pobrać jako PDF
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
