'use client';

import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import CollapsibleButton from './CollapsibleButton';
import { CareerPath } from '@/lib/types/recommendation';
import Image from 'next/image';

interface CareerPathSectionProps {
  path: CareerPath;
  index: number;
}

export default function CareerPathSection({ path, index }: CareerPathSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  // Obrazki: (3,4) dla index=0, (5,6) dla index=1, itd.
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

  return (
    <div className="clip-corner-bevel mb-4 flex flex-col overflow-hidden rounded-[28px] border-t border-b border-l shadow-sm sm:border md:flex-row">
      {/* Lewy panel — identyczny jak w „1”, ale z unikalnymi obrazkami */}
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

      {/* Prawy panel — jak w „1” */}
      <div className="p-4 max-md:border-t md:w-5/6 md:p-6">
        <div className="flex flex-row items-center justify-between">
          <h2 className="font-korbin mb-1 text-xl">Consider this</h2>
          <CollapsibleButton isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
        </div>

        <h3 className="text-md mb-2 font-medium text-[#915EFF] sm:text-lg">{path.careerName}</h3>
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
          <div ref={contentRef} className="space-y-3">
            <p className="mt-2">
              <strong>Prawdopodobieństwo sukcesu:</strong> {path.probability}%
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-korbin font-bold">Wymagane umiejętności:</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {path.requiredSkills.map((skill, i) => (
                    <li key={i}>{skill}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-korbin font-bold">Rekomendowane kursy:</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {path.recommendedCourses.map((course, i) => (
                    <li key={i}>{course}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-korbin font-bold">Analiza rynku:</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {path.marketAnalysis.map((analysis, i) => (
                  <li key={i}>{analysis}</li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <h4 className="font-korbin mb-3 font-bold">Analiza SWOT:</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border-t border-b-4 border-[#915EFF] p-3">
                  <strong className="text-[#915EFF]">Mocne strony:</strong>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {path.swot.strengths.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border-t border-b-4 border-[#915EFF] p-3">
                  <strong className="text-[#915EFF]">Słabe strony:</strong>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {path.swot.weaknesses.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border-t border-b-4 border-[#915EFF] p-3">
                  <strong className="text-[#915EFF]">Szanse:</strong>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {path.swot.opportunities.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border-t border-b-4 border-[#915EFF] p-3">
                  <strong className="text-[#915EFF]">Zagrożenia:</strong>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {path.swot.threats.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
