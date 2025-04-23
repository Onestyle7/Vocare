'use client';

import { useEffect, useState, useRef } from 'react';
import { MarketAnalysisResponseDto } from '@/app/types/marketAnalysis';
import { fetchMarketAnalysis } from '@/lib/recommendations';
import { gsap } from 'gsap';
import CollapsibleButton from '../AssistantComponents/CollapsibleButton';

export default function MarketAnalysis() {
  const [data, setData] = useState<MarketAnalysisResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await fetchMarketAnalysis();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (error) {
    return (
      <div className="mb-1 flex flex-col overflow-hidden rounded-[28px] border shadow-sm md:flex-row">
        <div className="flex items-center justify-center bg-red-500 p-4 md:w-1/6 md:p-8">
          <span className="text-4xl font-bold text-white md:text-6xl">!</span>
        </div>
        <div className="p-4 md:w-5/6 md:p-6">
          <h2 className="mb-3 text-xl font-semibold">Market Analysis</h2>
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mb-1 flex flex-col overflow-hidden rounded-[28px] border shadow-sm md:flex-row">
        <div className="flex items-center justify-center bg-[#D1B7FF] p-4 md:w-1/6 md:p-8">
          <span className="text-4xl font-bold text-white md:text-6xl">⏳</span>
        </div>
        <div className="p-4 md:w-5/6 md:p-6 mt-8">
          <h2 className="mb-3 text-xl font-semibold">Market Analysis</h2>
          <p className="text-gray-500">Loading market analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-poppins mx-auto max-w-7xl mt-8">
      <h2 className="mb-4 text-2xl font-bold text-[#915EFF]">Job Market Analysis</h2>
      
      {data?.marketAnalysis.industryStatistics.map((stat, index) => (
        <IndustrySection key={index} data={stat} index={index} />
      ))}
      
      {data?.marketAnalysis.marketTrends && data.marketAnalysis.marketTrends.length > 0 && (
        <div className="mt-8 rounded-[28px] border p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-semibold">Current Market Trends</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {data.marketAnalysis.marketTrends.map((trend, index) => (
              <div key={index} className="rounded-lg border p-4 shadow-sm">
                <h4 className="mb-2 font-medium text-[#915EFF]">{trend.trendName}</h4>
                <p className="mb-2 text-gray-700">{trend.description}</p>
                <p className="text-sm font-medium">
                  <span className="text-gray-500">Impact: </span>
                  {trend.impact}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.marketAnalysis.skillDemand && data.marketAnalysis.skillDemand.length > 0 && (
        <div className="mt-8 rounded-[28px] border p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-semibold">In-Demand Skills</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {data.marketAnalysis.skillDemand.map((skill, index) => (
              <div key={index} className="rounded-lg border p-4 shadow-sm">
                <h4 className="mb-1 font-medium">{skill.skill}</h4>
                <p className="text-sm text-gray-500">{skill.industry}</p>
                <div className="mt-2 flex items-center">
                  <span className="mr-2 text-sm">Demand level:</span>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                    skill.demandLevel === 'High' 
                      ? 'bg-green-100 text-green-800' 
                      : skill.demandLevel === 'Medium' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {skill.demandLevel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface IndustryProps {
  data: {
    industry: string;
    averageSalary: string;
    employmentRate: string;
    growthForecast: string;
  };
  index: number;
}

function IndustrySection({ data, index }: IndustryProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  
  const colors = [
    'bg-[#A985FF]',
    'bg-[#BD9EFF]',
    'bg-[#D1B7FF]',
    'bg-[#E5D8FF]'
  ];

  const getColorClass = (idx: number) => {
    return colors[idx % colors.length];
  };

  const toggleCollapse = () => {
    if (!contentRef.current || !contentWrapperRef.current) return;

    if (isCollapsed) {
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

  const getGrowthBadgeClass = (forecast: string) => {
    if (forecast.toLowerCase() === 'high') {
      return 'bg-green-100 text-green-800';
    } else if (forecast.toLowerCase() === 'medium') {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="mb-1 flex flex-col overflow-hidden rounded-[28px] border shadow-sm md:flex-row">
      <div className={`flex items-center justify-center p-4 md:w-1/6 md:p-8 ${getColorClass(index)}`}>
        <span className="text-4xl font-bold text-white md:text-6xl">{index + 1}</span>
      </div>
      <div className="p-4 md:w-5/6 md:p-6">
        <div className="flex flex-row items-center justify-between">
          <h2 className="mb-3 text-xl font-semibold">Industry</h2>
          <CollapsibleButton isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
        </div>

        <h3 className="text-lg font-medium text-[#915EFF]">{data.industry}</h3>
        
        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
          <div className="rounded-lg bg-gray-50 dark:bg-[#101014]/40 border-gray-700/20 dark:border-gray-700 border p-3">
            <p className="text-sm text-gray-500">Average Salary</p>
            <p className="text-lg font-medium text-black dark:text-white">{data.averageSalary}</p>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-[#101014]/40 border-gray-700/20 dark:border-gray-700 border p-3">
            <p className="text-sm text-gray-500">Employment Rate</p>
            <p className="text-lg font-medium text-black dark:text-white">{data.employmentRate}</p>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-[#101014]/40 border-gray-700/20 dark:border-gray-700 border p-3">
            <p className="text-sm text-gray-500">Growth Forecast</p>
            <div className="flex items-center">
              <span className={`mt-1 rounded-full px-2 py-1 text-xs font-medium ${getGrowthBadgeClass(data.growthForecast)}`}>
                {data.growthForecast}
              </span>
            </div>
          </div>
        </div>

        <div
          ref={contentWrapperRef}
          className="overflow-hidden"
          style={{
            height: isCollapsed ? 0 : 'auto',
            opacity: isCollapsed ? 0 : 1,
            visibility: isCollapsed ? 'hidden' : 'visible',
          }}
        >
          <div ref={contentRef} className="mt-4 space-y-3">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border-b-4 border-green-500 bg-green-50 p-3">
                <strong className="text-green-700">Industry Strengths:</strong>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-black">
                  <li>High demand for professionals</li>
                  <li>Flexible employment options</li>
                  <li>Remote work opportunities</li>
                </ul>
              </div>
              <div className="rounded-xl border-b-4 border-blue-500 bg-blue-50 p-3">
                <strong className="text-blue-700">Development Prospects:</strong>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-black">
                  <li>Innovative technologies</li>
                  <li>Global job opportunities</li>
                  <li>Increasing investments in the sector</li>
                </ul>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-medium">Required Qualifications:</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Relevant education</li>
                <li>Knowledge of current technologies</li>
                <li>Teamwork skills</li>
                <li>English language proficiency</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
