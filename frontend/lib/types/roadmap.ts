export type RoadmapStatus = 'Generating' | 'Draft' | 'Active' | 'Completed' | 'Archived';
export type StepStatus = 'NotStarted' | 'InProgress' | 'Completed';
export type StepType = 'Required' | 'Optional';

export interface RoadmapPhaseStepMeta {
  id: string;
  title: string;
  stepType: StepType;
  status: StepStatus;
}

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
  failureReason: string;
  generationStatus: string;
}

export interface RoadmapStepDto {
  id: string;
  title: string;
  subTitle: string | null;
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
  startMonth: number;
  endMonth: number;
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

export interface UpdateStepRequestDto {
  title?: string;
  subtitle?: string;
  description?: string;
  topics?: string[];
  stepType?: StepType;
}

export interface AddStepRequestDto {
  phaseId: string;
  parentStepId?: string;
  title: string;
  subtitle: string;
  description?: string;
  topics?: string[];
  stepType: StepType;
}
