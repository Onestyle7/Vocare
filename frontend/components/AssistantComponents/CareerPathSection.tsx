'use client';

import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import CollapsibleButton from './CollapsibleButton';

interface CareerPath {
  careerName: string;
  description: string;
  probability: number;
  requiredSkills: string[];
  recommendedCourses: string[];
  marketAnalysis: string[];
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
}

interface CareerPathSectionProps {
  path: CareerPath;
  index: number;
}

export default function CareerPathSection({ path, index }: CareerPathSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  const toggleCollapse = () => {
    if (!contentRef.current || !contentWrapperRef.current) return;

    if (isCollapsed) {
      // Rozwijanie
      gsap.set(contentWrapperRef.current, { height: 'auto', visibility: 'visible' });
      const height = contentWrapperRef.current.offsetHeight;
      gsap.fromTo(
        contentWrapperRef.current,
        { height: 0, opacity: 0 },
        {
          height: height,
          opacity: 1,
          duration: 0.5,
          ease: 'power4.out',
          onComplete: () => {
            if (contentWrapperRef.current) {
              gsap.set(contentWrapperRef.current, { height: 'auto' });
            }
          },
        }
      );
    } else {
      // Zwijanie
      const height = contentWrapperRef.current.offsetHeight;
      gsap.fromTo(
        contentWrapperRef.current,
        { height: height, opacity: 1 },
        {
          height: 0,
          opacity: 0,
          duration: 0.5,
          ease: 'power4.in',
          onComplete: () => {
            if (contentWrapperRef.current) {
              gsap.set(contentWrapperRef.current, { visibility: 'hidden' });
            }
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
        gsap.set(contentWrapperRef.current, { height: height });
      } else {
        gsap.set(contentWrapperRef.current, { height: 0 });
      }
    }
  }, [isCollapsed]);

  return (
    <div className="mb-1 flex flex-col overflow-hidden rounded-[28px] border shadow-sm md:flex-row">
      <div
        className={`flex items-center justify-center p-4 md:w-1/6 md:p-8 ${
          index === 0 ? 'bg-[#A985FF]' : index === 1 ? 'bg-[#BD9EFF]' : 'bg-[#D1B7FF]'
        }`}
      >
        <span
          className={`text-4xl font-bold md:text-6xl ${
            index === 0 ? 'text-white' : index === 1 ? 'text-white' : 'text-white'
          }`}
        >
          {index + 2}
        </span>
      </div>
      <div className="p-4 md:w-5/6 md:p-6">
        <div className="flex flex-row items-center justify-between">
          <h2 className="mb-3 text-xl font-semibold">Proponowana ścieżka kariery</h2>
          <CollapsibleButton isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
        </div>

        {/* Zawsze widoczne */}
        <h3 className="text-lg font-medium text-[#915EFF]">{path.careerName}</h3>
        <p className="mt-2 text-gray-500">{path.description}</p>

        {/* Zwijana zawartość */}
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
                <h4 className="mb-2 font-medium">Wymagane umiejętności:</h4>
                <ul className="list-disc space-y-1 pl-5">
                  {path.requiredSkills.map((skill, skillIndex) => (
                    <li key={skillIndex}>{skill}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-medium">Rekomendowane kursy:</h4>
                <ul className="list-disc space-y-1 pl-5">
                  {path.recommendedCourses.map((course, courseIndex) => (
                    <li key={courseIndex}>{course}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="mb-2 font-medium">Analiza rynku:</h4>
              <ul className="list-disc space-y-1 pl-5">
                {path.marketAnalysis.map((analysis, analysisIndex) => (
                  <li key={analysisIndex}>{analysis}</li>
                ))}
              </ul>
            </div>
            <div className="mt-6">
              <h4 className="mb-3 font-medium">Analiza SWOT:</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border-t border-b-4 border-[#915EFF] p-3">
                  <strong className="text-[#915EFF]">Mocne strony:</strong>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {path.swot.strengths.map((strength, strengthIndex) => (
                      <li key={strengthIndex}>{strength}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border-t border-b-4 border-[#915EFF] p-3">
                  <strong className="text-[#915EFF]">Słabe strony:</strong>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {path.swot.weaknesses.map((weakness, weaknessIndex) => (
                      <li key={weaknessIndex}>{weakness}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border-t border-b-4 border-[#915EFF] p-3">
                  <strong className="text-[#915EFF]">Szanse:</strong>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {path.swot.opportunities.map((opportunity, oppIndex) => (
                      <li key={oppIndex}>{opportunity}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border-t border-b-4 border-[#915EFF] p-3">
                  <strong className="text-[#915EFF]">Zagrożenia:</strong>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {path.swot.threats.map((threat, threatIndex) => (
                      <li key={threatIndex}>{threat}</li>
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
