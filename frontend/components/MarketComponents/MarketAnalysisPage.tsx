'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ArrowRight } from 'lucide-react';

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
import ButtonGenerate from '../ui/ButtonGenerate';
import CollapsibleButton from '../AssistantComponents/CollapsibleButton';
import Timeline from '../AssistantComponents/Timeline';
import { GridBackgroundDemo } from './GridBackgroundDemo';
import { TerminalDemo } from './LoadingTerminal';
import GenerateMarketFail from './GenerateMarketFail';
import Section from '../SupportComponents/Section';
import NewEmptyStateComponent from './NewEmptyStateComponent';
import { useTokenBalanceContext } from '@/lib/contexts/TokenBalanceContext';
import {
  IndustryStatisticsDto,
  MarketAnalysisDetailsDto,
  MarketAnalysisResponseDto,
  MarketTrendsDto,
  SkillDemandDto,
} from '@/lib/types/marketAnalysis';
import {
  star_generate,
  timeline_icon_1,
  timeline_icon_2,
  timeline_icon_3,
  timeline_icon_4,
} from '@/app/constants';

const TIMELINE_ICONS = [timeline_icon_1, timeline_icon_2, timeline_icon_3, timeline_icon_4];

const formatSalaryRange = (min?: number, max?: number) => {
  const formatter = new Intl.NumberFormat('pl-PL');
  const hasMin = typeof min === 'number' && Number.isFinite(min) && min > 0;
  const hasMax = typeof max === 'number' && Number.isFinite(max) && max > 0;

  if (!hasMin && !hasMax) {
    return '';
  }

  if (hasMin && hasMax) {
    return `${formatter.format(min)} - ${formatter.format(max)} PLN`;
  }

  if (hasMin) {
    return `${formatter.format(min)} PLN`;
  }

  return `${formatter.format(max as number)} PLN`;
};

const formatEmploymentRate = (rate?: number) => {
  if (typeof rate !== 'number' || Number.isNaN(rate)) {
    return '';
  }

  return `${rate}%`;
};

const getGrowthBadgeClass = (forecast?: string) => {
  if (!forecast) {
    return 'bg-slate-200 text-slate-800';
  }

  const normalized = forecast.toLowerCase();

  if (normalized === 'high') {
    return 'bg-green-100 text-green-800';
  }

  if (normalized === 'medium') {
    return 'bg-yellow-100 text-yellow-800';
  }

  if (normalized === 'low') {
    return 'bg-red-100 text-red-800';
  }

  return 'bg-slate-200 text-slate-800';
};

const getDemandBadgeClass = (level?: string) => {
  if (!level) {
    return 'bg-slate-200 text-slate-800';
  }

  const normalized = level.toLowerCase();

  if (normalized === 'high') {
    return 'bg-green-100 text-green-800';
  }

  if (normalized === 'medium') {
    return 'bg-yellow-100 text-yellow-800';
  }

  if (normalized === 'low') {
    return 'bg-red-100 text-red-800';
  }

  return 'bg-slate-200 text-slate-800';
};

const extractMarketAnalysis = (data: unknown): MarketAnalysisDetailsDto | null => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  if ('marketAnalysis' in data && data.marketAnalysis) {
    const { marketAnalysis } = data as MarketAnalysisResponseDto;
    return marketAnalysis;
  }

  if ('industryStatistics' in data) {
    const details = data as MarketAnalysisDetailsDto;
    return {
      industryStatistics: details.industryStatistics ?? [],
      marketTrends: details.marketTrends ?? [],
      skillDemand: details.skillDemand ?? [],
    };
  }

  return null;
};

