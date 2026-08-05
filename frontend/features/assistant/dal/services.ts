import { Result } from 'neverthrow';
import { RequestInit } from 'next/dist/server/web/spec-extension/request';

import { BaseAppError } from '@/lib/types/result';

import { aiApiClient, AiCareerResponse, CareerPathMatchResult, jobOffersApiClient } from './api';

export type AssistantDomainError = BaseAppError<
  'Unauthorized' | 'NoRecommendation' | 'InsufficientTokens' | 'AiServiceUnavailable' | 'NoProfile'
>;

export type JobMatchDomainError = BaseAppError<'Unauthorized' | 'NoRecommendation'>;

export async function getLastRecommendationService(
  requestOptions?: RequestInit
): Promise<Result<AiCareerResponse, AssistantDomainError>> {
  const result = await aiApiClient.get<AiCareerResponse>('/last-recommendation', requestOptions);

  return result
    .map((response) => response.data)
    .mapErr((error): AssistantDomainError => {
      switch (error.type) {
        case 'UnauthorizedError':
          return {
            type: 'Unauthorized',
            message: 'Zaloguj się, aby wyświetlić rekomendacje',
            details: error.details,
          };
        case 'NotFoundError':
          return {
            type: 'NoRecommendation',
            message: 'Brak ostatniej rekomendacji',
            details: error.details,
          };
        default:
          return {
            type: 'GenericApiError',
            message: 'Błąd podczas pobierania ostatniej rekomendacji',
            details: error.details,
          };
      }
    });
}

export async function generateRecommendationsService(
  requestOptions?: RequestInit
): Promise<Result<AiCareerResponse, AssistantDomainError>> {
  const result = await aiApiClient.get<AiCareerResponse>('/recommendations', requestOptions);

  return result
    .map((response) => response.data)
    .mapErr((error): AssistantDomainError => {
      if (error.details?.errorCode === 'INSUFFICIENT_TOKENS') {
        return {
          type: 'InsufficientTokens',
          message: 'Brak tokenów lub subskrypcja nieaktywna.',
          details: error.details,
        };
      }

      switch (error.type) {
        case 'UnauthorizedError':
          return {
            type: 'Unauthorized',
            message: 'Zaloguj się, aby wygenerować rekomendacje',
            details: error.details,
          };
        case 'ForbiddenError':
          return {
            type: 'InsufficientTokens',
            message: 'Brak tokenów lub subskrypcja nieaktywna.',
            details: error.details,
          };
        case 'NotFoundError':
          return {
            type: 'NoProfile',
            message: 'Profil użytkownika nie został znaleziony.',
            details: error.details,
          };
        case 'BadGatewayError':
        case 'ServiceUnavailableError':
        case 'GatewayTimeoutError':
          return {
            type: 'AiServiceUnavailable',
            message: 'Błąd usługi AI, spróbuj ponownie później.',
            details: error.details,
          };
        default:
          return {
            type: 'GenericApiError',
            message: 'Błąd podczas generowania rekomendacji',
            details: error.details,
          };
      }
    });
}

export async function getDetailedJobMatchesService(
  requestOptions?: RequestInit
): Promise<Result<CareerPathMatchResult[], JobMatchDomainError>> {
  const result = await jobOffersApiClient.get<CareerPathMatchResult[]>(
    '/matching/my-recommendations/detailed',
    requestOptions
  );

  return result
    .map((response) => response.data)
    .mapErr((error): JobMatchDomainError => {
      switch (error.type) {
        case 'UnauthorizedError':
          return {
            type: 'Unauthorized',
            message: 'Zaloguj się, aby pobrać oferty',
            details: error.details,
          };
        case 'NotFoundError':
          return {
            type: 'NoRecommendation',
            message: 'Brak rekomendacji lub dopasowanych ofert',
            details: error.details,
          };
        default:
          return {
            type: 'GenericApiError',
            message: 'Błąd podczas pobierania ofert pracy',
            details: error.details,
          };
      }
    });
}
