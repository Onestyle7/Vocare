import { Result } from 'neverthrow';
import { RequestInit } from 'next/dist/server/web/spec-extension/request';

import { BaseAppError } from '@/lib/types/result';

import {
  billingApiClient,
  BillingType,
  CreateSubscriptionCommand,
  CreateSubscriptionResult,
  SubscriptionTokenStatusResult,
} from './api';

export type CheckoutError = BaseAppError<
  'AlreadySubscribedError' | 'PaymentInitError' | 'Unauthorized' | 'PaymentNotFound'
>;
export type SubscriptionStatusError = BaseAppError<'Unauthorized' | 'PaymentNotFound'>;

export async function getSubscriptionTokenStatusService(
  requestOptions: RequestInit
): Promise<Result<SubscriptionTokenStatusResult, SubscriptionStatusError>> {
  const result = await billingApiClient.get<SubscriptionTokenStatusResult>(
    '/access-status',
    requestOptions
  );

  return result
    .map((response) => response.data)
    .mapErr((error): SubscriptionStatusError => {
      switch (error.type) {
        case 'UnauthorizedError':
        case 'BadRequestError': {
          return {
            type: 'Unauthorized',
            message: 'Zaloguj się aby wyświetlić informacje o tokenach lub subskrybcji',
            details: error.details,
          };
        }
        case 'NotFoundError': {
          return {
            type: 'PaymentNotFound',
            message: 'Nie znaleziono informacji o płatności dla tego użytkownika',
            details: error.details,
          };
        }
        default: {
          return {
            type: 'GenericApiError',
            message: 'Wystąpił błąd podczas pobierania statusu tokenów / subskrybcji',
            details: error.details,
          };
        }
      }
    });
}

export async function createSubscriptionService(
  subscriptionType: BillingType,
  command: CreateSubscriptionCommand
): Promise<Result<CreateSubscriptionResult, CheckoutError>> {
  const endpoint =
    subscriptionType === 'subscription'
      ? '/create-subscription-checkout'
      : '/create-checkout-session';

  const result = await billingApiClient.post<CreateSubscriptionResult>(endpoint, command);

  return result
    .map((response) => response.data)
    .mapErr((error): CheckoutError => {
      switch (error.type) {
        case 'ConflictError':
          return {
            type: 'AlreadySubscribedError',
            message: 'Posiadasz już aktywną subskrybcje',
            details: error.details,
          };
        case 'BadRequestError': {
          return {
            type: 'PaymentInitError',
            message: 'Błąd podczas konfiguracji płatności. Sprawdź wybrane opcje.',
            details: error.details,
          };
        }
        case 'UnauthorizedError': {
          return {
            type: 'Unauthorized',
            message: 'Zaloguj się żeby dokonać płatności',
          };
        }
        default: {
          return {
            type: 'GenericApiError',
            message: 'Wystąpił błąd podczas inicjowania płatności. Spróbuj ponownie później',
            details: error.details,
          };
        }
      }
    });
}
