import env from '@/lib/env/server';
import { ApiClient } from '@/lib/api/api-client';
import { OAuthProvider } from '@/lib/auth/oauth/base';

export const authApiClient = new ApiClient({
  baseUrl: `${env.API_BASE_URL}/auth`,
});

export function getOAuthEndpoint(provider: OAuthProvider) {
  switch (provider) {
    case 'google': {
      return '/google-verify';
    }
    default: {
      throw new Error(`Invalid provider: ${provider satisfies never}`);
    }
  }
}

export type SignInResult = {
  token: string;
  userId: string;
  email: string;
};
