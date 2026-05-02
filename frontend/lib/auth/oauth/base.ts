import { err, ok, Result } from 'neverthrow';
import z from 'zod';

import env from '@/lib/env/server';
import { BaseAppError } from '@/lib/types/result';

import { createGoogleOAuthClient } from './google';

export type OAuthProvider = 'google';
export const oAuthProviders = ['google'] as const;
export type Cookies = {
  set: (
    key: string,
    value: string,
    options: {
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: 'strict' | 'lax';
      expires?: number;
    }
  ) => void;
  get: (key: string) => { name: string; value: string } | undefined;
  delete: (key: string) => void;
};

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

  createAuthUrl() {
    const url = new URL(this.urls.auth);
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('redirect_uri', this.redirectUrl.toString());
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', this.scopes.join(' '));
    return url.toString();
  }

  async fetchToken(
    code: string
  ): Promise<Result<{ accessToken: string; tokenType: string }, OAuthError>> {
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
            details: error.flatten(),
          });

        return ok({
          accessToken: data.access_token,
          tokenType: data.token_type,
        });
      });
  }
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

export type OAuthError = BaseAppError<'OAuthProviderError'>;
