import { AxiosError } from 'axios';

import { AiCareerResponse } from '../types/recommendation';
import { api } from '../api';

const isUnauthorized = (error: unknown) => {
  return error instanceof AxiosError && error.response?.status === 401;
};

const hasBillingInfoIssue = (error: unknown) => {
  return (
    error instanceof AxiosError &&
    error.response?.status === 500 &&
    typeof error.response.data === 'string' &&
    error.response.data.includes('User billing information')
  );
};

export const fetchLastRecommendation = async (): Promise<AiCareerResponse> => {
  const { data } = await api.get<AiCareerResponse>('/api/Ai/last-recommendation');
  return data;
};

export const generateRecommendations = async (): Promise<AiCareerResponse> => {
  const { data } = await api.get<AiCareerResponse>('/api/Ai/recommendation');
  return data;
};

export const getRecommendationError = (error: unknown): string | 'billing_info_missing' | null => {
  if (hasBillingInfoIssue(error)) {
    return 'billing_info_missing';
  }

  if (isUnauthorized(error)) {
    return 'unauthorized';
  }

  if (error instanceof AxiosError) {
    const detail = (error.response?.data as { detail?: string })?.detail;
    if (detail) {
      return detail;
    }
    if (error.response?.status === 404) {
      return 'not_found';
    }
  }

  return null;
};
