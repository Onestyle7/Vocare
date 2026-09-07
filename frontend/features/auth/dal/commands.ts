'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AUTH_COOKIE_OPTIONS } from '@/features/auth/auth-cookie';
import {
  ForgotPasswordCommand,
  getOAuthEndpoint,
  RegisterCommand,
  ResetPasswordCommand,
  SignInCommand,
} from '@/features/auth/dal/api';
import { getOauthClient, OAuthProvider } from '@/features/auth/oauth/base';
import { actionErr, actionOk } from '@/lib/types/result';

import {
  forgotPasswordService,
  logoutService,
  registerService,
  resetPasswordService,
  signInService,
  verifyOauthTokenService,
} from './services';

export async function OAuthSignIn(provider: OAuthProvider, callbackUrl?: string) {
  const oAuthClient = getOauthClient(provider);
  const redirectUrl = oAuthClient.createAuthUrl(await cookies(), { callbackUrl });
  console.log('[OAUTH REDIRECT URL]', redirectUrl);
  redirect(redirectUrl);
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
      cookieStore.set('token', signInResult.accessToken, AUTH_COOKIE_OPTIONS);
      cookieStore.set('userId', signInResult.userId, AUTH_COOKIE_OPTIONS);
      return actionOk({ success: true });
    },
    (error) => actionErr(error)
  );
}

export async function register(command: RegisterCommand) {
  const result = await registerService(command);

  return result.match(
    (registerResult) =>
      actionOk({ success: true, welcomeBonus: registerResult.welcomeBonus ?? null }),
    (registerError) => actionErr(registerError)
  );
}

export async function logOut() {
  const cookieStore = await cookies();
  await logoutService();
  cookieStore.delete('token');
  cookieStore.delete('userId');
  revalidatePath('/', 'layout');
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
