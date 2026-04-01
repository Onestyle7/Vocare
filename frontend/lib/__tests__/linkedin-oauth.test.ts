import { describe, expect, it } from 'vitest';
import { buildLinkedInAuthorizationUrl, getLinkedInRedirectUri } from '@/lib/linkedin-oauth';

describe('LinkedIn OAuth helpers', () => {
  it('builds the callback redirect URI from an app origin', () => {
    expect(getLinkedInRedirectUri('https://vocare.pl')).toBe(
      'https://vocare.pl/sign-in/linkedin/callback'
    );
  });

  it('builds a LinkedIn authorization URL with the required parameters', () => {
    const url = new URL(
      buildLinkedInAuthorizationUrl({
        clientId: 'linkedin-client-id',
        redirectUri: 'https://vocare.pl/sign-in/linkedin/callback/',
        state: 'oauth-state',
      })
    );

    expect(url.origin).toBe('https://www.linkedin.com');
    expect(url.pathname).toBe('/oauth/v2/authorization');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('client_id')).toBe('linkedin-client-id');
    expect(url.searchParams.get('redirect_uri')).toBe(
      'https://vocare.pl/sign-in/linkedin/callback'
    );
    expect(url.searchParams.get('state')).toBe('oauth-state');
    expect(url.searchParams.get('scope')).toBe('openid profile email');
  });
});
