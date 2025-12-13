'use client';

import { useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import {
  IndustryStatisticsDto,
  MarketAnalysisDetailsDto,
  MarketAnalysisResponseDto,
  SalaryProgressionDto,
  SkillDemandDto,
  WorkAttributesDto,
} from '@/lib/types/marketAnalysis';
import { api } from '@/lib/api';
import { ArrowDown, ArrowRight, ArrowUp, Loader2, Sparkles } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import Image from 'next/image';
import {
  market_motywacja,
  market_rekomendacja,
  market_star_big,
  market_star_small,
  market_styl_pracy,
  market_wejscie,
  market_wynagrodzenie,
} from '@/app/constants';
import CountUp from '@/components/CountUp';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const numberFormatter = new Intl.NumberFormat('pl-PL');

// const isDev = 'API: http://localhost:8080';

// const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';

const isValidNumber = (value?: number | null) =>
  typeof value === 'number' && Number.isFinite(value);

const formatCurrency = (value?: number | null) => {
  if (!isValidNumber(value)) return '—';
  return `${numberFormatter.format(value as number)} PLN`;
};

const isMissingCareerPathsError = (message?: string) => {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes('recommendation') || normalized.includes('ścieżek kariery');
};

const getAnalysisFromResponse = (data: unknown): MarketAnalysisDetailsDto | null => {
  if (!data || typeof data !== 'object') return null;

  if ('marketAnalysis' in data && (data as MarketAnalysisResponseDto).marketAnalysis) {
    return (data as MarketAnalysisResponseDto).marketAnalysis;
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

const workAttributeLabels: Record<keyof WorkAttributesDto, string> = {
  stressLevel: 'Stres',
  analyticalThinking: 'Analityka',
  creativity: 'Kreatywność',
  teamwork: 'Zespół',
  independence: 'Samodzielność',
  routineVsDynamic: 'Dynamika',
  customerFacing: 'Kontakt z klientem',
  technicalDepth: 'Głębokość techniczna',
};

const getRadarData = (attributes?: WorkAttributesDto) =>
  Object.entries(workAttributeLabels).map(([key, label]) => ({
    attribute: label,
    score: attributes?.[key as keyof WorkAttributesDto] ?? 0,
  }));

const difficultyBand = (score?: number) => {
  if (!isValidNumber(score)) return 'bg-slate-200 text-slate-800';
  if ((score as number) >= 70) return 'bg-amber-100 text-amber-800';
  if ((score as number) >= 40) return 'bg-blue-100 text-blue-800';
  return 'bg-emerald-100 text-emerald-800';
};

const DifficultyGauge = ({ value }: { value?: number }) => {
  const safeValue = isValidNumber(value) ? Math.min(Math.max(value as number, 0), 100) : 0;
  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      <svg className="h-full w-full" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="52" fill="#0f1014" stroke="#1f2937" strokeWidth="6" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="transparent"
          stroke="url(#gaugeGradient)"
          strokeWidth="12"
          strokeDasharray={`${(safeValue / 100) * 326} 326`}
          strokeLinecap="square"
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-slate-400">Entry score</span>
        <span className="text-3xl font-semibold text-white">{Math.round(safeValue)}</span>
        <span className="text-[11px] text-slate-500 uppercase">/100</span>
      </div>
    </div>
  );
};

type NarrationCardProps = { title: string; text?: string; icon: string };

const NarrationCard = ({ title, text, icon }: NarrationCardProps) => (
  <div className="rounded-2xl border border-b-5 p-4 shadow-sm shadow-slate-900">
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-[7px] border">
        <Image src={icon} alt={`${title} icon`} width={20} height={20} />
      </span>
      <p className="w-fit rounded-[7px] border px-2 py-1 text-sm text-[#ecedf0]">{title}</p>
    </div>
    <p className="mt-2 text-sm leading-relaxed text-slate-100">
      {text || 'Brak danych od narratora AI.'}
    </p>
  </div>
);

const SalaryChart = ({ progression }: { progression?: SalaryProgressionDto[] }) => {
  const data = (progression ?? []).map((item) => ({
    level: item.careerLevel,
    min: item.minSalary,
    avg: item.averageSalary,
    max: item.maxSalary,
  }));

  if (data.length === 0) {
    return <p className="text-sm text-slate-400">Brak danych o progresji wynagrodzeń.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="level" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
        <YAxis tick={{ fill: '#cbd5e1', fontSize: 12 }} />
        <Tooltip
          contentStyle={{ background: '#191A23', border: '1px solid #1e293b', borderRadius: 7 }}
          formatter={(value: number) => formatCurrency(value)}
        />
        <Legend wrapperStyle={{ color: '#e2e8f0' }} />
        <Area type="monotone" dataKey="min" stroke="#0ea5e9" fillOpacity={0} name="Min" />
        <Area type="monotone" dataKey="avg" stroke="#6366f1" fill="url(#colorAvg)" name="Średnia" />
        <Area type="monotone" dataKey="max" stroke="#a855f7" fillOpacity={0} name="Max" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const WorkAttributesRadar = ({ attributes }: { attributes?: WorkAttributesDto }) => (
  <ResponsiveContainer width="100%" height={260}>
    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData(attributes)}>
      <PolarGrid stroke="#1f2937" />
      <PolarAngleAxis dataKey="attribute" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
      <PolarRadiusAxis tick={{ fill: '#94a3b8', fontSize: 0 }} angle={30} domain={[0, 10]} opacity={0} />
      <Radar
        name="Dopasowanie"
        dataKey="score"
        stroke="#6366f1"
        fill="#6366f1"
        fillOpacity={0.35}
      />
      <Tooltip
        contentStyle={{ background: '#191A23', border: '1px solid #1e293b', borderRadius: 12 }}
        formatter={(value: number) => `${value}/10`}
      />
    </RadarChart>
  </ResponsiveContainer>
);

const IndustryCard = ({
  industry,
  relatedSkills,
}: {
  industry: IndustryStatisticsDto;
  relatedSkills: SkillDemandDto[];
}) => (
  <div className="rounded-3xl border border-b-5 p-6 shadow-xl shadow-slate-950/40">
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <p className="w-fit rounded-[3px] px-1 text-sm text-[#ecedf0]">Ścieżka kariery</p>
        <h3 className="mt-2 text-2xl font-semibold text-[#191A23]">
                <span className="inline rounded-[7px] bg-[#F3F3F3] [box-decoration-break:clone] px-2 [-webkit-box-decoration-break:clone]">
                  {industry.industry}
                </span>
              </h3>
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-300">
          <span className="group flex flex-row items-center justify-center overflow-hidden rounded-[7px] border border-slate-800/80 px-3 py-1">
            <div className="mr-2 flex h-4 w-4 flex-col items-center justify-center transition-all group-hover:translate-y-5">
              <ArrowDown className="mr-2 h-4 w-4 group-hover:translate-y-5 transition-all" />
            </div>
            {isValidNumber(industry.minSalary) ? (
              <>
                <CountUp
                  from={0}
                  to={industry.minSalary as number}
                  duration={1.2}
                  separator=" "
                  className="font-semibold text-white"
                />
                <span className="ml-1 text-xs text-slate-300">PLN</span>
              </>
            ) : (
              '—'
            )}
          </span>
          <span className="group flex flex-row items-center justify-center overflow-hidden rounded-[7px] border border-slate-800/80 px-3 py-1">
            <div className="mr-2 flex h-4 w-4 flex-col items-center justify-center transition-all group-hover:-translate-y-5">
              <ArrowUp className="mr-2 h-4 w-4 group-hover:-translate-y-5 transition-all" />
            </div>
            {isValidNumber(industry.maxSalary) ? (
              <>
                <CountUp
                  from={0}
                  to={industry.maxSalary as number}
                  duration={1.4}
                  separator=" "
                  className="font-semibold text-white"
                />
                <span className="ml-1 text-xs text-slate-300">PLN</span>
              </>
            ) : (
              '—'
            )}
          </span>
          {isValidNumber(industry.employmentRate) && (
            <span className="rounded-[7px] border border-emerald-900/30 px-3 py-1 text-emerald-200">
              Zatrudnienie: {industry.employmentRate}%
            </span>
          )}
          {industry.growthForecast && (
            <span className="rounded-[7px] border px-3 py-1 text-indigo-100">
              Prognoza: {industry.growthForecast}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-2 text-xs text-slate-400">
        {relatedSkills.slice(0, 3).map((skill) => (
          <span
            key={`${skill.skill}-${skill.industry}`}
            className="rounded-[7px] border px-3 py-1 border-b-5"
          >
            {skill.skill}
          </span>
        ))}
      </div>
    </div>

        <div className="mt-6 space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="w-fit px-2 mb-2 py-1 rounded-[7px] border text-sm text-[#ecedf0]">
                Progresja wynagrodzeń
              </p>
              <p className="w-fit rounded-[3px] px-1 text-sm text-[#ecedf0]">
                Junior → Lead/Expert
              </p>
            </div>
            <span className="rounded-[5px] bg-[#F3F3F3] px-2 py-[2px] text-xs text-[#191A23] self-start">
              PLN
            </span>
          </div>
          <div className="mt-2 h-[360px] flex items-center justify-center">
            <SalaryChart progression={industry.salaryProgression} />
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <p className="w-fit px-2 mb-2 py-1 rounded-[7px] border text-sm text-[#ecedf0]">
              Atrybuty pracy
            </p>
            <span className="rounded-[5px] bg-[#F3F3F3] px-2 py-[2px] text-xs text-[#191A23] self-start">
              0-10
            </span>
          </div>
          <div className="mt-2 h-[360px] flex items-center justify-center">
            <WorkAttributesRadar attributes={industry.workAttributes} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-4">
        <div className="flex items-center justify-between">
                        <p className="w-fit px-2 mb-2 py-1 rounded-[7px] border text-sm text-[#ecedf0]">Trudność wejścia</p>
          {industry.entryDifficulty?.difficultyLevel && (
            <span
              className={cn(
                "rounded-[5px] bg-[#F3F3F3]! px-2 py-[2px] text-xs text-[#191A23]! self-start",
                difficultyBand(industry.entryDifficulty?.difficultyScore)
              )}
            >
              {industry.entryDifficulty?.difficultyLevel}
            </span>
          )}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <DifficultyGauge value={industry.entryDifficulty?.difficultyScore} />
            <div className="space-y-2 text-sm text-slate-200">
              <p className="text-slate-300">
                Szacowany czas: {industry.entryDifficulty?.estimatedTimeToReady || '—'}
              </p>
              <p className="text-slate-300">
                Brakujące umiejętności: {industry.entryDifficulty?.missingSkillsCount ?? 0}
              </p>
              {industry.entryDifficulty?.missingSkills?.length ? (
                <ul className="list-disc space-y-1 pl-4 text-slate-300">
                  {industry.entryDifficulty.missingSkills.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400">Brak listy umiejętności do nadrobienia.</p>
              )}
            </div>
          </div>

          {industry.entryDifficulty?.explanation && (
            <p className="text-sm text-slate-300">
              {industry.entryDifficulty.explanation}
            </p>
          )}
        </div>
      </div>

    </div>


    {industry.aiNarrator && (
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {[
          {
            title: 'Wynagrodzenia',
            text: industry.aiNarrator.salaryInsight,
            icon: market_wynagrodzenie,
          },
          {
            title: 'Styl pracy',
            text: industry.aiNarrator.workStyleInsight,
            icon: market_styl_pracy,
          },
          { title: 'Wejście', text: industry.aiNarrator.entryAdvice, icon: market_wejscie },
          {
            title: 'Motywacja',
            text: industry.aiNarrator.motivationalMessage,
            icon: market_motywacja,
          },
          {
            title: 'Rekomendacja',
            text: industry.aiNarrator.personalizedRecommendation,
            icon: market_rekomendacja,
          },
        ].map((card) => (
          <NarrationCard key={card.title} {...card} />
        ))}
      </div>
    )}
  </div>
);

export default function DetailedMarketAnalysis() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<MarketAnalysisDetailsDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;

    const normalized = error.toLowerCase();
    const isMissingCareerPaths = isMissingCareerPathsError(error);
    const isMissingPrevious = normalized.includes('brak zapisanej analizy');

    const title = isMissingCareerPaths
      ? 'Brak ścieżek kariery'
      : isMissingPrevious
        ? 'Nie masz poprzedniej analizy rynku'
        : 'Brak ścieżek kariery';

    toast.error(title, {
      description: error,
      action: isMissingCareerPaths
        ? {
            label: 'Advisor',
            onClick: () => router.push('/assistant'),
          }
        : undefined,
    });
  }, [error, router]);

  const fetchLatest = useMemo(
    () =>
      async function fetchLatestAnalysis() {
        setIsLoading(true);
        setError(null);
        try {
          const response = await api.get('/api/MarketAnalysis/latest');
          setAnalysis(getAnalysisFromResponse(response.data));
        } catch (err) {
          const axiosErr = err as AxiosError;
          if (axiosErr.response?.status === 404) {
            setError('Brak zapisanej analizy - wygeneruj nową.');
          } else {
            setError('Nie udało się pobrać ostatniej analizy.');
          }
        } finally {
          setIsLoading(false);
        }
      },
    []
  );

  const generateFreshAnalysis = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await api.get('/api/MarketAnalysis');
      setAnalysis(getAnalysisFromResponse(response.data));
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      const detail = axiosErr.response?.data?.detail;
      if (isMissingCareerPathsError(detail)) {
        setError(
          'Brak ścieżek kariery z asystenta AI. Wygeneruj rekomendacje na stronie głównej, aby móc stworzyć analizę rynku.'
        );
      } else {
        setError(detail || 'Rozpocznij od wygenerowania ścieżek kariery.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  return (
    <div className="font-grotesk min-h-screen px-4 py-10 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="rounded-3xl border border-b-5 p-8 shadow-2xl shadow-slate-950/40">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:w-2/3">
              <p className="w-fit rounded-[3px] px-1 text-sm text-[#ecedf0]">AI Career Radar</p>
              <h1 className="mt-2 text-3xl font-semibold text-[#191A23]">
                <span className="inline rounded-[7px] bg-[#F3F3F3] [box-decoration-break:clone] px-2 [-webkit-box-decoration-break:clone]">
                  Szczegółowa analiza rynku pracy
                </span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Dane o wynagrodzeniach, atrybutach pracy oraz trudności wejścia na podstawie
                najnowszej analizy.
              </p>
            </div>
            <div className="flex w-full items-center justify-center gap-3 md:w-1/3">
              <Button
                onClick={generateFreshAnalysis}
                className="group relative z-20 mt-4 h-12 w-full rounded-[7px] bg-[#F3F3F3] font-bold text-[#191A23] md:mt-2 md:w-2/3 hover:-translate-y-2 hover:border-b-3 border-b-[#F3F3F3] border-r-[#F3F3F3] hover:border-r-3"
                variant="default"
                disabled={isGenerating || isLoading}
              >
                Generuj nową
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 transition-all ease-in-out group-hover:translate-x-2" />
                )}
              </Button>
            </div>
          </div>
          {/* {isDev && (
          <div className="mt-4 text-xs text-slate-500">
            API: <span className="font-mono">{API_BASE || 'nie zdefiniowano NEXT_PUBLIC_API_URL'}</span>
          </div>
          )} */}
        </header>

        {(isLoading || isGenerating) && !analysis && (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6 text-slate-200">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Ładowanie analizy rynku...</span>
          </div>
        )}

        {analysis ? (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-b-5 p-5">
                <p className="w-fit rounded-[3px] px-1 text-sm text-[#ecedf0]">Trendy rynkowe</p>
                <div className="mt-3 space-y-3">
                  {analysis.marketTrends?.map((trend) => (
                    <div key={trend.trendName} className="rounded-2xl border border-b-5 p-3">
                      <div className="flex items-start justify-between text-sm text-white">
                        <div className="w-fit">
                          <span className="leading-none">{trend.trendName}</span>
                          <Separator className="mt-4 mb-3 h-[1.5px]! w-full" />
                        </div>

                        {/* WPŁYW */}
                        <span className="rounded-[5px] bg-[#F3F3F3] px-2 py-[2px] text-xs text-[#191A23]">
                          Wpływ
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-300">{trend.description}</p>

                      {trend.impact && <p className="mt-1 text-xs text-gray-400">{trend.impact}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-b-5 p-5">
                <p className="w-fit rounded-[3px] px-1 text-sm text-[#ecedf0]">
                  Popyt na umiejętności
                </p>
                <div className="relative">
                  <div className="absolute top-[50px] left-[36px] h-[90%] border-[0.5px] border-[#F3F3F3]/50" />
                  <div className="flex w-full flex-row items-center space-x-6 px-6 py-6">
                    <Image src={market_star_big} alt="shape" width={24} height={24} />
                    <p className="text-lg font-semibold md:text-3xl">Ściągawka</p>
                  </div>
                  <div className="mt-3 grid gap-6 sm:grid-cols-1">
                    {analysis.skillDemand?.map((skill) => (
                      <div
                        key={`${skill.skill}-${skill.industry}`}
                        className="flex items-center gap-4 rounded-2xl border p-4"
                      >
                        {/* Lewa strona – miejsce na zdjęcie/ikonę */}
                        <div className="flex h-10 w-10 shrink-0 items-start justify-center">
                          <Image src={market_star_small} alt="shape" width={20} height={20} />
                        </div>

                        {/* Prawa strona – kontent */}
                        <div className="w-full">
                          <div className="flex items-center justify-between text-lg font-semibold text-white">
                            <span>{skill.skill}</span>
                            <span className="rounded-[5px] bg-[#F3F3F3] px-2 py-[2px] text-xs text-[#191A23]">
                              {skill.demandLevel}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-400">{skill.industry}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {analysis.industryStatistics?.map((industry) => (
                <IndustryCard
                  key={industry.industry}
                  industry={industry}
                  relatedSkills={
                    analysis.skillDemand?.filter((skill) => skill.industry === industry.industry) ??
                    []
                  }
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border p-8 text-center">
            <p className="text-lg font-medium text-white">Brak danych analitycznych</p>
            <p className="max-w-lg text-sm text-slate-400">
              Po wygenerowaniu rekomendacji ścieżek kariery, będziesz mógł wygenerować szczegółową
              analizę rynku pracy dostosowaną do Twoich celów zawodowych.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
