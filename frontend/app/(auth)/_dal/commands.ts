'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  ForgotPasswordCommand,
  getOAuthEndpoint,
  RegisterCommand,
  ResetPasswordCommand,
  SignInCommand,
} from '@/app/(auth)/_dal/api';
import { getOauthClient, OAuthProvider } from '@/lib/auth/oauth/base';
import { actionErr, actionOk } from '@/lib/types/result';

import {
  forgotPasswordService,
  logoutService,
  registerService,
  resetPasswordService,
  signInService,
  verifyOauthTokenService,
} from './services';

export async function OAuthSignIn(provider: OAuthProvider) {
  const oAuthClient = getOauthClient(provider);
  redirect(oAuthClient.createAuthUrl());
}

export async function OAuthVerify(provider: OAuthProvider, providerToken: string) {
  const endpoint = getOAuthEndpoint(provider);
  const result = await verifyOauthTokenService(endpoint, providerToken);
  return result.match(
    () => actionOk({ success: true }),
    (error) => actionErr(error)
  );
}

export async function signIn(command: SignInCommand) {
  const result = await signInService(command);
  const cookieStore = await cookies();

  return result.match(
    (signInResult) => {
      cookieStore.set('token', signInResult.token, { httpOnly: true, sameSite: 'lax', path: '/' });
      return actionOk({ success: true });
    },
    (error) => actionErr(error)
  );
}

export async function register(command: RegisterCommand) {
  const result = await registerService(command);

  return result.match(
    () => actionOk({ success: true }),
    (registerError) => actionErr(registerError)
  );
}

export async function logOut() {
  const cookieStore = await cookies();
  await logoutService();
  cookieStore.delete('token');
  return actionOk({ success: true });
}

export async function forgotPassword(command: ForgotPasswordCommand) {
  const result = await forgotPasswordService(command);

  return result.match(
    () => actionOk({ success: true }),
    (error) => actionErr(error)
  );
}

export async function resetPassword(command: ResetPasswordCommand) {
  const result = await resetPasswordService(command);

  return result.match(
    () => actionOk({ success: true }),
    (error) => actionErr(error)
  );
}
