import 'server-only';

import { cookies } from 'next/headers';

import { CACHE_TAGS } from '@/lib/tags';
import { actionErr, actionOk } from '@/lib/types/result';
import { getUserFromCookie } from '@/lib/utils/get-user-from-cookie';

import { getUserAttributesService, getUserProfileSummaryService } from './services';

export async function getUserProfileSummaryQuery() {
  const userId = getUserFromCookie(await cookies());
  if (!userId) {
    return actionErr({
      type: 'Unauthorized',
      message: 'Sesja wygasła. Zaloguj się ponownie',
    } as const);
  }

  const result = await getUserProfileSummaryService({
    cache: 'force-cache',
    next: { tags: [CACHE_TAGS.profileStats(userId)], revalidate: 3600 },
  });
  return result.match(
    (response) => actionOk(response),
    (error) => actionErr(error)
  );
}

export async function getUserAttributesQuery() {
  const userId = getUserFromCookie(await cookies());
  if (!userId) {
    return actionErr({
      type: 'Unauthorized',
      message: 'Sesja wygasła. Zaloguj się ponownie',
    } as const);
  }

  const result = await getUserAttributesService({
    cache: 'force-cache',
    next: { tags: [CACHE_TAGS.profileAttributes(userId)], revalidate: 3600 },
  });
  return result.match(
    (response) => actionOk(response),
    (error) => actionErr(error)
  );
}
