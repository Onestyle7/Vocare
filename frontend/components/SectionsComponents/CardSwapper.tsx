import CardSwap, { Card } from '@/components/CardSwap/CardSwap';
import { ArrowRight, ArrowUp, FileQuestion, PencilLine } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { Button } from '../ui/button';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { landingCopy } from '@/app/constants/landingCopy';

const CardFeature = () => {
  const { language } = useLanguage();
  const copy = landingCopy[language];

  return (
    <div className="font-korbin mx-4 flex h-auto flex-col overflow-hidden border max-md:mt-[300px] max-md:-mb-[200px] max-md:rounded-lg sm:mx-10 sm:border-r sm:border-b sm:border-l md:h-[600px] md:flex-row">
      <div className="flex w-full flex-col items-center justify-center px-4 py-8 md:w-1/2 md:py-0">
        <div className="text-center sm:text-left">
          <p className="mb-6 font-bold text-gray-400">{copy.cardFeature.eyebrow}</p>
          <h2 className="text-4xl font-bold">{copy.cardFeature.title}</h2>
          <div className="flex w-full items-center justify-center sm:justify-start">
            <Button
              asChild
              className="group relative z-20 mt-8 h-12 w-2/3 rounded-full bg-[linear-gradient(90deg,rgba(146,150,253,1)_0%,rgba(132,145,254,1)_50%,rgba(199,169,254,1)_100%,rgba(157,155,255,1)_77%)] font-bold text-white md:mt-8 md:w-2/3"
              variant="default"
            >
              <Link href="/profile">
                {copy.cardFeature.cta}
                <ArrowRight className="ml-2 transition-all ease-in-out group-hover:translate-x-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="relative h-[400px] w-full overflow-hidden md:h-full md:w-1/2">
        <div className="absolute right-20 bottom-20 left-1/2 -translate-x-1/2 scale-150 transform md:right-0 md:bottom-0 md:left-auto md:translate-x-0">
          <CardSwap
            width={400}
            height={300}
            delay={3000}
            pauseOnHover={true}
            onCardClick={(index) => console.log(`Kliknięto kartę ${index}`)}
          >
            <Card>
              <div className="flex h-full flex-col">
                <div className="flex flex-row items-center border-b-[0.5px] border-gray-300 bg-gradient-to-t from-purple-400/20 to-transparent px-2 py-2">
                  <FileQuestion className="mr-2 h-4 w-4" />
                  <p className="text-xs font-light">{copy.cardFeature.cards[0].label}</p>
                </div>
                <div className="flex-1 overflow-hidden p-2">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    src="/videos/one.mp4"
                    className="h-full w-full rounded-xl object-cover"
                  ></video>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex h-full flex-col">
                <div className="flex flex-row items-center border-b-[0.5px] border-gray-300 bg-gradient-to-t from-purple-400/20 to-transparent px-2 py-2">
                  <ArrowUp className="mr-2 h-4 w-4" />
                  <p className="text-xs font-light">{copy.cardFeature.cards[1].label}</p>
                </div>
                <div className="flex-1 overflow-hidden p-2">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    src="/videos/two.mp4"
                    className="h-full w-full rounded-xl object-cover"
                  ></video>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex h-full flex-col">
                <div className="flex flex-row items-center border-b-[0.5px] border-gray-300 bg-gradient-to-t from-purple-400/20 to-transparent px-2 py-2">
                  <PencilLine className="mr-2 h-4 w-4" />
                  <p className="text-xs font-light">{copy.cardFeature.cards[2].label}</p>
                </div>
                <div className="flex-1 overflow-hidden p-2">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    src="/videos/three.mp4"
                    className="h-full w-full rounded-xl object-cover"
                  ></video>
                </div>
              </div>
            </Card>
          </CardSwap>
        </div>
      </div>
    </div>
  );
};

export default CardFeature;
