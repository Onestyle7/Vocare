import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';

import { getOAuthEndpoint } from '@/features/auth/dal/api';
import { verifyOauthTokenService } from '@/features/auth/dal/services';
import { getOauthClient, oAuthProviders, STATE_COOKIE_KEY } from '@/features/auth/oauth/base';

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
  cookieStore.set('token', result.value.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax',
    path: '/',
  });
  cookieStore.delete(STATE_COOKIE_KEY);

  const callbackUrl = cookieStore.get('oauthCallbackUrl')?.value;
  if (callbackUrl) {
    cookieStore.delete('oauthCallbackUrl');
  }

  cookieStore.set('userId', result.value.userId, { httpOnly: true, sameSite: 'lax', path: '/' });
  cookieStore.set('is_authenticated', '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax',
    path: '/',
  });
  redirect(callbackUrl || '/dashboard');
}
