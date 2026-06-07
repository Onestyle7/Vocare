import { Result } from 'neverthrow';
import { RequestInit } from 'next/dist/server/web/spec-extension/request';

import { ApiError } from '@/lib/api/api-client';
import { BaseAppError } from '@/lib/types/result';

import {
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
  'Unauthorized' | 'NotFound' | 'InvalidOperation' | 'GenericApiError'
>;

const mapRoadmapError = (error: ApiError): RoadmapDomainError => {
  const detail =
    typeof error.details?.Error === 'string'
      ? error.details.Error
      : typeof error.details?.error === 'string'
        ? error.details.error
        : typeof error.details?.detail === 'string'
          ? error.details.detail
          : '';

  if (error.type === 'UnauthorizedError') {
    return {
      type: 'Unauthorized',
      message: 'Zaloguj się, aby wyświetlić roadmapy.',
      details: error.details,
    };
  }

  if (error.type === 'NotFoundError') {
    return {
      type: 'NotFound',
      message: detail || 'Nie znaleziono roadmapy.',
      details: error.details,
    };
  }

  if (error.type === 'BadRequestError') {
    return {
      type: 'InvalidOperation',
      message: detail || 'Nieprawidłowa operacja na roadmapie.',
      details: error.details,
    };
  }

  return {
    type: 'GenericApiError',
    message: detail || 'Wystąpił nieoczekiwany błąd serwera.',
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
): Promise<Result<RoadmapDetailsDto, RoadmapDomainError>> {
  const result = await roadmapApiClient.post<RoadmapDetailsDto, GenerateRoadmapPayload>(
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
