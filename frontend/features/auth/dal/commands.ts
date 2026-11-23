'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AUTH_COOKIE_OPTIONS } from '@/features/auth/auth-cookie';
import {
  DeleteAccountCommand,
  ForgotPasswordCommand,
  getOAuthEndpoint,
  RegisterCommand,
  ResetPasswordCommand,
  SignInCommand,
} from '@/features/auth/dal/api';
import { getOauthClient, OAuthProvider } from '@/features/auth/oauth/base';
import {
  parseResetPasswordLink,
  RESET_PASSWORD_COOKIE,
  RESET_PASSWORD_PATH,
} from '@/features/auth/reset-password-link';
import {
  SESSION_MARKER,
  SESSION_MARKER_COOKIE,
  SESSION_MARKER_COOKIE_OPTIONS,
} from '@/features/auth/session-marker';
import { actionErr, actionOk } from '@/lib/types/result';

import {
  deleteAccountService,
  forgotPasswordService,
  logoutService,
  registerService,
  type ResetPasswordDomainError,
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
      cookieStore.set(SESSION_MARKER_COOKIE, SESSION_MARKER.active, SESSION_MARKER_COOKIE_OPTIONS);
      return actionOk({ success: true });
    },
    (error) => actionErr(error)
  );
}

export async function register(command: RegisterCommand) {
  const result = await registerService(command);

  return result.match(
    (registerResult) =>
      actionOk({
        success: true,
        welcomeBonus: registerResult.welcomeBonus ?? null,
        consentDiscount: registerResult.consentDiscount ?? null,
      }),
    (registerError) => actionErr(registerError)
  );
}

export async function logOut() {
  const cookieStore = await cookies();
  await logoutService();
  cookieStore.delete('token');
  cookieStore.delete('userId');
  cookieStore.set(SESSION_MARKER_COOKIE, SESSION_MARKER.signedOut, SESSION_MARKER_COOKIE_OPTIONS);
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

/** Takes the token and email from the cookie set by proxy.ts, so the token never reaches the browser. */
export async function resetPassword(
  passwords: Pick<ResetPasswordCommand, 'newPassword' | 'confirmPassword'>
) {
  const cookieStore = await cookies();
  const link = parseResetPasswordLink(cookieStore.get(RESET_PASSWORD_COOKIE)?.value);

  if (!link) {
    const error: ResetPasswordDomainError = {
      type: 'ExpiredResetToken',
      message: 'Sesja zmiany hasła wygasła. Otwórz ponownie link z wiadomości e-mail.',
    };
    return actionErr(error);
  }

  const result = await resetPasswordService({ ...link, ...passwords });

  return result.match(
    () => {
      cookieStore.delete({ name: RESET_PASSWORD_COOKIE, path: RESET_PASSWORD_PATH });
      return actionOk({ success: true });
    },
    (error) => actionErr(error)
  );
}

export async function deleteAccount(command?: DeleteAccountCommand) {
  const result = await deleteAccountService(command);
  const cookieStore = await cookies();

  return result.match(
    () => {
      cookieStore.delete('token');
      cookieStore.delete('userId');
      cookieStore.delete(SESSION_MARKER_COOKIE);
      return actionOk({ success: true });
    },
    (error) => actionErr(error)
  );
}
