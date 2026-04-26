import { NextRequest } from 'next/server';
import { getOauthClient, oAuthProviders } from '@/lib/auth/oauth/base';
import z from 'zod';
import { redirect } from 'next/navigation';
import { OAuthVerify } from '@/app/(auth)/actions';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: rawProvider } = await params;
  const code = request.nextUrl.searchParams.get('code');
  const provider = z.enum(oAuthProviders).parse(rawProvider);

  if (typeof code !== 'string') {
    redirect(`/sign-in?oauthError=${encodeURIComponent('Failed to connect. Please try again.')}`);
  }

  const oAuthClient = getOauthClient(provider);
  try {
    const { accessToken } = await oAuthClient.fetchToken(code);
    const { token } = await OAuthVerify(provider, accessToken);
    const cookieStore = await cookies();
    cookieStore.set('token', token);
  } catch (error) {
    console.error(error);
    redirect(`/sign-in?oauthError=${encodeURIComponent('Failed to connect. Please try again.')}`);
  }

  redirect('/');
}
