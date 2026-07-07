import { ApiClient } from '@/lib/api/api-client';
import env from '@/lib/env/server';

export const aiApiClient = new ApiClient({
  baseUrl: `${env.API_BASE_URL}/Ai`,
});

export const jobOffersApiClient = new ApiClient({
  baseUrl: `${env.API_BASE_URL}/JobOffers`,
});

export type { CareerPathMatchResult, MatchDetails, ScoredJobOffer } from '@/lib/types/jobOffers';
export type { AiCareerResponse, CareerPath } from '@/lib/types/recommendation';
