import { ApiClient } from '@/lib/api/api-client';
import { OAuthProvider } from '@/lib/auth/oauth/base';
import env from '@/lib/env/server';

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

export type OAuthSignInResult = {
  token: string;
  userId: string;
  email: string;
};

export type SignInResult = {
  accessToken: string;
  userId: string;
  email: string;
};

export type SignInCommand = {
  email: string;
  password: string;
};

export type RegisterResult = {
  success: boolean;
  userId: string;
  errorMessage: string;
};

export type RegisterCommand = {
  email: string;
  password: string;
  confirmPassword: string;
  marketingConsent: boolean;
};
