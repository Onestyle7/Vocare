import { MarketAnalysisDetailsDto, MarketAnalysisResponseDto } from '../types/marketAnalysis';
import { api } from '../api';

export type MarketAnalysisResult = MarketAnalysisResponseDto | MarketAnalysisDetailsDto;

export const fetchLatestMarketAnalysis = async (): Promise<MarketAnalysisResult> => {
  const { data } = await api.get<MarketAnalysisResult>('/api/MarketAnalysis/latest');
  return data;
};

export const generateMarketAnalysis = async (): Promise<MarketAnalysisResult> => {
  const { data } = await api.get<MarketAnalysisResult>('/api/MarketAnalysis');
  return data;
};
