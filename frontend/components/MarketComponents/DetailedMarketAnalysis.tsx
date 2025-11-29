'use client';

import { useEffect, useMemo, useState } from 'react';
import axios, { AxiosError } from 'axios';
import {
  IndustryStatisticsDto,
  MarketAnalysisDetailsDto,
  MarketAnalysisResponseDto,
  SalaryProgressionDto,
  SkillDemandDto,
  WorkAttributesDto,
} from '@/lib/types/marketAnalysis';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
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

const numberFormatter = new Intl.NumberFormat('pl-PL');

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';

const isValidNumber = (value?: number | null) => typeof value === 'number' && Number.isFinite(value);

const formatCurrency = (value?: number | null) => {
  if (!isValidNumber(value)) return '—';
  return `${numberFormatter.format(value as number)} PLN`;
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
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="52" fill="#0b1224" stroke="#1f2937" strokeWidth="6" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="transparent"
          stroke="url(#gaugeGradient)"
          strokeWidth="8"
          strokeDasharray={`${(safeValue / 100) * 326} 326`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-slate-400">Entry score</span>
        <span className="text-3xl font-semibold text-white">{Math.round(safeValue)}</span>
        <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">/100</span>
      </div>
    </div>
  );
};

const NarrationCard = ({ title, text }: { title: string; text?: string }) => (
  <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 shadow-sm shadow-slate-900">
    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
    <p className="mt-2 text-sm text-slate-100 leading-relaxed">{text || 'Brak danych od narratora AI.'}</p>
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
          contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }}
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
      <PolarRadiusAxis tick={{ fill: '#94a3b8', fontSize: 10 }} angle={30} domain={[0, 10]} />
      <Radar
        name="Dopasowanie"
        dataKey="score"
        stroke="#22d3ee"
        fill="#22d3ee"
        fillOpacity={0.35}
      />
      <Tooltip
        contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }}
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
  <div className="rounded-3xl border border-slate-800/70 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 shadow-xl shadow-slate-950/40">
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Ścieżka kariery</p>
        <h3 className="text-2xl font-semibold text-white">{industry.industry}</h3>
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-300">
          <span className="rounded-full bg-slate-800/80 px-3 py-1">{formatCurrency(industry.minSalary)}</span>
          <span className="rounded-full bg-slate-800/80 px-3 py-1">{formatCurrency(industry.maxSalary)}</span>
          {isValidNumber(industry.employmentRate) && (
            <span className="rounded-full bg-emerald-900/30 px-3 py-1 text-emerald-200">
              Zatrudnienie: {industry.employmentRate}%
            </span>
          )}
          {industry.growthForecast && (
            <span className="rounded-full bg-indigo-900/30 px-3 py-1 text-indigo-100">
              Prognoza: {industry.growthForecast}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-2 text-xs text-slate-400">
        {relatedSkills.slice(0, 3).map((skill) => (
          <span key={`${skill.skill}-${skill.industry}`} className="rounded-full bg-slate-800/80 px-3 py-1">
            {skill.skill}
          </span>
        ))}
      </div>
    </div>

    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Progresja wynagrodzeń</p>
            <p className="text-sm text-slate-300">Junior → Lead/Expert</p>
          </div>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">PLN</span>
        </div>
        <div className="mt-2 h-[260px]">
          <SalaryChart progression={industry.salaryProgression} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Atrybuty pracy</p>
            <span className="text-xs text-slate-500">0-10</span>
          </div>
          <div className="h-[260px]">
            <WorkAttributesRadar attributes={industry.workAttributes} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Trudność wejścia</p>
            {industry.entryDifficulty?.difficultyLevel && (
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium',
                  difficultyBand(industry.entryDifficulty?.difficultyScore)
                )}
              >
                {industry.entryDifficulty?.difficultyLevel}
              </span>
            )}
          </div>
          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
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
            <p className="mt-3 text-sm text-slate-300">{industry.entryDifficulty.explanation}</p>
          )}
        </div>
      </div>
    </div>

    {industry.aiNarrator && (
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <NarrationCard title="Wynagrodzenia" text={industry.aiNarrator.salaryInsight} />
        <NarrationCard title="Styl pracy" text={industry.aiNarrator.workStyleInsight} />
        <NarrationCard title="Wejście" text={industry.aiNarrator.entryAdvice} />
        <NarrationCard title="Motywacja" text={industry.aiNarrator.motivationalMessage} />
        <NarrationCard title="Rekomendacja" text={industry.aiNarrator.personalizedRecommendation} />
      </div>
    )}
  </div>
);

