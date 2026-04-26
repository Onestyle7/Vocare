'use server';

import { getOauthClient, OAuthProvider } from '@/lib/auth/oauth/base';
import { authApiClient, getOAuthEndpoint, SignInResult } from './api';
import { redirect } from 'next/navigation';

export async function OAuthSignIn(provider: OAuthProvider) {
  const oAuthClient = getOauthClient(provider);
  redirect(oAuthClient.createAuthUrl());
}

export async function OAuthVerify(provider: OAuthProvider, providerToken: string) {
  const endpoint = getOAuthEndpoint(provider);
  return authApiClient
    .post<SignInResult, { AccessToken: string }>(endpoint, {
      AccessToken: providerToken,
    })
    .then((res) => res.data);
}
