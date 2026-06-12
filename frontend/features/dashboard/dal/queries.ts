import 'server-only';

import { cookies } from 'next/headers';

import { actionErr, actionOk } from '@/lib/types/result';
import { getUserFromCookie } from '@/lib/utils/get-user-from-cookie';

import { getUserProfileSummaryService } from './services';

export async function getUserProfileSummaryQuery() {
  const userId = getUserFromCookie(await cookies());
  if (!userId) {
    return actionErr({
      type: 'Unauthorized',
      message: 'Sesja wygasła. Zaloguj się ponownie',
    } as const);
  }

  const result = await getUserProfileSummaryService();
  return result.match(
    (response) => actionOk(response),
    (error) => actionErr(error)
  );
}
