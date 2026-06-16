import { Result } from 'neverthrow';

import { BaseAppError } from '@/lib/types/result';

import { dashboardApiClient, UserAttributesResult, UserProfileSummaryResult } from './api';

export type DashboardDomainError = BaseAppError<'Unauthorized' | 'EmptyProfile'>;

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
        case 'NotFoundError': {
          console.log('DETAILS', dashboardErr.details?.errorCode);
          if (dashboardErr.details?.errorCode === 'USER_PROFILE_NOT_FOUND') {
            return {
              type: 'EmptyProfile',
              message: 'Uzupełnij profil aby wyświetlić statystyki',
              details: dashboardErr.details,
            };
          }
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

export async function getUserAttributesService(
  requestOptions?: RequestInit
): Promise<Result<UserAttributesResult, DashboardDomainError>> {
  const result = await dashboardApiClient.get<UserAttributesResult>(
    'profile-attributes',
    requestOptions
  );

  return result
    .map((response) => response.data)
    .mapErr((dashboardErr): DashboardDomainError => {
      switch (dashboardErr.type) {
        case 'UnauthorizedError': {
          return {
            type: 'Unauthorized',
            message: 'Zaloguj się aby wyświetlić atrybuty użytkownika',
            details: dashboardErr.details,
          };
        }
        case 'NotFoundError': {
          if (dashboardErr.details?.errorCode === 'USER_PROFILE_NOT_FOUND') {
            return {
              type: 'EmptyProfile',
              message: 'Uzupełnij profil aby wyświetlić statystyki',
              details: dashboardErr.details,
            };
          }
        }
        default: {
          return {
            type: 'GenericApiError',
            message: 'Nie udało się pobrać oceny atrybutów użytkownika',
            details: dashboardErr.details,
          };
        }
      }
    });
}
