import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';

import { AUTH_COOKIE_OPTIONS } from '@/features/auth/auth-cookie';
import { getOAuthEndpoint } from '@/features/auth/dal/api';
import { verifyOauthTokenService } from '@/features/auth/dal/services';
import { getOauthClient, oAuthProviders, STATE_COOKIE_KEY } from '@/features/auth/oauth/base';
import { ADS_CONSENT_KEY, COOKIE_CONSENT_KEY, hasTrackingConsent } from '@/lib/utils/consent';
import { NEW_OAUTH_USER_COOKIE } from '@/lib/utils/tracker-data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: rawProvider } = await params;
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const provider = z.enum(oAuthProviders).parse(rawProvider);
  const redirectUrl = new URL('/sign-in', request.url);

  if (typeof code !== 'string' || typeof state !== 'string') {
    redirectUrl.searchParams.set(
      'oauthError',
      'Nie udało się połączyć z serwerem. Spróbuj ponownie'
    );
    return NextResponse.redirect(redirectUrl);
  }

  const oAuthClient = getOauthClient(provider);
  const tokenResult = await oAuthClient.fetchToken(code, state, await cookies());
  if (tokenResult.isErr()) {
    console.error(`${provider} error: ${tokenResult.error}`);
    redirectUrl.searchParams.set(
      'oauthError',
      'Nie udało się połączyć z serwerem. Spróbuj ponownie'
    );
    return NextResponse.redirect(redirectUrl);
  }

  const endpoint = getOAuthEndpoint(provider);
  const result = await verifyOauthTokenService(endpoint, tokenResult.value.accessToken);
  if (result.isErr()) {
    console.error(`OAuth token validation error: ${result.error.message}`);
    redirectUrl.searchParams.set('reason', result.error.message);
    return NextResponse.redirect(redirectUrl);
  }

  const cookieStore = await cookies();
  cookieStore.set('token', result.value.accessToken, AUTH_COOKIE_OPTIONS);
  cookieStore.delete(STATE_COOKIE_KEY);

  const callbackUrl = cookieStore.get('oauthCallbackUrl')?.value;
  if (callbackUrl) {
    cookieStore.delete('oauthCallbackUrl');
  }

  cookieStore.set('userId', result.value.userId, AUTH_COOKIE_OPTIONS);

  // The cookie only carries the sign-up to the tools the visitor accepted, so it needs that consent
  const canReportRegistration = hasTrackingConsent(
    cookieStore.get(COOKIE_CONSENT_KEY)?.value,
    cookieStore.get(ADS_CONSENT_KEY)?.value
  );

  if (result.value.isNewUser && canReportRegistration) {
    // The value is the provider, reported as the sign-up method
    cookieStore.set(NEW_OAUTH_USER_COOKIE, provider, {
      ...AUTH_COOKIE_OPTIONS,
      httpOnly: false,
      maxAge: 5 * 60,
    });
  }

  redirect(callbackUrl || '/dashboard');
}
