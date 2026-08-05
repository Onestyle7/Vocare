import { Result } from 'neverthrow';

import { ApiError } from '@/lib/api/api-client';
import { BaseAppError } from '@/lib/types/result';

import {
  CreateCvDto,
  CvAnalysisResult,
  cvApiClient,
  CvDetailsDto,
  CvLimits,
  CvListItemDto,
  GenerateCvFromProfileDto,
  TailorCvDto,
  UpdateCvDto,
} from './api';
import { normalizeCvDto } from './cvNormalization';

export type CvDomainError = BaseAppError<
  | 'Unauthorized'
  | 'NotFound'
  | 'InvalidOperation'
  | 'CvLimitReached'
  | 'InsufficientTokens'
  | 'GenericApiError'
>;

const mapCvError = (error: ApiError): CvDomainError => {
  if (error.details?.errorCode === 'CV_LIMIT_REACHED') {
    return {
      type: 'CvLimitReached',
      message: 'Osiągnięto limit CV dla Twojego planu',
      details: error.details,
    };
  }

  if (error.details?.errorCode === 'INSUFFICIENT_TOKENS') {
    return {
      type: 'InsufficientTokens',
      message: 'Masz za mało tokenów, aby wykonać tę operację',
      details: error.details,
    };
  }

  switch (error.type) {
    case 'UnauthorizedError':
      return {
        type: 'Unauthorized',
        message: 'Zaloguj się, aby zaimportować CV',
        details: error.details,
      };
    case 'NotFoundError':
      return {
        type: 'NotFound',
        message: 'Nie znaleziono odpowiadającego cv',
        details: error.details,
      };
    case 'BadRequestError':
    default: {
      return {
        type: 'GenericApiError',
        message: 'Coś poszło nie tak podczas przetważania twojego żądania',
        details: error.details,
      };
    }
  }
};

const normalizeDetails = (data: CvDetailsDto): CvDetailsDto => ({
  ...data,
  targetPosition: data.targetPosition ?? undefined,
  cvData: normalizeCvDto(data.cvData),
  notes: data.notes ?? undefined,
});

export async function getUserCvsService(
  requestOptions?: RequestInit
): Promise<Result<CvListItemDto[], CvDomainError>> {
  const result = await cvApiClient.get<CvListItemDto[]>('my-cvs', requestOptions);
  return result.map((response) => response.data).mapErr(mapCvError);
}

export async function getCvLimitsService(
  requestOptions?: RequestInit
): Promise<Result<CvLimits, CvDomainError>> {
  const result = await cvApiClient.get<CvLimits>('limits', requestOptions);
  return result.map((response) => response.data).mapErr(mapCvError);
}

export async function getCvDetailsService(
  id: string,
  requestOptions?: RequestInit
): Promise<Result<CvDetailsDto, CvDomainError>> {
  const result = await cvApiClient.get<CvDetailsDto>(`details/${id}`, requestOptions);
  return result.map((response) => normalizeDetails(response.data)).mapErr(mapCvError);
}

export async function createCvService(
  payload: CreateCvDto,
  requestOptions?: RequestInit
): Promise<Result<CvDetailsDto, CvDomainError>> {
  const result = await cvApiClient.post<CvDetailsDto, CreateCvDto>(
    'create',
    payload,
    requestOptions
  );
  return result.map((response) => normalizeDetails(response.data)).mapErr(mapCvError);
}

export async function deleteCvService(
  id: string,
  requestOptions?: RequestInit
): Promise<Result<void, CvDomainError>> {
  const result = await cvApiClient.delete<void>(`delete/${id}`, requestOptions);
  return result.map((response) => response.data).mapErr(mapCvError);
}

export async function updateCvService(
  payload: UpdateCvDto,
  requestOptions?: RequestInit
): Promise<Result<CvDetailsDto, CvDomainError>> {
  const result = await cvApiClient.put<CvDetailsDto, UpdateCvDto>(
    `update/${payload.id}`,
    payload,
    requestOptions
  );
  return result.map((response) => normalizeDetails(response.data)).mapErr(mapCvError);
}

export async function GenerateCvFromProfileService(
  payload: GenerateCvFromProfileDto,
  requestOptions?: RequestInit
): Promise<Result<CvDetailsDto, CvDomainError>> {
  const result = await cvApiClient.post<CvDetailsDto, GenerateCvFromProfileDto>(
    'generate-from-profile',
    payload,
    requestOptions
  );

  return result.map((response) => normalizeDetails(response.data)).mapErr(mapCvError);
}

export async function tailorCvService(
  payload: TailorCvDto,
  requestOptions?: RequestInit
): Promise<Result<CvDetailsDto, CvDomainError>> {
  const result = await cvApiClient.post<CvDetailsDto, TailorCvDto>(
    'tailor',
    payload,
    requestOptions
  );

  return result.map((response) => normalizeDetails(response.data)).mapErr(mapCvError);
}

export async function getCvAnalysisService(
  id: string,
  requestOptions?: RequestInit
): Promise<Result<CvAnalysisResult, CvDomainError>> {
  const result = await cvApiClient.get<CvAnalysisResult>(`analysis/${id}`, requestOptions);
  return result.map((response) => response.data).mapErr(mapCvError);
}

export async function analyzeCvService(
  id: string,
  requestOptions?: RequestInit
): Promise<Result<CvAnalysisResult, CvDomainError>> {
  const result = await cvApiClient.post<CvAnalysisResult>(
    `analyze/${id}`,
    undefined,
    requestOptions
  );
  return result.map((response) => response.data).mapErr(mapCvError);
}
