import crypto from 'crypto';
import { err, ok, Result } from 'neverthrow';
import z from 'zod';

import env from '@/lib/env/server';
import { Cookies } from '@/lib/types/api';
import { BaseAppError } from '@/lib/types/result';

import { createGoogleOAuthClient } from './google';
import type { OAuthProvider } from './providers';

export { type OAuthProvider, oAuthProviders } from './providers';

export const STATE_COOKIE_KEY = 'oAuthState';
export const COOKIE_EXPIRATION_SECONDS = 60 * 10;

export class OAuthClient {
  private readonly provider: OAuthProvider;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly scopes: string[];
  private readonly urls: {
    auth: string;
    token: string;
  };
  private readonly tokenSchema = z.object({
    access_token: z.string(),
    token_type: z.string(),
  });

  constructor({
    provider,
    clientId,
    clientSecret,
    scopes,
    urls,
  }: {
    provider: OAuthProvider;
    clientId: string;
    clientSecret: string;
    scopes: string[];
    urls: {
      auth: string;
      token: string;
    };
  }) {
    this.provider = provider;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.scopes = scopes;
    this.urls = urls;
  }

  private get redirectUrl() {
    const url = new URL(this.provider, env.OAUTH_REDIRECT_URL_BASE);
    console.log(url);
    return url;
  }

  createAuthUrl(cookies: Pick<Cookies, 'set'>, params?: { callbackUrl?: string }) {
    const url = new URL(this.urls.auth);
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('redirect_uri', this.redirectUrl.toString());
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', this.scopes.join(' '));
    url.searchParams.set('state', createState(cookies));

    if (params && params.callbackUrl) {
      cookies.set('oauthCallbackUrl', params.callbackUrl, {
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
        expires: Date.now() + COOKIE_EXPIRATION_SECONDS * 1000,
      });
    }

    return url.toString();
  }

  async fetchToken(
    code: string,
    state: string,
    cookies: Pick<Cookies, 'get'>
  ): Promise<Result<{ accessToken: string; tokenType: string }, OAuthError>> {
    if (!validateState(state, cookies)) {
      return err({
        type: 'InvalidStateError',
        message: 'Nie udało się zweryfikować poprawności zapytania',
        details: {
          title: 'Oauth Error',
          status: 500,
          detail: 'Invalid state paremeter',
          errorCode: 'OAUTH_ERROR',
          traceId: '',
        },
      });
    }

    return await fetch(this.urls.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        code,
        redirect_uri: this.redirectUrl.toString(),
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    })
      .then((res) => res.json())
      .then((rawData) => {
        const { data, success, error } = this.tokenSchema.safeParse(rawData);
        if (!success)
          return err({
            type: 'OAuthProviderError',
            message: error.message,
            details: {
              title: 'Oauth Error',
              status: 500,
              detail: error.flatten(),
              errorCode: 'OAUTH_ERROR',
              traceId: '',
            },
          });

        return ok({
          accessToken: data.access_token,
          tokenType: data.token_type,
        });
      });
  }
}

function createState(cookies: Pick<Cookies, 'set'>) {
  const state = crypto.randomBytes(64).toString('hex').normalize();
  cookies.set(STATE_COOKIE_KEY, state, {
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
    expires: Date.now() + COOKIE_EXPIRATION_SECONDS * 1000,
  });
  return state;
}

function validateState(state: string, cookies: Pick<Cookies, 'get'>) {
  const cookieState = cookies.get(STATE_COOKIE_KEY)?.value;
  return cookieState === state;
}

export function getOauthClient(provider: OAuthProvider) {
  switch (provider) {
    case 'google': {
      return createGoogleOAuthClient();
    }
    default: {
      throw new Error(`Invalid provider: ${provider satisfies never}`);
    }
  }
}

export type OAuthError = BaseAppError<'OAuthProviderError' | 'InvalidStateError'>;
