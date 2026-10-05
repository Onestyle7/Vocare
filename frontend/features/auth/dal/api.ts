import { OAuthProvider } from '@/features/auth/oauth/base';
import type { WelcomeBonus } from '@/features/marketing/utils/welcomeBonus';
import { ApiClient } from '@/lib/api/api-client';
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
  welcomeBonus: WelcomeBonus | null;
};

export type RegisterCommand = {
  email: string;
  password: string;
  confirmPassword: string;
  acceptMarketingConsent: boolean;
  acceptTermsAndConditions?: boolean;
};

export type ForgotPasswordCommand = {
  email: string;
};

export type ResetPasswordCommand = {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
};

export type ValidateResetPasswordCommand = {
  email: string;
  token: string;
};

export type ValidateResetPasswordResult = {
  isValid: boolean;
};
