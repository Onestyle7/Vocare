import 'server-only';

import { cookies } from 'next/headers';

import { CACHE_TAGS } from '@/lib/tags';
import { actionErr, actionOk } from '@/lib/types/result';
import { getUserFromCookie } from '@/lib/utils/get-user-from-cookie';

import { getRoadmapByIdService, getUserRoadmapsService } from './services';

export async function getUserRoadmapsQuery() {
  const userId = getUserFromCookie(await cookies());
  if (!userId) {
    return actionErr({
      type: 'Unauthorized',
      message: 'Sesja wygasła. Zaloguj się ponownie',
    } as const);
  }

  const result = await getUserRoadmapsService({
    cache: 'no-store',
  });

  return result.match(
    (response) => actionOk(response),
    async (error) => {
      switch (error.type) {
        case 'Unauthorized':
        case 'NotFound':
        case 'InvalidOperation':
        case 'GenericApiError':
          return actionErr(error);
        default:
          throw new Error(`ERROR: ${error.type satisfies never}`);
      }
    }
  );
}

export async function getRoadmapByIdQuery(roadmapId: string) {
  const userId = getUserFromCookie(await cookies());
  if (!userId) {
    return actionErr({
      type: 'Unauthorized',
      message: 'Sesja wygasła. Zaloguj się ponownie',
    } as const);
  }

  const result = await getRoadmapByIdService(roadmapId, {
    cache: 'force-cache',
    next: { tags: [CACHE_TAGS.roadmap(roadmapId)], revalidate: 3600 },
  });

  return result.match(
    (response) => actionOk(response),
    async (error) => {
      switch (error.type) {
        case 'Unauthorized':
        case 'NotFound':
        case 'InvalidOperation':
        case 'GenericApiError':
          return actionErr(error);
        default:
          throw new Error(`ERROR: ${error.type satisfies never}`);
      }
    }
  );
}
