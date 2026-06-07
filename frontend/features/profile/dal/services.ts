import { Result } from 'neverthrow';
import { RequestInit } from 'next/dist/server/web/spec-extension/request';

import { UserProfile } from '@/lib/types/profile';
import { BaseAppError } from '@/lib/types/result';

import { CreateProfileCommand, profileApiClient, UpdateProfileCommand } from './api';

export type ProfileDomainError = BaseAppError<
  'Unauthorized' | 'ProfileNotFound' | 'ValidationFailed' | 'CvImportFailed'
>;

export async function getUserProfileService(
  requestOptions?: RequestInit
): Promise<Result<UserProfile, ProfileDomainError>> {
  const result = await profileApiClient.get<UserProfile>('/GetCurrentUserProfile', requestOptions);

  return result
    .map((response) => response.data)
    .mapErr((error): ProfileDomainError => {
      switch (error.type) {
        case 'UnauthorizedError': {
          return {
            type: 'Unauthorized',
            message: 'Zaloguj się, aby wyświetlić profil',
            details: error.details,
          };
        }
        case 'NotFoundError': {
          return {
            type: 'ProfileNotFound',
            message: 'Profil użytkownika nie został znaleziony',
            details: error.details,
          };
        }
        default: {
          return {
            type: 'GenericApiError',
            message: 'Błąd pobierania profilu',
            details: error.details,
          };
        }
      }
    });
}

export async function createUserProfileService(
  command: CreateProfileCommand
): Promise<Result<UserProfile, ProfileDomainError>> {
  const result = await profileApiClient.post<UserProfile>('/CreateCurrentUserProfile', command);

  return result
    .map((response) => response.data)
    .mapErr((error): ProfileDomainError => {
      switch (error.type) {
        case 'UnauthorizedError': {
          return {
            type: 'Unauthorized',
            message: 'Zaloguj się, aby utworzyć profil',
            details: error.details,
          };
        }
        default: {
          return {
            type: 'GenericApiError',
            message: 'Błąd tworzenia profilu',
            details: error.details,
          };
        }
      }
    });
}

export async function updateUserProfileService(
  command: UpdateProfileCommand
): Promise<Result<{ message: string }, ProfileDomainError>> {
  const result = await profileApiClient.put<{ message: string }>(
    '/UpdateCurrentUserProfile',
    command
  );

  return result
    .map((response) => response.data)
    .mapErr((error): ProfileDomainError => {
      switch (error.type) {
        case 'UnauthorizedError': {
          return {
            type: 'Unauthorized',
            message: 'Zaloguj się, aby zaktualizować profil',
            details: error.details,
          };
        }
        case 'NotFoundError': {
          return {
            type: 'ProfileNotFound',
            message: 'Profil użytkownika nie został znaleziony',
            details: error.details,
          };
        }
        default: {
          return {
            type: 'GenericApiError',
            message: 'Błąd aktualizacji profilu',
            details: error.details,
          };
        }
      }
    });
}

export async function deleteUserProfileService(): Promise<
  Result<{ message: string }, ProfileDomainError>
> {
  const result = await profileApiClient.delete<{ message: string }>('/DeleteCurrentUserProfile');

  return result
    .map((response) => response.data)
    .mapErr((error): ProfileDomainError => {
      switch (error.type) {
        case 'UnauthorizedError': {
          return {
            type: 'Unauthorized',
            message: 'Zaloguj się, aby usunąć profil',
            details: error.details,
          };
        }
        case 'NotFoundError': {
          return {
            type: 'ProfileNotFound',
            message: 'Profil użytkownika nie został znaleziony',
            details: error.details,
          };
        }
        default: {
          return {
            type: 'GenericApiError',
            message: 'Błąd usuwania profilu',
            details: error.details,
          };
        }
      }
    });
}

export async function importProfileFromCvService(
  formData: FormData
): Promise<Result<UserProfile, ProfileDomainError>> {
  const result = await profileApiClient.post<UserProfile>('/import-cv', formData);

  return result
    .map((response) => response.data)
    .mapErr((error): ProfileDomainError => {
      switch (error.type) {
        case 'UnauthorizedError': {
          return {
            type: 'Unauthorized',
            message: 'Zaloguj się, aby zaimportować CV',
            details: error.details,
          };
        }
        case 'BadRequestError': {
          return {
            type: 'CvImportFailed',
            message: 'Wystąpił błąd parsowania pliku CV',
            details: error.details,
          };
        }
        default: {
          return {
            type: 'GenericApiError',
            message: 'Nieoczekiwany błąd podczas importu CV',
            details: error.details,
          };
        }
      }
    });
}
