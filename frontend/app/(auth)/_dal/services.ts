'use server';

import { Result } from 'neverthrow';

import { authApiClient, OAuthSignInResult, RegisterCommand, SignInCommand } from './api';

export type AuthDomainError =
  | { type: 'OAuthError'; message: string; details?: Record<string, unknown> }
  | { type: 'InvalidCredentials'; message: string; details?: Record<string, unknown> }
  | { type: 'GenericApiError'; message: string; details?: Record<string, unknown> };

export type RegisterDomainError = {
  type: 'GenericApiError';
  message: string;
  details?: Record<string, unknown>;
};

export async function verifyOauthTokenService(
  endpoint: string,
  providerToken: string
): Promise<Result<OAuthSignInResult, AuthDomainError>> {
  const result = await authApiClient.post<OAuthSignInResult>(endpoint, {
    AccessToken: providerToken,
  });

  return result
    .map((response) => response.data)
    .mapErr((authError): AuthDomainError => {
      switch (authError.type) {
        case 'BadRequestError': {
          return {
            type: 'OAuthError',
            message: 'Problem podczas logowania przy pomocy zewnętrznego providera',
            details: authError.details,
          };
        }
        default: {
          return {
            type: 'GenericApiError',
            message: 'Wystąpił nieoczekiwany błąd podczas logowania',
            details: authError.details,
          };
        }
      }
    });
}

export async function signInService(
  command: SignInCommand
): Promise<Result<OAuthSignInResult, AuthDomainError>> {
  const result = await authApiClient.post<OAuthSignInResult>('/login', command);

  return result
    .map((response) => response.data)
    .mapErr((authError) => {
      switch (authError.type) {
        case 'BadRequestError': {
          return {
            type: 'InvalidCredentials',
            message: 'Nieprawidłowe dane logowania',
            details: authError.details,
          };
        }
        default: {
          return {
            type: 'GenericApiError',
            message: 'Wystąpił nieoczekiwany błąd podczas logowania',
            details: authError.details,
          };
        }
      }
    });
}

export async function registerService(
  command: RegisterCommand
): Promise<Result<OAuthSignInResult, RegisterDomainError>> {
  const result = await authApiClient.post<OAuthSignInResult>('/register', command);

  return result
    .map((response) => response.data)
    .mapErr((authError) => {
      switch (authError.type) {
        default: {
          return {
            type: 'GenericApiError',
            message: 'Wystąpił nieoczekiwany błąd podczas rejestracji',
            details: authError.details,
          };
        }
      }
    });
}

export async function logoutService(): Promise<Result<OAuthSignInResult, AuthDomainError>> {
  const result = await authApiClient.post<OAuthSignInResult>('/logout');

  return result
    .map((response) => response.data)
    .mapErr((authError): AuthDomainError => {
      switch (authError.type) {
        default: {
          return {
            type: 'GenericApiError',
            message: 'Wystąpił nieoaczekiwany błąd podczas wylogowania',
          };
        }
      }
    });
}
