import { Result } from 'neverthrow';

import { BaseAppError } from '@/lib/types/result';

import { dashboardApiClient, UserProfileSummaryResult } from './api';

export type DashboardDomainError = BaseAppError<'Unauthorized'>;

export async function getUserProfileSummaryService(
  requestOptions?: RequestInit
): Promise<Result<UserProfileSummaryResult, DashboardDomainError>> {
  const result = await dashboardApiClient.get<UserProfileSummaryResult>('summary', requestOptions);

  return result
    .map((response) => response.data)
    .mapErr((dashboardErr): DashboardDomainError => {
      switch (dashboardErr.type) {
        case 'UnauthorizedError': {
          return {
            type: 'Unauthorized',
            message: 'Zaloguj się aby wyświetlić statystyki profilu',
            details: dashboardErr.details,
          };
        }
        default: {
          return {
            type: 'GenericApiError',
            message: 'Nie udało się pobrać statystyk profilu',
            details: dashboardErr.details,
          };
        }
      }
    });
}
