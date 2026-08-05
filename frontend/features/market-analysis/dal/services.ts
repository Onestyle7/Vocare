import { Result } from 'neverthrow';
import { RequestInit } from 'next/dist/server/web/spec-extension/request';

import { ApiError } from '@/lib/api/api-client';
import { BaseAppError } from '@/lib/types/result';

import {
  marketAnalysisApiClient,
  MarketAnalysisDetailsDto,
  MarketAnalysisResponseDto,
} from './api';

export type MarketAnalysisDomainError = BaseAppError<
  'Unauthorized' | 'NoAnalysis' | 'MissingCareerPaths' | 'InsufficientTokens' | 'GenericApiError'
>;

const mapMarketAnalysisError = (error: ApiError): MarketAnalysisDomainError => {
  const detail = typeof error.details?.detail === 'string' ? error.details.detail : '';

  if (error.details?.errorCode === 'INSUFFICIENT_TOKENS') {
    return {
      type: 'InsufficientTokens',
      message: 'Brak tokenów lub aktywnej subskrypcji.',
      details: error.details,
    };
  }

  if (error.type === 'UnauthorizedError') {
    return {
      type: 'Unauthorized',
      message: 'Zaloguj się, aby wyświetlić analizę rynku.',
      details: error.details,
    };
  }

  if (error.type === 'NotFoundError') {
    return {
      type: 'MissingCareerPaths',
      message: 'Brak ścieżek kariery z asystenta AI. Wygeneruj rekomendacje w Doradcy kariery.',
      details: error.details,
    };
  }

  if (
    error.type === 'BadGatewayError' ||
    error.type === 'ServiceUnavailableError' ||
    error.type === 'GatewayTimeoutError'
  ) {
    return {
      type: 'GenericApiError',
      message: 'Usługa AI jest chwilowo niedostępna. Spróbuj ponownie później.',
      details: error.details,
    };
  }

  return {
    type: 'GenericApiError',
    message: detail || 'Błąd podczas pobierania analizy rynku.',
    details: error.details,
  };
};

export async function getLatestMarketAnalysisService(
  requestOptions?: RequestInit
): Promise<Result<MarketAnalysisDetailsDto, MarketAnalysisDomainError>> {
  const result = await marketAnalysisApiClient.get<MarketAnalysisResponseDto>(
    '/latest',
    requestOptions
  );

  return result.map((response) => response.data.marketAnalysis).mapErr(mapMarketAnalysisError);
}

export async function generateMarketAnalysisService(
  requestOptions?: RequestInit
): Promise<Result<MarketAnalysisDetailsDto, MarketAnalysisDomainError>> {
  const result = await marketAnalysisApiClient.get<MarketAnalysisResponseDto>('/', requestOptions);

  return result.map((response) => response.data.marketAnalysis).mapErr(mapMarketAnalysisError);
}
