import { cookies } from 'next/headers';
import { cache } from 'react';

import { CACHE_TAGS } from '@/lib/tags';
import { actionErr, actionOk } from '@/lib/types/result';
import { getUserFromCookie } from '@/lib/utils/get-user-from-cookie';

import { getCvDetailsService, getCvLimitsService, getUserCvsService } from './services';

export const getUserCvsQuery = cache(async () => {
  const userId = getUserFromCookie(await cookies());
  if (!userId) {
    return actionErr({
      type: 'Unauthorized',
      message: 'Sesja wygasła. Zaloguj się ponownie',
    } as const);
  }

  const result = await getUserCvsService({
    next: { tags: [CACHE_TAGS.userCvs(userId)] },
  });

  return result.match(
    (response) => actionOk(response),
    (error) => actionErr(error)
  );
});

export const getCvLimitsQuery = cache(async () => {
  const userId = getUserFromCookie(await cookies());
  if (!userId) {
    return actionErr({
      type: 'Unauthorized',
      message: 'Sesja wygasła. Zaloguj się ponownie',
    } as const);
  }

  const result = await getCvLimitsService({
    next: { tags: [CACHE_TAGS.cvLimits(userId)] },
  });

  return result.match(
    (response) => actionOk(response),
    (error) => actionErr(error)
  );
});

export const getCvDetailsQuery = cache(async (id: string) => {
  const userId = getUserFromCookie(await cookies());
  if (!userId) {
    return actionErr({
      type: 'Unauthorized',
      message: 'Sesja wygasła. Zaloguj się ponownie',
    } as const);
  }

  const result = await getCvDetailsService(id, {
    next: { tags: [CACHE_TAGS.cvDetails(id), CACHE_TAGS.userCvs(userId)] },
  });

  return result.match(
    (response) => actionOk(response),
    (error) => actionErr(error)
  );
});
