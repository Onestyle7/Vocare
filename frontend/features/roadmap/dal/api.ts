import { ApiClient } from '@/lib/api/api-client';
import env from '@/lib/env/server';

export const roadmapApiClient = new ApiClient({
  baseUrl: `${env.API_BASE_URL}/Roadmap`,
});

export * from '@/lib/types/roadmap';
