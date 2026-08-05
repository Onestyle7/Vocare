import { Result } from 'neverthrow';
import { RequestInit } from 'next/dist/server/web/spec-extension/request';

import { ApiError } from '@/lib/api/api-client';
import { BaseAppError } from '@/lib/types/result';

import {
  GenerateRoadmapAcceptedDto,
  GenerateRoadmapPayload,
  roadmapApiClient,
  RoadmapDetailsDto,
  RoadmapListItemDto,
  RoadmapStepDto,
  StepStatus,
  UpdateStepPositionsPayload,
  UpdateStepRequestDto,
} from './api';

export type RoadmapDomainError = BaseAppError<
  | 'Unauthorized'
  | 'NotFound'
  | 'InvalidOperation'
  | 'GenericApiError'
  | 'DuplicateRoadmap'
  | 'RoadmapLimitReached'
  | 'InsufficientTokens'
>;

const mapRoadmapError = (error: ApiError): RoadmapDomainError => {
  if (error.details?.errorCode === 'INSUFFICIENT_TOKENS') {
    return {
      type: 'InsufficientTokens',
      message: 'Masz za mało tokenów, aby wygenerować roadmapę.',
      details: error.details,
    };
  }

  if (error.details?.errorCode === 'ROADMAP_LIMIT_REACHED') {
    return {
      type: 'RoadmapLimitReached',
      message: 'Osiągnięto limit roadmap dla Twojego planu.',
      details: error.details,
    };
  }

  if (error.details?.errorCode === 'DUPLICATE_ROADMAP') {
    return {
      type: 'DuplicateRoadmap',
      message: 'Posiadasz już roadmapę dla tej ścieżki zawodowej.',
      details: error.details,
    };
  }

  if (error.type === 'UnauthorizedError') {
    return {
      type: 'Unauthorized',
      message: 'Zaloguj się, aby wyświetlić roadmapy.',
      details: error.details,
    };
  }

  if (error.type === 'ConflictError') {
    return {
      type: 'InvalidOperation',
      message: 'Stan roadmapy nie pozwala wykonać tej operacji.',
      details: error.details,
    };
  }

  if (error.type === 'NotFoundError') {
    return {
      type: 'NotFound',
      message: 'Nie znaleziono roadmapy.',
      details: error.details,
    };
  }

  if (error.type === 'BadRequestError') {
    return {
      type: 'InvalidOperation',
      message: 'Nieprawidłowa operacja na roadmapie.',
      details: error.details,
    };
  }

  return {
    type: 'GenericApiError',
    message: 'Wystąpił nieoczekiwany błąd serwera.',
    details: error.details,
  };
};

export async function getUserRoadmapsService(
  requestOptions?: RequestInit
): Promise<Result<RoadmapListItemDto[], RoadmapDomainError>> {
  const result = await roadmapApiClient.get<RoadmapListItemDto[]>('/user-roadmaps', requestOptions);
  return result.map((response) => response.data).mapErr(mapRoadmapError);
}

export async function generateRoadmapService(
  payload: GenerateRoadmapPayload,
  requestOptions?: RequestInit
): Promise<Result<GenerateRoadmapAcceptedDto, RoadmapDomainError>> {
  const result = await roadmapApiClient.post<GenerateRoadmapAcceptedDto, GenerateRoadmapPayload>(
    '/generate',
    payload,
    requestOptions
  );
  return result.map((response) => response.data).mapErr(mapRoadmapError);
}

export async function archiveRoadmapService(
  roadmapId: string,
  requestOptions?: RequestInit
): Promise<Result<void, RoadmapDomainError>> {
  const result = await roadmapApiClient.delete<void>(`/${roadmapId}`, requestOptions);
  return result.map((response) => response.data).mapErr(mapRoadmapError);
}

export async function getRoadmapByIdService(
  roadmapId: string,
  requestOptions?: RequestInit
): Promise<Result<RoadmapDetailsDto, RoadmapDomainError>> {
  const result = await roadmapApiClient.get<RoadmapDetailsDto>(`/${roadmapId}`, requestOptions);
  return result.map((response) => response.data).mapErr(mapRoadmapError);
}

export async function updateRoadmapStepPositionsService(
  payload: UpdateStepPositionsPayload,
  requestOptions?: RequestInit
): Promise<Result<void, RoadmapDomainError>> {
  const result = await roadmapApiClient.patch<void>(
    '../RoadmapSteps/positions',
    payload,
    requestOptions
  );
  return result.map((response) => response.data).mapErr(mapRoadmapError);
}

export async function updateRoadmapStepStatusService(
  stepId: string,
  status: StepStatus,
  requestOptions?: RequestInit
): Promise<Result<RoadmapStepDto, RoadmapDomainError>> {
  const result = await roadmapApiClient.patch<RoadmapStepDto, StepStatus>(
    `../RoadmapSteps/${stepId}/status`,
    status,
    requestOptions
  );
  return result.map((response) => response.data).mapErr(mapRoadmapError);
}

export async function deleteRoadmapStepService(
  stepId: string,
  requestOptions?: RequestInit
): Promise<Result<void, RoadmapDomainError>> {
  const result = await roadmapApiClient.delete<void>(`../RoadmapSteps/${stepId}`, requestOptions);
  return result.map((response) => response.data).mapErr(mapRoadmapError);
}

export async function updateRoadmapPhaseNameService(
  phaseId: string,
  newName: string,
  requestOptions?: RequestInit
): Promise<Result<void, RoadmapDomainError>> {
  const result = await roadmapApiClient.patch<void, string>(
    `../RoadmapPhases/${phaseId}/name`,
    `"${newName}"`,
    {
      ...requestOptions,
      headers: { 'Content-Type': 'application/json', ...requestOptions?.headers },
    }
  );
  return result.map((response) => response.data).mapErr(mapRoadmapError);
}

export async function deleteRoadmapPhaseService(
  phaseId: string,
  requestOptions?: RequestInit
): Promise<Result<void, RoadmapDomainError>> {
  const result = await roadmapApiClient.delete<void>(`../RoadmapPhases/${phaseId}`, requestOptions);
  return result.map((response) => response.data).mapErr(mapRoadmapError);
}

export async function updateRoadmapStepService(
  stepId: string,
  payload: UpdateStepRequestDto,
  requestOptions?: RequestInit
): Promise<Result<RoadmapStepDto, RoadmapDomainError>> {
  const result = await roadmapApiClient.put<RoadmapStepDto, UpdateStepRequestDto>(
    `../RoadmapSteps/${stepId}`,
    payload,
    requestOptions
  );
  return result.map((response) => response.data).mapErr(mapRoadmapError);
}
