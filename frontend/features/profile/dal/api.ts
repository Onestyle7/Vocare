import { ApiClient } from '@/lib/api/api-client';
import env from '@/lib/env/server';
import { UserProfile } from '@/lib/types/profile';

export const profileApiClient = new ApiClient({
  baseUrl: `${env.API_BASE_URL}/UserProfile`,
});

export type CreateProfileCommand = UserProfile;
export type UpdateProfileCommand = UserProfile;
