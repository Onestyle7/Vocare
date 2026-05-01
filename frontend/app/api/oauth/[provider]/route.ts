import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
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

  if (typeof code !== 'string') {
    redirect(
      `/sign-in?oauthError=${encodeURIComponent('Nie udało się połączyć z serwerem. Spróbuj ponownie')}`
    );
  }

  const oAuthClient = getOauthClient(provider);
  const tokenResult = await oAuthClient.fetchToken(code);
  if (tokenResult.isErr()) {
    console.error(`${provider} error: ${tokenResult.error}`);
    return redirect(
      `/sign-in?oauthError=${encodeURIComponent('Nie udało się połączyć z serwerem. Spróbuj ponownie')}`
    );
  }

  const endpoint = getOAuthEndpoint(provider);
  const result = await verifyOauthTokenService(endpoint, tokenResult.value.accessToken);
  if (result.isErr()) {
    console.error(`OAuth token validation error: ${result.error.message}`);
    return redirect(
      `/sign-in?oauthError=${encodeURIComponent('Nie udało się połączyć z serwerem. Spróbuj ponownie')}`
    );
  }
  const cookieStore = await cookies();
  cookieStore.set('token', result.value.token);

  redirect('/dashboard');
}
