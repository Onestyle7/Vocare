'use server';

import { revalidateTag } from 'next/cache';

import { CACHE_TAGS, invalidateUserTag } from '@/lib/tags';
import { actionErr, actionOk } from '@/lib/types/result';

import {
  GenerateRoadmapPayload,
  StepStatus,
  UpdateStepPositionsPayload,
  UpdateStepRequestDto,
} from './api';
import {
  archiveRoadmapService,
  deleteRoadmapPhaseService,
  deleteRoadmapStepService,
  generateRoadmapService,
  getUserRoadmapsService,
  updateRoadmapPhaseNameService,
  updateRoadmapStepPositionsService,
  updateRoadmapStepService,
  updateRoadmapStepStatusService,
} from './services';

export async function generateRoadmapCommand(payload: GenerateRoadmapPayload) {
  const result = await generateRoadmapService(payload);

  return result.match(
    async (response) => {
      revalidateTag(CACHE_TAGS.roadmap(response.id), { expire: 0 });
      await invalidateUserTag('userRoadmaps');
      await invalidateUserTag('subscriptionStatus');
      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}

export async function updateRoadmapStepStatusCommand(
  roadmapId: string,
  stepId: string,
  status: StepStatus
) {
  const result = await updateRoadmapStepStatusService(stepId, status);

  return result.match(
    async (response) => {
      revalidateTag(CACHE_TAGS.roadmap(roadmapId), { expire: 0 });
      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}

export async function updateRoadmapStepPositionsCommand(
  roadmapId: string,
  payload: UpdateStepPositionsPayload
) {
  const result = await updateRoadmapStepPositionsService(payload);

  return result.match(
    async (response) => {
      revalidateTag(CACHE_TAGS.roadmap(roadmapId), { expire: 0 });
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

export async function deleteRoadmapStepCommand(roadmapId: string, stepId: string) {
  const result = await deleteRoadmapStepService(stepId);

  return result.match(
    async (response) => {
      revalidateTag(CACHE_TAGS.roadmap(roadmapId), { expire: 0 });
      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}

export async function updateRoadmapPhaseNameCommand(
  roadmapId: string,
  phaseId: string,
  newName: string
) {
  const result = await updateRoadmapPhaseNameService(phaseId, newName);

  return result.match(
    async (response) => {
      revalidateTag(CACHE_TAGS.roadmap(roadmapId), { expire: 0 });
      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}

export async function deleteRoadmapPhaseCommand(roadmapId: string, phaseId: string) {
  const result = await deleteRoadmapPhaseService(phaseId);

  return result.match(
    async (response) => {
      revalidateTag(CACHE_TAGS.roadmap(roadmapId), { expire: 0 });
      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}

export async function updateRoadmapStepCommand(
  roadmapId: string,
  stepId: string,
  payload: UpdateStepRequestDto
) {
  const result = await updateRoadmapStepService(stepId, payload);

  return result.match(
    async (response) => {
      revalidateTag(CACHE_TAGS.roadmap(roadmapId), { expire: 0 });
      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}

export async function checkGeneratingRoadmapsCommand() {
  const result = await getUserRoadmapsService({ cache: 'no-store' });

  return result.match(
    async (roadmaps) => {
      const isGenerating = roadmaps.some((r) => r.status === 'Generating');
      if (!isGenerating) {
        roadmaps.forEach((r) => revalidateTag(CACHE_TAGS.roadmap(r.id), { expire: 0 }));
        await invalidateUserTag('userRoadmaps');
      }
      return actionOk(isGenerating);
    },
    (error) => actionErr(error)
  );
}
