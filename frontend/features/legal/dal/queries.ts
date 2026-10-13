import 'server-only';

import { cookies } from 'next/headers';

import { CACHE_TAGS } from '@/lib/tags';
import { actionErr, actionOk } from '@/lib/types/result';
import { getUserFromCookie } from '@/lib/utils/get-user-from-cookie';

import { getLegalConsentStatusService, getPendingLegalDocumentsService } from './services';

export async function getPendingLegalDocuments() {
  const userId = getUserFromCookie(await cookies());
  if (!userId) {
    return actionErr({
      type: 'Unauthorized',
      message: 'Sesja wygasła. Zaloguj się ponownie',
    } as const);
  }

  const result = await getPendingLegalDocumentsService({
    cache: 'no-store',
    next: { tags: [CACHE_TAGS.legalConsents(userId)] },
  });

  return result.match(
    (response) => actionOk(response),
    async (error) => {
      switch (error.type) {
        case 'Unauthorized':
        case 'GenericApiError': {
          return actionErr(error);
        }
        default: {
          return actionErr(error);
        }
      }
    }
  );
}

export async function getLegalConsentStatus() {
  const userId = getUserFromCookie(await cookies());
  if (!userId) {
    return actionErr({
      type: 'Unauthorized',
      message: 'Sesja wygasła. Zaloguj się ponownie',
    } as const);
  }

  const result = await getLegalConsentStatusService({
    cache: 'no-store',
    next: { tags: [CACHE_TAGS.legalConsents(userId)] },
  });

  return result.match(
    (response) => actionOk(response),
    async (error) => {
      switch (error.type) {
        case 'Unauthorized':
        case 'GenericApiError': {
          return actionErr(error);
        }
        default: {
          return actionErr(error);
        }
      }
    }
  );
}
