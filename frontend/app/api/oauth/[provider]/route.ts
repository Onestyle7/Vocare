import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';

import { getOAuthEndpoint } from '@/app/(auth)/_dal/api';
import { verifyOauthTokenService } from '@/app/(auth)/_dal/services';
import { getOauthClient, oAuthProviders } from '@/lib/auth/oauth/base';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: rawProvider } = await params;
  const code = request.nextUrl.searchParams.get('code');
  const provider = z.enum(oAuthProviders).parse(rawProvider);
  const redirectUrl = new URL('/sign-in', request.url);

  if (typeof code !== 'string') {
    redirectUrl.searchParams.set(
      'oauthError',
      'Nie udało się połączyć z serwerem. Spróbuj ponownie'
    );
    return NextResponse.redirect(redirectUrl);
  }

  const oAuthClient = getOauthClient(provider);
  const tokenResult = await oAuthClient.fetchToken(code);
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
    redirectUrl.searchParams.set('oauthError', result.error.message);
    return NextResponse.redirect(redirectUrl);
  }

  const cookieStore = await cookies();
  cookieStore.set('token', result.value.token);
  redirect('/dashboard');
}
