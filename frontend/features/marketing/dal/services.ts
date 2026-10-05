import { Result } from 'neverthrow';
import { RequestInit } from 'next/dist/server/web/spec-extension/request';

import { BaseAppError } from '@/lib/types/result';

import { GiveMarketingConsentResponse, marketingApiClient, MarketingConsentResponse } from './api';

export type MarketingDomainError = BaseAppError<
  'Unauthorized' | 'AlreadyActive' | 'NoActiveConsent'
>;

export async function getMarketingConsentService(
  requestOptions?: RequestInit
): Promise<Result<MarketingConsentResponse, MarketingDomainError>> {
  const result = await marketingApiClient.get<MarketingConsentResponse>('/consent', requestOptions);

  return result
    .map((response) => response.data)
    .mapErr((error): MarketingDomainError => {
      switch (error.type) {
        case 'UnauthorizedError': {
          return {
            type: 'Unauthorized',
            message: 'Zaloguj się, aby pobrać zgody marketingowe',
            details: error.details,
          };
        }
        default: {
          return {
            type: 'GenericApiError',
            message: 'Błąd pobierania zgód marketingowych',
            details: error.details,
          };
        }
      }
    });
}

export async function giveMarketingConsentService(): Promise<
  Result<GiveMarketingConsentResponse, MarketingDomainError>
> {
  const result = await marketingApiClient.post<GiveMarketingConsentResponse>('/consent');

  return result
    .map((response) => response.data)
    .mapErr((error): MarketingDomainError => {
      switch (error.type) {
        case 'UnauthorizedError': {
          return {
            type: 'Unauthorized',
            message: 'Zaloguj się, aby udzielić zgody',
            details: error.details,
          };
        }
        case 'ConflictError': {
          return {
            type: 'AlreadyActive',
            message: 'Zgoda marketingowa jest już aktywna',
            details: error.details,
          };
        }
        default: {
          return {
            type: 'GenericApiError',
            message: 'Błąd podczas udzielania zgody',
            details: error.details,
          };
        }
      }
    });
}

export async function withdrawMarketingConsentService(): Promise<
  Result<{ message: string }, MarketingDomainError>
> {
  const result = await marketingApiClient.delete<{ message: string }>('/consent');

  return result
    .map((response) => response.data)
    .mapErr((error): MarketingDomainError => {
      switch (error.type) {
        case 'UnauthorizedError': {
          return {
            type: 'Unauthorized',
            message: 'Zaloguj się, aby wycofać zgodę',
            details: error.details,
          };
        }
        case 'UnprocessableEntityError': {
          return {
            type: 'NoActiveConsent',
            message: 'Brak aktywnej zgody do wycofania',
            details: error.details,
          };
        }
        default: {
          return {
            type: 'GenericApiError',
            message: 'Błąd podczas wycofywania zgody',
            details: error.details,
          };
        }
      }
    });
}
