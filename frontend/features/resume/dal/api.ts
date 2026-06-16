import { ApiClient } from '@/lib/api/api-client';
import env from '@/lib/env/server';

export const cvApiClient = new ApiClient({
  baseUrl: `${env.API_BASE_URL}/cvs`,
});

export * from '@/lib/types/cv';
