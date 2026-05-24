'use server';

import { invalidateUserTag } from '@/lib/tags';
import { actionErr, actionOk } from '@/lib/types/result';
import { GenerateRoadmapPayload } from '@/lib/types/roadmap';

import { archiveRoadmapService, generateRoadmapService } from './services';

export async function generateRoadmapCommand(payload: GenerateRoadmapPayload) {
  const result = await generateRoadmapService(payload);

  return result.match(
    async (response) => {
      await invalidateUserTag('userRoadmaps');
      await invalidateUserTag('subscriptionStatus');
      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}

export async function archiveRoadmapCommand(roadmapId: string) {
  const result = await archiveRoadmapService(roadmapId);

  return result.match(
    async (response) => {
      await invalidateUserTag('userRoadmaps');
      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}
