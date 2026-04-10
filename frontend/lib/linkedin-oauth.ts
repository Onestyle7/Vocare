import env from '@/lib/env/client';

const LINKEDIN_AUTHORIZE_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_OAUTH_SCOPE = 'openid profile email';
const LINKEDIN_OAUTH_STATE_KEY = 'linkedin_oauth_state';
const LINKEDIN_CALLBACK_PATH = '/sign-in/linkedin/callback/';

type LinkedInAuthorizationUrlParams = {
  clientId: string;
  redirectUri: string;
  state: string;
};

export const getLinkedInRedirectUri = (origin: string) =>
  new URL(LINKEDIN_CALLBACK_PATH, origin).toString();

export const createLinkedInOAuthState = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
};

export const buildLinkedInAuthorizationUrl = ({
  clientId,
  redirectUri,
  state,
}: LinkedInAuthorizationUrlParams) => {
  const url = new URL(LINKEDIN_AUTHORIZE_URL);

  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  url.searchParams.set('scope', LINKEDIN_OAUTH_SCOPE);

  return url.toString();
};

export const storeLinkedInOAuthState = (state: string) => {
  window.sessionStorage.setItem(LINKEDIN_OAUTH_STATE_KEY, state);
};

export const getStoredLinkedInOAuthState = () =>
  window.sessionStorage.getItem(LINKEDIN_OAUTH_STATE_KEY);

export const clearLinkedInOAuthState = () => {
  window.sessionStorage.removeItem(LINKEDIN_OAUTH_STATE_KEY);
};

export const beginLinkedInOAuth = () => {
  const clientId = env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;

  if (!clientId) {
    throw new Error('LinkedIn OAuth is not configured');
  }

  const redirectUri = getLinkedInRedirectUri(window.location.origin);
  const state = createLinkedInOAuthState();

  storeLinkedInOAuthState(state);

  console.log('redirectUri:', redirectUri);
  window.location.assign(
    buildLinkedInAuthorizationUrl({
      clientId,
      redirectUri,
      state,
    })
  );
};
