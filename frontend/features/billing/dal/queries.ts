import 'server-only';

import { cookies } from 'next/headers';

import { getUserFromCookie } from '@/features/auth/utils/get-user-from-cookie';
import { CACHE_TAGS } from '@/lib/tags';
import { actionErr, actionOk } from '@/lib/types/result';

import { getSubscriptionTokenStatusService } from './services';

export async function getTokenSubscriptionStatus() {
  const userId = getUserFromCookie(await cookies());
  if (!userId) {
    return actionErr({ type: 'Unauthorized', message: 'Sesja wygasła. Zaloguj się ponownie' });
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
