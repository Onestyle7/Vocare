import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';

import { generateMarketAnalysis, fetchLatestMarketAnalysis, MarketAnalysisResult } from '../api/marketAnalysis';
import { MarketAnalysisDetailsDto, MarketAnalysisResponseDto, MarketTrendsDto, SkillDemandDto } from '../types/marketAnalysis';

const hasToken = () => typeof window !== 'undefined' && !!localStorage.getItem('token');

const extractMarketAnalysis = (data: MarketAnalysisResult): MarketAnalysisDetailsDto => {
  if ('marketAnalysis' in data && data.marketAnalysis) {
    const { marketAnalysis } = data as MarketAnalysisResponseDto;
    return marketAnalysis;
  }

  const details = data as MarketAnalysisDetailsDto;
  return {
    industryStatistics: details.industryStatistics ?? [],
    marketTrends: details.marketTrends ?? [],
    skillDemand: details.skillDemand ?? [],
  };
};

export const useMarketAnalysis = () => {
  const [analysis, setAnalysis] = useState<MarketAnalysisDetailsDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnalysis = useCallback(
    async (forceNew = false) => {
      if (!hasToken()) {
        setError('unauthorized');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const source = forceNew ? await generateMarketAnalysis() : await fetchLatestMarketAnalysis();
        const details = extractMarketAnalysis(source);
        setAnalysis(details);
        return details;
      } catch (err) {
        if (err instanceof AxiosError) {
          const detail = (err.response?.data as { detail?: string })?.detail;
          setError(detail || 'Error fetching market analysis.');
          return null;
        }

        setError('Unexpected error fetching market analysis.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void fetchAnalysis();
  }, [fetchAnalysis]);

  const primaryIndustry = useMemo(() => analysis?.industryStatistics?.[0], [analysis?.industryStatistics]);

  const relatedSkills = useMemo(() => {
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
      return [] as { title: string; description: string; status: 'current' | 'upcoming' }[];
    }

    return analysis.marketTrends.map((trend: MarketTrendsDto, index: number) => ({
      title: trend.trendName || `Trend ${index + 1}`,
      description: trend.impact
        ? `${trend.description} (Impact: ${trend.impact})`
        : trend.description || 'No description provided.',
      status: index === 0 ? ('current' as const) : ('upcoming' as const),
    }));
  }, [analysis?.marketTrends]);

  const longTermInsight = useMemo(() => {
    if (primaryIndustry?.growthForecast) {
      return `Growth forecast: ${primaryIndustry.growthForecast}`;
    }

    if (relatedSkills.length > 0) {
      return `Key skills to monitor: ${relatedSkills
        .map((skill) => `${skill.skill}${skill.demandLevel ? ` (${skill.demandLevel})` : ''}`)
        .join(', ')}`;
    }

    return '';
  }, [primaryIndustry?.growthForecast, relatedSkills]);

  return {
    analysis,
    error,
    isLoading,
    fetchAnalysis,
    primaryIndustry,
    relatedSkills,
    timelineItems,
    longTermInsight,
  };
};
