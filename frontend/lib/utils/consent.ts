import { getCookie, setCookie } from '@/lib/utils';
import { ConsentState } from '@/types/gtag';

export const COOKIE_CONSENT_KEY = 'cookie_consent';

/**
 * Checks if analytics consent is granted client-side
 */
export function getAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return getCookie(COOKIE_CONSENT_KEY) === 'granted';
}

/**
 * Saves consent preference in cookies and updates Google Analytics (gtag) consent
 */
export function updateAnalyticsConsent(consent: ConsentState | boolean): void {
  const cookieValue: ConsentState =
    typeof consent === 'boolean' ? (consent ? 'granted' : 'denied') : consent;

  setCookie(COOKIE_CONSENT_KEY, cookieValue, 365);

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: cookieValue,
    });
  }
}
