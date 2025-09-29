'use client';

import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import CollapsibleButton from './CollapsibleButton';
import { CareerPath } from '@/lib/types/recommendation';
import Image from 'next/image';
import ReusableCard from '../MarketComponents/AssistantCards';
import HorizontalCarousel from './HorizontalCarousel';
import SwotAnalysis from '../MarketComponents/SwotAnalysis';

interface CareerPathSectionProps {
  path: CareerPath;
  index: number;
}

export default function CareerPathSection({ path, index }: CareerPathSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  const leftImg = `/images/cone-${3 + 2 * index}.png`;
  const rightImg = `/images/cone-${4 + 2 * index}.png`;

  const toggleCollapse = () => {
    if (!contentRef.current || !contentWrapperRef.current) return;

    if (isCollapsed) {
      gsap.set(contentWrapperRef.current, { height: 'auto', visibility: 'visible' });
      const height = contentWrapperRef.current.offsetHeight;
      gsap.fromTo(
        contentWrapperRef.current,
        { height: 0, opacity: 0 },
        {
          height,
          opacity: 1,
          duration: 0.5,
          ease: 'power4.out',
          onComplete: () => {
            if (contentWrapperRef.current) gsap.set(contentWrapperRef.current, { height: 'auto' });
          },
        }
      );
    } else {
      const height = contentWrapperRef.current.offsetHeight;
      gsap.fromTo(
        contentWrapperRef.current,
        { height, opacity: 1 },
        {
          height: 0,
          opacity: 0,
          duration: 0.5,
          ease: 'power4.in',
          onComplete: () => {
            if (contentWrapperRef.current)
              gsap.set(contentWrapperRef.current, { visibility: 'hidden' });
          },
        }
      );
    }

    setIsCollapsed(!isCollapsed);
  };

  useEffect(() => {
    if (contentRef.current && contentWrapperRef.current) {
      if (!isCollapsed) {
        gsap.set(contentWrapperRef.current, { height: 'auto' });
        const height = contentWrapperRef.current.offsetHeight;
        gsap.set(contentWrapperRef.current, { height });
      } else {
        gsap.set(contentWrapperRef.current, { height: 0 });
      }
    }
  }, [isCollapsed]);

  const cards = [
    {
      title: 'Required Skills',
      items: path.requiredSkills,
      imageSrc: '/images/card-assistant-1.png',
      badgeText: 'Required skills',
    },
    {
      title: 'Recommended Courses',
      items: path.recommendedCourses,
      imageSrc: '/images/card-assistant-2.png',
      badgeText: 'Recommended courses',
    },
    {
      title: 'Market Analysis',
      items: path.marketAnalysis,
      imageSrc: '/images/card-assistant-3.png',
      badgeText: 'Market analysis',
    },
  ];

  return (
    <div className="clip-corner-bevel mb-4 flex flex-col overflow-hidden rounded-[28px] border-t border-b border-l shadow-sm sm:border md:flex-row">
      <div className="relative flex items-center justify-center overflow-hidden p-4 md:w-1/6 md:border-r md:p-8">
        <Image
          src={leftImg}
          alt="decor"
          width={148}
          height={148}
          className="pointer-events-none absolute -top-2 -left-14 z-10"
        />
        <Image
          src={rightImg}
          alt="decor"
          width={148}
          height={148}
          className="pointer-events-none absolute -right-8 bottom-2 z-10 -rotate-12 sm:-right-14 sm:-bottom-8"
        />
        <span className="font-korbin relative z-20 rounded-xl border border-r-6 border-b-6 px-5 py-3 text-4xl font-bold text-white md:text-6xl">
          {index + 2}
        </span>
      </div>

      <div className="p-4 max-md:border-t md:w-5/6 md:p-6">
        <div className="flex flex-row items-center justify-between">
          <h2 className="font-korbin mb-1 text-xl">Consider this</h2>
          <CollapsibleButton isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
        </div>

        <h3 className="text-md ibm-plex-mono-regular mb-2 font-medium text-[#915EFF] sm:text-lg">
          {path.careerName}
        </h3>
        <p className="text-gray-500">{path.description}</p>

        <div
          ref={contentWrapperRef}
          className="overflow-hidden"
          style={{
            height: isCollapsed ? 0 : 'auto',
            opacity: isCollapsed ? 0 : 1,
            visibility: isCollapsed ? 'hidden' : 'visible',
          }}
        >
          <div ref={contentRef} className="space-y-5">
            <p className="ibm-plex-mono-regular mt-2">
              <strong>Success probability:</strong> {path.probability}%
            </p>

            <HorizontalCarousel desktopCardsPerView={2.33}>
              {cards.map((card, idx) => (
                <div
                  key={idx}
                  className="/* mobile: 1 karta */ /* desktop: ~2.33 karty */ min-w-[calc(100%/var(--cards))] shrink-0 snap-start lg:min-w-[calc(87%/var(--cards-lg))]"
                >
                  <div className="h-full">
                    <ReusableCard data={card} />
                  </div>
                </div>
              ))}
            </HorizontalCarousel>

            <div className="mt-4">
              <h4 className="mb-3 font-bold">SWOT Analysis:</h4>
              <SwotAnalysis data={path.swot} className="ibm-plex-mono-regular" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
