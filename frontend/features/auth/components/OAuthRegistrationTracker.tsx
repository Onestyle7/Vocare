'use client';

import { useEffect } from 'react';

import { oAuthProviders } from '@/features/auth/oauth/providers';
import { getCookie } from '@/lib/utils';
import { NEW_OAUTH_USER_COOKIE } from '@/lib/utils/tracker-data';
import { trackEvent } from '@/lib/utils/tracking';

/** The OAuth callback is a server redirect, so it leaves a short-lived cookie to report from here. */
export function OAuthRegistrationTracker() {
  useEffect(() => {
    const value = getCookie(NEW_OAUTH_USER_COOKIE);
    if (!value) return;

    document.cookie = `${NEW_OAUTH_USER_COOKIE}=; max-age=0; path=/`;
    // The cookie holds the provider; it is readable in the browser, so anything else is ignored
    const method = oAuthProviders.find((provider) => provider === value);
    if (method) trackEvent('CompleteRegistration', { method });
  }, []);

  return null;
}
