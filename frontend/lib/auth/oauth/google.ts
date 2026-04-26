import { OAuthClient } from './base';
import env from '@/lib/env/server';

export function createGoogleOAuthClient() {
  return new OAuthClient({
    provider: 'google',
    clientId: env.OAUTH_GOOGLE_CLIENT_ID,
    clientSecret: env.OAUTH_GOOGLE_CLIENT_SECRET,
    scopes: ['openid', 'profile', 'email'],
    urls: {
      auth: 'https://accounts.google.com/o/oauth2/v2/auth',
      token: 'https://accounts.google.com/o/oauth2/token',
    },
  });
}
