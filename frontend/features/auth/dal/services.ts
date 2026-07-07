'use server';

import { err, ok, Result } from 'neverthrow';

import { BaseAppError } from '@/lib/types/result';

import {
  authApiClient,
  ForgotPasswordCommand,
  RegisterCommand,
  RegisterResult,
  ResetPasswordCommand,
  SignInCommand,
  SignInResult,
  ValidateResetPasswordCommand,
  ValidateResetPasswordResult,
} from './api';

export type AuthDomainError = BaseAppError<'OAuthError' | 'InvalidCredentials'>;
export type RegisterDomainError = BaseAppError<'EmailAlreadyTaken'>;
export type ForgotPasswordDomainError = BaseAppError<'InvalidEmailError'>;
export type ResetPasswordDomainError = BaseAppError<'InvalidResetToken' | 'ExpiredResetToken'>;

export async function verifyOauthTokenService(
  endpoint: string,
  providerToken: string
): Promise<Result<SignInResult, AuthDomainError>> {
  const result = await authApiClient.post<SignInResult>(endpoint, {
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
): Promise<Result<SignInResult, AuthDomainError>> {
  const result = await authApiClient.post<SignInResult>('/login', command);

  return result
    .map((response) => response.data)
    .mapErr((authError): AuthDomainError => {
      switch (authError.type) {
        case 'UnauthorizedError': {
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
): Promise<Result<RegisterResult, RegisterDomainError>> {
  const result = await authApiClient.post<RegisterResult>('/register', command);

  return result
    .map((response) => response.data)
    .mapErr((authError): RegisterDomainError => {
      switch (authError.type) {
        case 'ConflictError': {
          return {
            type: 'EmailAlreadyTaken',
            message: 'Użytkownik z takim adresem e-mail już istnieje',
            details: authError.details,
          };
        }
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

export async function logoutService(): Promise<Result<SignInResult, AuthDomainError>> {
  const result = await authApiClient.post<SignInResult>('/logout');

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

export async function forgotPasswordService(
  command: ForgotPasswordCommand
): Promise<Result<void, ForgotPasswordDomainError>> {
  const result = await authApiClient.post('/forgot-password', command);

  return result
    .map(() => undefined)
    .mapErr((authError): ForgotPasswordDomainError => {
      switch (authError.type) {
        case 'BadRequestError': {
          return {
            type: 'InvalidEmailError',
            message: 'Wprowadzono niepoprawny adres email',
            details: authError.details,
          };
        }
        default: {
          return {
            type: 'GenericApiError',
            message: 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.',
            details: authError.details,
          };
        }
      }
    });
}

export async function resetPasswordService(
  command: ResetPasswordCommand
): Promise<Result<void, ResetPasswordDomainError>> {
  const result = await authApiClient.post('/reset-password', command);

  return result
    .map(() => undefined)
    .mapErr((error): ResetPasswordDomainError => {
      switch (error.type) {
        case 'BadRequestError': {
          return {
            type: 'InvalidResetToken',
            message: 'Hasło nie spełnia wymagań lub token wygasł',
            details: error.details,
          };
        }
        default: {
          return {
            type: 'GenericApiError',
            message: 'Nie udało się zmienić hasła',
            details: error.details,
          };
        }
      }
    });
}

export async function validateResetPasswordService({
  token,
  email,
}: ValidateResetPasswordCommand): Promise<
  Result<ValidateResetPasswordResult, ResetPasswordDomainError>
> {
  const queryParams = new URLSearchParams({
    token,
    email,
  });
  const result = await authApiClient.get<ValidateResetPasswordResult>(
    `/validate-reset-token?${queryParams}`
  );

  return result
    .map((response) => response.data)
    .mapErr((error): ResetPasswordDomainError => {
      switch (error.type) {
        case 'BadRequestError': {
          return {
            type: 'InvalidResetToken',
            message: 'Token zmiany jest nieprawidłowy',
          };
        }
        default: {
          return {
            type: 'GenericApiError',
            message: 'Nie udało się zweryfikować tokenu zmiany hasła',
          };
        }
      }
    })
    .andThen((data): Result<ValidateResetPasswordResult, ResetPasswordDomainError> => {
      if (!data.isValid) {
        return err({
          type: 'ExpiredResetToken',
          message: 'Token zmiany hasła wygasł',
        });
      }

      return ok(data);
    });
}
