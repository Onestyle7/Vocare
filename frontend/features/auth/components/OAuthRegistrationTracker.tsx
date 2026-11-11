'use client';

import { useEffect } from 'react';

import { getCookie } from '@/lib/utils';
import { NEW_OAUTH_USER_COOKIE, trackConversion } from '@/lib/utils/tracking';

/** The OAuth callback is a server redirect, so it leaves a short-lived cookie to report from here. */
export function OAuthRegistrationTracker() {
  useEffect(() => {
    if (!getCookie(NEW_OAUTH_USER_COOKIE)) return;

    document.cookie = `${NEW_OAUTH_USER_COOKIE}=; max-age=0; path=/`;
    trackConversion('CompleteRegistration');
  }, []);

  return null;
}
