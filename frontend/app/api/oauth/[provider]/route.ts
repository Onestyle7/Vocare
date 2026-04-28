import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
import z from 'zod';

import { OAuthVerify } from '@/app/(auth)/actions';
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
  try {
    const { accessToken } = await oAuthClient.fetchToken(code);
    const { token, email } = await OAuthVerify(provider, accessToken);
    const cookieStore = await cookies();
    cookieStore.set('token', token);
    console.log('Token', { token, email });
  } catch (error) {
    console.error(error);
    redirect(
      `/sign-in?oauthError=${encodeURIComponent('Nie udało się połączyć z serwerem. Spróbuj ponownie')}`
    );
  }

  redirect('/dashboard');
}