export default function DetailedMarketAnalysis() {
  const [analysis, setAnalysis] = useState<MarketAnalysisDetailsDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLatest = useMemo(
    () =>
      async function fetchLatestAnalysis() {
        setIsLoading(true);
        setError(null);
        try {
          const response = await axios.get(`${API_BASE}/api/MarketAnalysis/latest`);
          setAnalysis(getAnalysisFromResponse(response.data));
        } catch (err) {
          const axiosErr = err as AxiosError;
          if (axiosErr.response?.status === 404) {
            setError('Brak zapisanej analizy – wygeneruj nową.');
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
      const response = await axios.get(`${API_BASE}/api/MarketAnalysis`);
      setAnalysis(getAnalysisFromResponse(response.data));
    } catch {
      setError('Generowanie analizy nie powiodło się. Spróbuj ponownie.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-8 shadow-2xl shadow-slate-950/40">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">AI Career Radar</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Szczegółowa analiza rynku pracy</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Dane o wynagrodzeniach, atrybutach pracy oraz trudności wejścia na podstawie najnowszej analizy
                OpenAI. Wizualizacje są w pełni responsywne – działają na desktopie i mobile.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchLatest}
                className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
                disabled={isLoading || isGenerating}
              >
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                Ostatnia analiza
              </button>
              <button
                onClick={generateFreshAnalysis}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-900/40 transition hover:scale-[1.01] hover:shadow-indigo-900/60 disabled:opacity-70"
                disabled={isGenerating || isLoading}
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generuj nową
              </button>
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500">
            API: <span className="font-mono">{API_BASE || 'nie zdefiniowano NEXT_PUBLIC_API_URL'}</span>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-900/50 bg-red-950/40 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        {(isLoading || isGenerating) && !analysis && (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6 text-slate-200">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Ładowanie analizy rynku...</span>
          </div>
        )}

        {analysis ? (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Trendy rynkowe</p>
                <div className="mt-3 space-y-3">
                  {analysis.marketTrends?.map((trend) => (
                    <div key={trend.trendName} className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-3">
                      <div className="flex items-center justify-between text-sm text-white">
                        <span>{trend.trendName}</span>
                        <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-300">Wpływ</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{trend.description}</p>
                      {trend.impact && <p className="mt-1 text-xs text-slate-400">{trend.impact}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Popyt na umiejętności</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {analysis.skillDemand?.map((skill) => (
                    <div
                      key={`${skill.skill}-${skill.industry}`}
                      className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-3"
                    >
                      <div className="flex items-center justify-between text-sm text-white">
                        <span>{skill.skill}</span>
                        <span className="rounded-full bg-indigo-900/40 px-2 py-1 text-[11px] text-indigo-100">
                          {skill.demandLevel}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{skill.industry}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {analysis.industryStatistics?.map((industry) => (
                <IndustryCard
                  key={industry.industry}
                  industry={industry}
                  relatedSkills={analysis.skillDemand?.filter((skill) => skill.industry === industry.industry) ?? []}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-8 text-center">
            <p className="text-lg font-medium text-white">Brak danych analitycznych</p>
            <p className="max-w-lg text-sm text-slate-400">
              Pobierz ostatnią analizę lub wygeneruj nową, aby zobaczyć prognozy wynagrodzeń, trudność wejścia i narrację
              AI.
            </p>
            <button
              onClick={generateFreshAnalysis}
              className="mt-2 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-900/40 transition hover:scale-[1.01]"
              disabled={isGenerating}
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generuj nową analizę
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
