import { Result } from 'neverthrow';

import { billingApiClient, BillingType } from '@/app/(billing)/_dal/api';
import { BaseAppError } from '@/lib/types/result';

import { CreateSubscriptionCommand, CreateSubscriptionResult } from './api';

export type BillingDomainError = BaseAppError<
  'AlreadySubscribedError' | 'PaymentInitError' | 'Unauthorized'
>;

export async function createSubscriptionService(
  subscriptionType: BillingType,
  command: CreateSubscriptionCommand
): Promise<Result<CreateSubscriptionResult, BillingDomainError>> {
  const endpoint =
    subscriptionType === 'subscription'
      ? '/create-subscription-checkout'
      : '/create-checkout-session';

  const result = await billingApiClient.post<CreateSubscriptionResult>(endpoint, command);

  return result
    .map((response) => response.data)
    .mapErr((error): BillingDomainError => {
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
