'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { gsap } from 'gsap';
import CollapsibleButton from '../AssistantComponents/CollapsibleButton';
import { TerminalDemo } from './LoadingTerminal';
import { GridBackgroundDemo } from './GridBackgroundDemo';
import Image from 'next/image';
import { star_generate } from '@/app/constants';
import { toast } from 'sonner';
import CustomButton from '../ui/CustomButton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { useTokenBalanceContext } from '@/lib/contexts/TokenBalanceContext';
import Link from 'next/link';
import GenerateMarketFail from './GenerateMarketFail';
import Section from '../SupportComponents/Section';
import NewEmptyStateComponent from './NewEmptyStateComponent';

// Type definitions
interface MarketTrend {
  trendName: string;
  description: string;
  impact: string;
}

interface SkillDemand {
  skill: string;
  industry: string;
  demandLevel: string;
}

interface IndustryStatistic {
  industry: string;
  minSalary: number;
  maxSalary: number;
  employmentRate: number;
  growthForecast: string;
}

interface MarketAnalysisDto {
  industryStatistics: IndustryStatistic[];
  marketTrends: MarketTrend[];
  skillDemand: SkillDemand[];
}

interface ApiResponse {
  marketAnalysis: MarketAnalysisDto;
}

export default function MarketAnalysis() {
  const [data, setData] = useState<ApiResponse | MarketAnalysisDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const { tokenBalance, isLoading: isBalanceLoading, refresh } = useTokenBalanceContext();

  const [showFixedButton, setShowFixedButton] = useState(false);
  const lastScrollY = useRef(0);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Scroll up
      if (currentScrollY < lastScrollY.current) {
        setShowFixedButton(true);
      }

      // Scroll down
      if (currentScrollY > lastScrollY.current) {
        setShowFixedButton(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleResponseData = (responseData: unknown) => {
    if (
      typeof responseData === 'object' &&
      responseData !== null &&
      'marketAnalysis' in responseData
    ) {
      setData(responseData as ApiResponse);
    } else if (
      typeof responseData === 'object' &&
      responseData !== null &&
      'industryStatistics' in responseData
    ) {
      setData({ marketAnalysis: responseData as MarketAnalysisDto });
    } else {
      setData(responseData as ApiResponse | MarketAnalysisDto | null);
    }
  };

  const loadData = useCallback(
    async (useNewData = false) => {
      setLoading(true);
      setError(null);
      setData(null);

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required', {
          description: 'Please sign in to continue.',
        });
        setLoading(false);
        return;
      }

      try {
        if (useNewData) {
          const response = await axios.get(`${API_URL}/api/MarketAnalysis`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          console.log('New market analysis raw data:', response.data);
          handleResponseData(response.data);
          toast.success('Generated new market analysis');
        } else {
          try {
            const latestResponse = await axios.get(`${API_URL}/api/MarketAnalysis/latest`, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            console.log('Latest market analysis raw data:', latestResponse.data);
            handleResponseData(latestResponse.data);
          } catch (latestError) {
            const axiosError = latestError as AxiosError;
            if (axiosError.response?.status === 404) {
              console.log('No existing analysis found, setting data to null');
              setData(null);
            } else {
              console.error('Error fetching latest market analysis:', latestError);
              setError(
                (axiosError.response?.data as { detail?: string })?.detail ||
                  'Error fetching latest market analysis.'
              );
            }
          }
        }
      } catch (err) {
        const axiosError = err as AxiosError;
        console.error('Error fetching market analysis:', err);
        setError(
          (axiosError.response?.data as { detail?: string })?.detail ||
            'Error generating market analysis'
        );

        if (useNewData) {
          toast.error('Error', {
            description: 'Failed to generate new market analysis.',
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [API_URL]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerateNewAnalysis = async () => {
    await loadData(true);
  };

  if (error) {
    return <GenerateMarketFail />;
  }

  if (isLoading) {
    return (
      <div className="mx-auto -mt-20 mb-1 flex h-screen max-w-7xl flex-col items-center justify-center overflow-hidden rounded-[28px] max-xl:mx-4">
        <GridBackgroundDemo />
        <TerminalDemo />
      </div>
    );
  }

  // For debugging
  console.log('Rendering with data structure:', data);

  const getMarketAnalysis = (): MarketAnalysisDto | null => {
    if (!data) return null;

    // Check if data is an ApiResponse with marketAnalysis property
    if ('marketAnalysis' in data && data.marketAnalysis) {
      return data.marketAnalysis;
    }

    // Check if data is directly a MarketAnalysisDto
    if ('industryStatistics' in data) {
      return data as MarketAnalysisDto;
    }

    return null;
  };

  const marketAnalysis = getMarketAnalysis();

  // If there's no market analysis data, show the EmptyStateComponent
  if (
    !marketAnalysis ||
    !marketAnalysis.industryStatistics ||
    marketAnalysis.industryStatistics.length === 0
  ) {
    return (
      <NewEmptyStateComponent
        onGenerateAnalysis={handleGenerateNewAnalysis}
        isLoading={isLoading}
        tokenBalance={tokenBalance}
        isBalanceLoading={isBalanceLoading}
        refresh={refresh}
      />
    );
  }

  // Otherwise, show the full market analysis UI
  return (
    <Section
      className="relative -mt-[5.25rem] pt-[3.5rem]"
      crosses
      crossesOffset="lg:translate-y-[7.5rem]"
      customPaddings
      id="profile"
    >
      <div className="mt-8 xl:mx-10 xl:mt-16 xl:border-t xl:border-r xl:border-l">
        <div className="font-poppins mx-auto mt-8 mb-4 flex max-w-7xl flex-col items-center justify-center">
          <h2 className="mb-4 ml-4 text-2xl font-bold text-[#915EFF]">Job Market Analysis</h2>
          <div>
            {marketAnalysis.industryStatistics.map((stat, index) => (
              <IndustrySection key={index} data={stat} index={index} />
            ))}

            {marketAnalysis.marketTrends && marketAnalysis.marketTrends.length > 0 && (
              <div className="mx-4 mt-8 rounded-[28px] border p-6 shadow-sm">
                <h3 className="mb-4 text-xl font-semibold">Current Market Trends</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {marketAnalysis.marketTrends.map((trend, index) => (
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

            {marketAnalysis.skillDemand && marketAnalysis.skillDemand.length > 0 && (
              <div className="mx-4 mt-8 rounded-[28px] border p-6 shadow-sm">
                <h3 className="mb-4 text-xl font-semibold">In-Demand Skills</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {marketAnalysis.skillDemand.map((skill, index) => (
                    <div key={index} className="rounded-lg border p-4 shadow-sm">
                      <h4 className="mb-1 font-medium">{skill.skill}</h4>
                      <p className="text-sm text-gray-500">{skill.industry}</p>
                      <div className="mt-2 flex items-center">
                        <span className="mr-2 text-sm">Demand level:</span>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            skill.demandLevel === 'High'
                              ? 'bg-green-100 text-green-800'
                              : skill.demandLevel === 'Medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {skill.demandLevel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              className={`${
                showFixedButton
                  ? 'fixed bottom-6 left-1/2 z-50 -translate-x-1/2 translate-y-0 opacity-100'
                  : 'fixed bottom-0 left-1/2 z-50 -translate-x-1/2 translate-y-full opacity-0'
              } flex w-1/2 items-center justify-center transition-all duration-500 ease-in-out`}
            >
              <CustomButton
                onClick={() => setIsConfirmDialogOpen(true)}
                disabled={isLoading}
                className="cursor-pointer px-6 py-2"
              >
                {isLoading ? 'Generating...' : 'Generate new market analysis'}
              </CustomButton>
            </div>

            {/* STATIC button always under content */}
            <div className="mt-16 flex w-full justify-center">
              <CustomButton
                onClick={() => setIsConfirmDialogOpen(true)}
                disabled={isLoading}
                className="cursor-pointer px-6 py-2"
              >
                {isLoading ? 'Generating...' : 'Generate new market analysis'}
              </CustomButton>
            </div>

            <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
              <AlertDialogContent className="font-poppins mx-auto max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-center text-xl font-bold">
                    Generate new recommendation?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-center">
                    This will take <b className="text-[#915EFF]">5 credits</b> from Your account.
                  </AlertDialogDescription>

                  <div className="mt-2 text-center text-sm font-extralight">
                    Current balance:{' '}
                    <span className="font-bold">{isBalanceLoading ? '...' : tokenBalance}</span>
                  </div>
                </AlertDialogHeader>

                <AlertDialogFooter className="flex justify-center gap-4 sm:justify-center">
                  <AlertDialogCancel className="border-gray-200">Cancel</AlertDialogCancel>

                  {!isBalanceLoading && typeof tokenBalance === 'number' && tokenBalance < 5 ? (
                    <Link href="/pricing">
                      <AlertDialogAction
                        className="bg-[#915EFF] text-white hover:bg-[#7b4ee0]"
                        onClick={() => setIsConfirmDialogOpen(false)}
                      >
                        Get tokens
                        <Image src={star_generate} alt="star" width={16} height={16} />
                      </AlertDialogAction>
                    </Link>
                  ) : (
                    <AlertDialogAction
                      onClick={async () => {
                        await handleGenerateNewAnalysis();
                        refresh();
                      }}
                      className="bg-[#915EFF] text-white hover:bg-[#7b4ee0]"
                    >
                      Generate
                      <Image src={star_generate} alt="star" width={16} height={16} />
                    </AlertDialogAction>
                  )}
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </Section>
  );
}

interface IndustrySectionProps {
  data: IndustryStatistic;
  index: number;
}

function IndustrySection({ data, index }: IndustrySectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const salaryBoxRef = useRef<HTMLDivElement | null>(null);

  const imageRef1 = useRef<HTMLImageElement | null>(null);
  const chartBoxRef = useRef<HTMLDivElement | null>(null);

  const imageRef2 = useRef<HTMLImageElement | null>(null);
  const fireBoxRef = useRef<HTMLDivElement | null>(null);

  const colors = ['bg-[#A985FF]', 'bg-[#BD9EFF]', 'bg-[#D1B7FF]', 'bg-[#E5D8FF]'];

  const getColorClass = (idx: number) => {
    return colors[idx % colors.length];
  };

  const formatSalaryRange = (min: number, max: number) => {
    if (min === 0 && max === 0) return '—';
    const formatter = new Intl.NumberFormat('pl-PL');
    return `${formatter.format(min)} - ${formatter.format(max)} PLN`;
  };

  const formatEmploymentRate = (rate: number) => (rate !== undefined ? `${rate}%` : '—');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      const ctx = gsap.context(() => {
        if (!salaryBoxRef.current || !imageRef.current) return;

        gsap.set(imageRef.current, { opacity: 0, x: 50, y: 50 });

        const onEnter = () => {
          gsap.to(imageRef.current, {
            opacity: 1,
            x: 0,
            y: 0,
            duration: 0.5,
            ease: 'power3.out',
          });
        };

        const onLeave = () => {
          gsap.to(imageRef.current, {
            opacity: 0,
            x: 50,
            y: 50,
            duration: 0.4,
            ease: 'power3.in',
          });
        };

        salaryBoxRef.current.addEventListener('mouseenter', onEnter);
        salaryBoxRef.current.addEventListener('mouseleave', onLeave);

        return () => {
          salaryBoxRef.current?.removeEventListener('mouseenter', onEnter);
          salaryBoxRef.current?.removeEventListener('mouseleave', onLeave);
        };
      }, salaryBoxRef);

      return () => ctx.revert();
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      const ctx = gsap.context(() => {
        if (!chartBoxRef.current || !imageRef1.current) return;

        gsap.set(imageRef1.current, { opacity: 0, x: 50, y: 50 });

        const onEnter = () => {
          gsap.to(imageRef1.current, {
            opacity: 1,
            x: 0,
            y: 0,
            duration: 0.5,
            ease: 'power3.out',
          });
        };

        const onLeave = () => {
          gsap.to(imageRef1.current, {
            opacity: 0,
            x: 50,
            y: 50,
            duration: 0.4,
            ease: 'power3.in',
          });
        };

        chartBoxRef.current.addEventListener('mouseenter', onEnter);
        chartBoxRef.current.addEventListener('mouseleave', onLeave);

        return () => {
          chartBoxRef.current?.removeEventListener('mouseenter', onEnter);
          chartBoxRef.current?.removeEventListener('mouseleave', onLeave);
        };
      }, chartBoxRef);

      return () => ctx.revert();
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      const ctx = gsap.context(() => {
        if (!fireBoxRef.current || !imageRef2.current) return;

        gsap.set(imageRef2.current, { opacity: 0, x: 50, y: 50 });

        const onEnter = () => {
          gsap.to(imageRef2.current, {
            opacity: 1,
            x: 0,
            y: 0,
            duration: 0.5,
            ease: 'power3.out',
          });
        };

        const onLeave = () => {
          gsap.to(imageRef2.current, {
            opacity: 0,
            x: 50,
            y: 50,
            duration: 0.4,
            ease: 'power3.in',
          });
        };

        fireBoxRef.current.addEventListener('mouseenter', onEnter);
        fireBoxRef.current.addEventListener('mouseleave', onLeave);

        return () => {
          fireBoxRef.current?.removeEventListener('mouseenter', onEnter);
          fireBoxRef.current?.removeEventListener('mouseleave', onLeave);
        };
      }, fireBoxRef);

      return () => ctx.revert();
    }
  }, []);

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
    <div className="mx-4 mb-1 flex flex-col overflow-hidden rounded-[28px] border shadow-sm md:flex-row">
      <div
        className={`flex items-center justify-center p-4 md:w-1/6 md:p-8 ${getColorClass(index)}`}
      >
        <span className="text-4xl font-bold text-white md:text-6xl">{index + 1}</span>
      </div>
      <div className="p-4 md:w-5/6 md:p-6">
        <div className="flex flex-row items-center justify-between">
          <h2 className="mb-3 text-xl font-semibold">Industry</h2>
          <CollapsibleButton isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
        </div>

        <h3 className="text-lg font-medium text-[#915EFF]">{data.industry}</h3>

        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
          <div
            className="relative overflow-hidden rounded-lg border border-dashed border-gray-700/20 bg-gray-50 p-3 dark:border-gray-700 dark:bg-[#101014]/40"
            ref={salaryBoxRef}
          >
            <p className="text-sm text-gray-500">Average Salary</p>
            <p className="text-lg font-medium text-black dark:text-white">
              {formatSalaryRange(data.minSalary, data.maxSalary)}
            </p>
          </div>
          <div
            className="relative overflow-hidden rounded-lg border border-dashed border-gray-700/20 bg-gray-50 p-3 dark:border-gray-700 dark:bg-[#101014]/40"
            ref={chartBoxRef}
          >
            <p className="text-sm text-gray-500">Employment Rate</p>
            <p className="text-lg font-medium text-black dark:text-white">
              {formatEmploymentRate(data.employmentRate)}
            </p>
          </div>
          <div
            className="relative overflow-hidden rounded-lg border border-dashed border-gray-700/20 bg-gray-50 p-3 dark:border-gray-700 dark:bg-[#101014]/40"
            ref={fireBoxRef}
          >
            <p className="text-sm text-gray-500">Growth Forecast</p>
            <div className="flex items-center">
              <span
                className={`mt-1 rounded-lg px-2 py-1 text-xs font-medium ${getGrowthBadgeClass(data.growthForecast)}`}
              >
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
              <div className="rounded-xl border-b-4 border-[#915EFF] p-3">
                <strong className="text-[#915EFF]">Industry Strengths:</strong>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-black dark:text-[#F3F3F3]">
                  <li>High demand for professionals</li>
                  <li>Flexible employment options</li>
                  <li>Remote work opportunities</li>
                </ul>
              </div>
              <div className="rounded-xl border-b-4 border-[#915EFF] p-3">
                <strong className="text-[#915EFF]">Development Prospects:</strong>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-black dark:text-[#F3F3F3]">
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
