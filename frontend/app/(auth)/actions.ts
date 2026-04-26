'use server';

import { getOauthClient, OAuthProvider } from '@/lib/auth/oauth/base';
import {
  authApiClient,
  getOAuthEndpoint,
  RegisterCommand,
  RegisterResult,
  SignInCommand,
  SignInResult,
} from './api';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export async function OAuthSignIn(provider: OAuthProvider) {
  const oAuthClient = getOauthClient(provider);
  redirect(oAuthClient.createAuthUrl());
}

export async function OAuthVerify(provider: OAuthProvider, providerToken: string) {
  const endpoint = getOAuthEndpoint(provider);
  return await authApiClient
    .post<SignInResult, { AccessToken: string }>(endpoint, {
      AccessToken: providerToken,
    })
    .then((res) => res.data);
}

export async function signIn(command: SignInCommand) {
  const cookieStore = await cookies();
  const result = await authApiClient.post<SignInResult, SignInCommand>('/login', command);
  const { token } = result.data;
  cookieStore.set('token', token);
}

export async function register(command: RegisterCommand) {
  const result = await authApiClient.post<RegisterResult, RegisterCommand>('/register', command);
  const { success } = result.data;
  if (success) redirect('/sign-in');
}

export async function logOut() {
  const cookieStore = await cookies();
  authApiClient.post('/logout');
  cookieStore.delete('token');
  redirect('/sign-in');
}
