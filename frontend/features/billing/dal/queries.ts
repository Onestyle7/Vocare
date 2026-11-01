import 'server-only';

import { cookies } from 'next/headers';

import { CACHE_TAGS } from '@/lib/tags';
import { actionErr, actionOk } from '@/lib/types/result';
import { getUserFromCookie } from '@/lib/utils/get-user-from-cookie';

import {
  getPaymentHistoryService,
  getSubscriptionDetailsService,
  getSubscriptionTokenStatusService,
} from './services';

export async function getTokenSubscriptionStatus() {
  const userId = getUserFromCookie(await cookies());
  if (!userId) {
    return actionErr({
      type: 'Unauthorized',
      message: 'Sesja wygasła. Zaloguj się ponownie',
    } as const);
  }

  const result = await getSubscriptionTokenStatusService({
    cache: 'force-cache',
    next: { tags: [CACHE_TAGS.subscriptionStatus(userId)], revalidate: 3600 },
  });

  return result.match(
    (response) => actionOk(response),
    async (error) => {
      switch (error.type) {
        case 'PaymentNotFound':
        case 'Unauthorized': {
          return actionErr(error);
        }
        case 'GenericApiError': {
          return actionErr(error);
        }
        default: {
          throw new Error(`ERROR: ${error.type satisfies never}`);
        }
      }
    }
  );
}

export async function getSubscriptionDetailsQuery() {
  // Bez cache – anulowanie triala w portalu Stripe zmienia stan poza naszymi Server Actions
  const result = await getSubscriptionDetailsService({ cache: 'no-store' });

  return result.match(
    (response) => actionOk(response),
    (error) => actionErr(error)
  );
}

export async function getPaymentHistoryQuery(limit: number = 50) {
  const userId = getUserFromCookie(await cookies());
  if (!userId) {
    return actionErr({
      type: 'Unauthorized',
      message: 'Sesja wygasła. Zaloguj się ponownie',
    } as const);
  }

  const result = await getPaymentHistoryService(limit, {
    cache: 'force-cache',
    next: { tags: [CACHE_TAGS.subscriptionStatus(userId)], revalidate: 3600 },
  });

  return result.match(
    (response) => actionOk(response),
    async (error) => {
      switch (error.type) {
        case 'Unauthorized':
        case 'InvalidLimit':
        case 'GenericApiError': {
          return actionErr(error);
        }
        default: {
          throw new Error(`ERROR: ${error.type satisfies never}`);
        }
      }
    }
  );
}
