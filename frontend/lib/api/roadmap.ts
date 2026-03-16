import { api } from '@/lib/api';
import type {
  GenerateRoadmapPayload,
  RoadmapDetailsDto,
  RoadmapListItemDto,
  UpdateStepPositionsPayload,
} from '@/lib/types/roadmap';

type ReqOpts = { signal?: AbortSignal };

export const generateRoadmap = async (
  payload: GenerateRoadmapPayload,
  opts?: ReqOpts
): Promise<RoadmapDetailsDto> => {
  const { data } = await api.post('/api/Roadmap/generate', payload, { signal: opts?.signal });
  return data;
};

export const getUserRoadmaps = async (opts?: ReqOpts): Promise<RoadmapListItemDto[]> => {
  const { data } = await api.get('/api/Roadmap/user-roadmaps', { signal: opts?.signal });
  return data;
};

export const getRoadmapById = async (
  roadmapId: string,
  opts?: ReqOpts
): Promise<RoadmapDetailsDto> => {
  const { data } = await api.get(`/api/Roadmap/${roadmapId}`, { signal: opts?.signal });
  return data;
};

export const archiveRoadmap = async (roadmapId: string, opts?: ReqOpts): Promise<void> => {
  await api.delete(`/api/Roadmap/${roadmapId}`, { signal: opts?.signal });
};

export const updateRoadmapStepPositions = async (
  payload: UpdateStepPositionsPayload,
  opts?: ReqOpts
): Promise<void> => {
  await api.patch('/api/RoadmapSteps/positions', payload, { signal: opts?.signal });
};
