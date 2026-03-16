export type RoadmapStatus = 'Draft' | 'Active' | 'Completed' | 'Archived';
export type StepStatus = 'NotStarted' | 'InProgress' | 'Completed';
export type StepType = 'Required' | 'Optional';

export interface GenerateRoadmapPayload {
  careerPathId: string;
  timeHorizonMonths: number;
}

export interface StepPositionUpdateDto {
  stepId: string;
  x: number;
  y: number;
}

export interface UpdateStepPositionsPayload {
  positions: StepPositionUpdateDto[];
}

export interface RoadmapListItemDto {
  id: string;
  title: string;
  timeHorizonMonths: number;
  status: RoadmapStatus;
  createdAt: string;
  careerPathName: string;
  progress: number;
}

export interface RoadmapStepDto {
  id: string;
  title: string;
  description: string | null;
  topics: string[];
  stepType: StepType;
  status: StepStatus;
  orderIndex: number;
  parentStepId: string | null;
  positionX: number | null;
  positionY: number | null;
}

export interface RoadmapPhaseDto {
  id: string;
  title: string;
  orderIndex: number;
  steps: RoadmapStepDto[];
}

export interface RoadmapDetailsDto {
  id: string;
  title: string;
  timeHorizonMonths: number;
  status: RoadmapStatus;
  createdAt: string;
  updatedAt: string;
  careerPathName: string;
  progress: number;
  phases: RoadmapPhaseDto[];
}
