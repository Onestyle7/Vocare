'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getOauthClient, OAuthProvider } from '@/lib/auth/oauth/base';

import {
  authApiClient,
  getOAuthEndpoint,
  OAuthSignInResult,
  RegisterCommand,
  RegisterResult,
  SignInCommand,
  SignInResult,
} from './api';

export async function OAuthSignIn(provider: OAuthProvider) {
  const oAuthClient = getOauthClient(provider);
  redirect(oAuthClient.createAuthUrl());
}

export async function OAuthVerify(provider: OAuthProvider, providerToken: string) {
  const endpoint = getOAuthEndpoint(provider);
  return await authApiClient
    .post<OAuthSignInResult, { AccessToken: string }>(endpoint, {
      AccessToken: providerToken,
    })
    .then((res) => res.data);
}

export async function signIn(command: SignInCommand) {
  const cookieStore = await cookies();
  const result = await authApiClient.post<SignInResult, SignInCommand>('/login', command);
  const { accessToken } = result.data;
  cookieStore.set('token', accessToken, { httpOnly: true, sameSite: 'lax', path: '/' });
  return { success: true };
}

export async function register(command: RegisterCommand) {
  const result = await authApiClient.post<RegisterResult, RegisterCommand>('/register', command);
  const { success } = result.data;
  return { success };
}

export async function logOut() {
  const cookieStore = await cookies();
  await authApiClient.post('/logout');
  cookieStore.delete('token');
  return { success: true };
}
