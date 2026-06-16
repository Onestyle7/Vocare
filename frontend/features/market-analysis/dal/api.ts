import { ApiClient } from '@/lib/api/api-client';
import env from '@/lib/env/server';

export const marketAnalysisApiClient = new ApiClient({
  baseUrl: `${env.API_BASE_URL}/MarketAnalysis`,
});

export * from '@/lib/types/marketAnalysis';