const buildIndustrySummary = (
  industry?: IndustryStatisticsDto,
  relatedSkills: SkillDemandDto[] = []
) => {
  if (!industry) {
    return '';
  }

  const summaryParts: string[] = [];
  const salaryRange = formatSalaryRange(industry.minSalary, industry.maxSalary);
  const employmentRate = formatEmploymentRate(industry.employmentRate);

  if (salaryRange) {
    summaryParts.push(`Salary range: ${salaryRange}`);
  }

  if (employmentRate) {
    summaryParts.push(`Employment rate: ${employmentRate}`);
  }

  if (industry.growthForecast) {
    summaryParts.push(`Growth forecast: ${industry.growthForecast}`);
  }

  if (relatedSkills.length > 0) {
    summaryParts.push(
      `Key skills: ${relatedSkills
        .map((skill) => `${skill.skill}${skill.demandLevel ? ` (${skill.demandLevel})` : ''}`)
        .join(', ')}`
    );
  }

  return summaryParts.join(' • ');
};

export default function MarketAnalysis() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [analysis, setAnalysis] = useState<MarketAnalysisDetailsDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const { tokenBalance, isLoading: isBalanceLoading, hasActiveSubscription, refresh } =
    useTokenBalanceContext();

  const [isCollapsed, setIsCollapsed] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  const [showFixedButton, setShowFixedButton] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < lastScrollY.current) {
        setShowFixedButton(true);
      }

      if (currentScrollY > lastScrollY.current) {
        setShowFixedButton(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchMarketAnalysis = useCallback(
    async (forceNew = false) => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required', {
          description: 'Please sign in to continue.',
        });
        setLoading(false);
        return;
      }

      try {
        if (!forceNew) {
          try {
            const latestResponse = await axios.get<
              MarketAnalysisResponseDto | MarketAnalysisDetailsDto
            >(`${API_URL}/api/MarketAnalysis/latest`, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            const latestAnalysis = extractMarketAnalysis(latestResponse.data);
            if (latestAnalysis) {
              setAnalysis(latestAnalysis);
            } else {
              setAnalysis(null);
            }
            return;
          } catch (latestError) {
            if (latestError instanceof AxiosError) {
              if (latestError.response?.status === 404) {
                setAnalysis(null);
                return;
              }

              const detail = (latestError.response?.data as { detail?: string })?.detail;
              setError(detail || 'Error fetching latest market analysis.');
              return;
            }

            setError('Error fetching latest market analysis.');
            return;
          }
        }

        const response = await axios.get<MarketAnalysisResponseDto | MarketAnalysisDetailsDto>(
          `${API_URL}/api/MarketAnalysis`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const newAnalysis = extractMarketAnalysis(response.data);

        if (!newAnalysis) {
          const message = 'No market analysis data returned.';
          setAnalysis(null);
          setError(message);
          if (forceNew) {
            toast.error('Error', {
              description: message,
            });
          }
          return;
        }

        setAnalysis(newAnalysis);
        if (forceNew) {
          toast.success('Generated new market analysis');
        }
      } catch (err) {
        if (err instanceof AxiosError) {
          const detail = (err.response?.data as { detail?: string })?.detail;
          setError(detail || 'Error generating market analysis');
          if (forceNew) {
            toast.error('Error', {
              description: detail || 'Failed to generate new market analysis.',
            });
          }
        } else {
          setError('Unexpected error occurred');
          if (forceNew) {
            toast.error('Error', {
              description: 'Unexpected error occurred.',
            });
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [API_URL]
  );

  useEffect(() => {
    fetchMarketAnalysis();
  }, [fetchMarketAnalysis]);

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
        { height, opacity: 1 },
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

  const primaryIndustry = analysis?.industryStatistics?.[0];
  const primarySkills = useMemo(() => {
    if (!analysis?.skillDemand || !primaryIndustry) {
      return [] as SkillDemandDto[];
    }

    const related = analysis.skillDemand.filter((skill) => {
      if (!skill.industry || !primaryIndustry.industry) {
        return false;
      }

      return skill.industry.toLowerCase().includes(primaryIndustry.industry.toLowerCase());
    });

    if (related.length > 0) {
      return related;
    }

    return analysis.skillDemand.slice(0, 3);
  }, [analysis?.skillDemand, primaryIndustry]);

  const timelineItems = useMemo(() => {
    if (!analysis?.marketTrends) {
      return [] as {
        title: string;
        description: string;
        icon: string;
        status: 'current' | 'upcoming';
      }[];
    }

    return analysis.marketTrends.map((trend: MarketTrendsDto, index: number) => ({
      title: trend.trendName || `Trend ${index + 1}`,
      description: trend.impact
        ? `${trend.description} (Impact: ${trend.impact})`
        : trend.description || 'No description provided.',
      icon: TIMELINE_ICONS[index % TIMELINE_ICONS.length],
      status: index === 0 ? ('current' as const) : ('upcoming' as const),
    }));
  }, [analysis?.marketTrends]);

  const longTermInsight = useMemo(() => {
    if (primaryIndustry?.growthForecast) {
      return `Growth forecast: ${primaryIndustry.growthForecast}`;
    }

    if (primarySkills.length > 0) {
      return `Key skills to monitor: ${primarySkills
        .map((skill) => `${skill.skill}${skill.demandLevel ? ` (${skill.demandLevel})` : ''}`)
        .join(', ')}`;
    }

    return '';
  }, [primaryIndustry?.growthForecast, primarySkills]);

  useEffect(() => {
    if (contentRef.current && contentWrapperRef.current && primaryIndustry) {
      if (!isCollapsed) {
        gsap.set(contentWrapperRef.current, { height: 'auto' });
        const height = contentWrapperRef.current.offsetHeight;
        gsap.set(contentWrapperRef.current, { height });
      } else {
        gsap.set(contentWrapperRef.current, { height: 0 });
      }
    }
  }, [analysis, isCollapsed, primaryIndustry]);

  const handleGenerateNewAnalysis = async () => {
    await fetchMarketAnalysis(true);
  };

  if (error && (!analysis || analysis.industryStatistics.length === 0)) {
    return <GenerateMarketFail />;
  }

  if (isLoading && !analysis) {
    return (
      <div className="mx-auto -mt-20 mb-1 flex h-screen max-w-7xl flex-col items-center justify-center overflow-hidden rounded-[28px] max-xl:mx-4">
        <GridBackgroundDemo />
        <TerminalDemo />
      </div>
    );
  }

  if (!analysis || !analysis.industryStatistics || analysis.industryStatistics.length === 0) {
    return (
      <NewEmptyStateComponent
        onGenerateAnalysis={handleGenerateNewAnalysis}
        isLoading={isLoading}
        tokenBalance={tokenBalance}
        isBalanceLoading={isBalanceLoading}
        refresh={refresh}
        hasActiveSubscription={hasActiveSubscription}
      />
    );
  }

  const summary = buildIndustrySummary(primaryIndustry, primarySkills);

  return (
    <Section
      className="relative -mt-[5.25rem] pt-[3.5rem]"
      crosses
      crossesOffset="lg:translate-y-[7.5rem]"
      customPaddings
      id="profile"
    >
      <div className="mt-8 xl:mx-10 xl:mt-16 xl:border-t xl:border-r xl:border-l">
        <div className="font-korbin mx-auto flex max-w-7xl flex-col items-center justify-center p-4 md:p-8">
          <h2 className="font-korbin mt-1 mb-6 flex h-[38px] w-[220px] items-center justify-center rounded-full border-[0.5px] border-white/60 text-sm">
            AI Market Analysis
          </h2>
          <div>
            <div className="clip-corner-bevel mb-4 flex flex-col overflow-hidden rounded-[28px] border-t border-b border-l shadow-sm sm:border md:flex-row">
              <div className="relative flex items-center justify-center overflow-hidden p-4 md:w-1/6 md:border-r md:p-8">
                <Image
                  src="/images/cone.png"
                  alt="decor"
                  width={148}
                  height={148}
                  className="pointer-events-none absolute -top-2 -left-14 z-10"
                />
                <Image
                  src="/images/cone-2.png"
                  alt="decor"
                  width={148}
                  height={148}
                  className="pointer-events-none absolute -right-8 bottom-2 z-10 -rotate-12 sm:-right-14 sm:-bottom-8"
                />
                <span className="font-korbin relative z-20 rounded-xl border border-r-6 border-b-6 px-6 py-2 text-4xl font-bold text-white md:text-6xl">
                  1
                </span>
              </div>
              <div className="p-4 max-md:border-t md:w-5/6 md:p-6">
                <div className="flex flex-row items-center justify-between">
                  <h2 className="font-korbin mb-1 text-xl">Main market insight</h2>
                  <CollapsibleButton isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
                </div>

                <h3 className="text-md ibm-plex-mono-regular mb-2 w-fit rounded-lg border-gray-600/40 font-medium text-[#915EFF] sm:text-lg">
                  {primaryIndustry?.industry || 'No industry data'}
                </h3>

                <p className="text-gray-400">
                  {summary || 'No market metrics available for this industry.'}
                </p>

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
                    {timelineItems.length > 0 && (
                      <>
                        <h4 className="font-korbin mt-4 font-bold">Key trends:</h4>
                        <div className="ibm-plex-mono-regular mt-4 rounded-xl border p-2">
                          <Timeline
                            items={timelineItems}
                            maxDescriptionLength={8}
                            className="mx-0"
                          />
                        </div>
                      </>
                    )}
                    {primarySkills.length > 0 && (
                      <div className="mt-4 rounded-xl p-2">
                        <h4 className="font-korbin font-bold">In-demand skills:</h4>
                        <ul className="mt-1 list-disc space-y-1 pl-5 text-gray-400">
                          {primarySkills.map((skill) => (
                            <li key={`${skill.skill}-${skill.industry}`}>
                              {skill.skill}
                              {skill.demandLevel ? (
                                <span
                                  className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${getDemandBadgeClass(skill.demandLevel)}`}
                                >
                                  {skill.demandLevel}
                                </span>
                              ) : null}
                              {skill.industry ? (
                                <span className="ml-2 text-xs text-gray-500">{skill.industry}</span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {longTermInsight && (
                      <div className="mt-4 rounded-xl p-2">
                        <h4 className="font-korbin font-bold">Growth outlook:</h4>
                        <p className="mt-1 text-gray-400">{longTermInsight}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {analysis.industryStatistics.slice(1).map((industry, index) => (
            <IndustryInsightSection
              key={`${industry.industry}-${index}`}
              industry={industry}
              index={index}
              skillDemand={analysis.skillDemand || []}
            />
          ))}

          <div
            className={`${
              showFixedButton
                ? 'fixed bottom-6 left-1/2 z-50 -translate-x-1/2 translate-y-0 opacity-100'
                : 'fixed bottom-0 left-1/2 z-50 -translate-x-1/2 translate-y-full opacity-0'
            } flex w-1/2 items-center justify-center transition-all duration-500 ease-in-out`}
          >
            <ButtonGenerate
              onClick={() => setIsConfirmDialogOpen(true)}
              disabled={isLoading}
              className="cursor-pointer px-6 py-2"
            >
              {isLoading ? 'Generating...' : 'Generate new market analysis'}
            </ButtonGenerate>
          </div>

          <div className="mt-16 flex w-full justify-center">
            <ButtonGenerate
              onClick={() => setIsConfirmDialogOpen(true)}
              disabled={isLoading}
              className="cursor-pointer px-6 py-2"
            >
              {isLoading ? 'Generating...' : 'Generate new market analysis'}
            </ButtonGenerate>
          </div>

          <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
            <AlertDialogContent className="font-poppins font-korbin mx-auto max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-center text-xl font-bold">
                  Generate new market analysis?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-center text-foreground">
                  {!hasActiveSubscription ? (
                    <>
                      This will take <b className="text-[#915EFF]">5 credits</b> from your account.
                    </>
                  ) : (
                    <p className="mx-auto max-w-xs">
                      You&apos;re on an active subscription, so this action won&apos;t use any tokens.
                    </p>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter className="mt-8 flex flex-row justify-center gap-4 sm:justify-center">
                <AlertDialogCancel className="border-muted-foreground/20 w-[130px]">
                  Cancel
                </AlertDialogCancel>

                {!isBalanceLoading &&
                !hasActiveSubscription &&
                typeof tokenBalance === 'number' &&
                tokenBalance < 5 ? (
                  <Link href="/pricing">
                    <AlertDialogAction
                      className="group bg-[#915EFF] text-white hover:bg-[#7b4ee0]"
                      onClick={() => setIsConfirmDialogOpen(false)}
                    >
                      Get tokens
                      <ArrowRight className="scale-90 transition-all ease-in-out group-hover:translate-x-2" />
                    </AlertDialogAction>
                  </Link>
                ) : (
                  <AlertDialogAction
                    onClick={async () => {
                      await handleGenerateNewAnalysis();
                      refresh();
                      setIsConfirmDialogOpen(false);
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
    </Section>
  );
}

interface IndustryInsightSectionProps {
  industry: IndustryStatisticsDto;
  index: number;
  skillDemand: SkillDemandDto[];
}

function IndustryInsightSection({ industry, index, skillDemand }: IndustryInsightSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  const leftImg = `/images/cone-${3 + 2 * index}.png`;
  const rightImg = `/images/cone-${4 + 2 * index}.png`;

  const relatedSkills = useMemo(() => {
    if (!skillDemand) {
      return [] as SkillDemandDto[];
    }

    const matches = skillDemand.filter((skill) => {
      if (!industry.industry || !skill.industry) {
        return false;
      }

      return skill.industry.toLowerCase().includes(industry.industry.toLowerCase());
    });

    if (matches.length > 0) {
      return matches;
    }

    return skillDemand.slice(0, 3);
  }, [industry.industry, skillDemand]);

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
        { height, opacity: 1 },
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
        gsap.set(contentWrapperRef.current, { height });
      } else {
        gsap.set(contentWrapperRef.current, { height: 0 });
      }
    }
  }, [isCollapsed]);

  const summary = buildIndustrySummary(industry, relatedSkills);
  const salaryRange = formatSalaryRange(industry.minSalary, industry.maxSalary) || 'No data';
  const employmentRate = formatEmploymentRate(industry.employmentRate) || 'No data';

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
          <h2 className="font-korbin mb-1 text-xl">Consider this industry</h2>
          <CollapsibleButton isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
        </div>

        <h3 className="text-md ibm-plex-mono-regular mb-2 font-medium text-[#915EFF] sm:text-lg">
          {industry.industry}
        </h3>
        <p className="text-gray-400">{summary || 'No detailed information available.'}</p>

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
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-[#915EFF]/40 p-3">
                <p className="text-sm text-gray-500">Salary range</p>
                <p className="text-lg font-medium text-black dark:text-white">{salaryRange}</p>
              </div>
              <div className="rounded-xl border border-[#915EFF]/40 p-3">
                <p className="text-sm text-gray-500">Employment rate</p>
                <p className="text-lg font-medium text-black dark:text-white">{employmentRate}</p>
              </div>
              <div className="rounded-xl border border-[#915EFF]/40 p-3">
                <p className="text-sm text-gray-500">Growth forecast</p>
                <span
                  className={`mt-1 inline-block rounded-lg px-2 py-1 text-xs font-medium ${getGrowthBadgeClass(industry.growthForecast)}`}
                >
                  {industry.growthForecast || 'No data'}
                </span>
              </div>
            </div>

            {relatedSkills.length > 0 && (
              <div className="rounded-xl border border-dashed border-[#915EFF]/40 p-3">
                <h4 className="font-korbin mb-2 font-bold">In-demand skills</h4>
                <ul className="list-disc space-y-1 pl-5 text-gray-400">
                  {relatedSkills.map((skill) => (
                    <li key={`${skill.skill}-${skill.industry}`}>
                      {skill.skill}
                      {skill.demandLevel ? (
                        <span
                          className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${getDemandBadgeClass(skill.demandLevel)}`}
                        >
                          {skill.demandLevel}
                        </span>
                      ) : null}
                      {skill.industry ? (
                        <span className="ml-2 text-xs text-gray-500">{skill.industry}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
