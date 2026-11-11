import { getCookie, setCookie } from '@/lib/utils';
import { ConsentState } from '@/types/gtag';

// Analytics (Google Analytics). The name predates the advertising choice and stays unchanged,
// so decisions made in the earlier analytics-only banner remain valid.
export const COOKIE_CONSENT_KEY = 'cookie_consent';
// Advertising pixels (TikTok, Meta) – a separate choice from analytics
export const ADS_CONSENT_KEY = 'ads_consent';

const CONSENT_COOKIE_DAYS = 365;

function toConsentState(consent: ConsentState | boolean): ConsentState {
  return typeof consent === 'boolean' ? (consent ? 'granted' : 'denied') : consent;
}

/**
 * Checks if analytics consent is granted client-side
 */
export function getAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return getCookie(COOKIE_CONSENT_KEY) === 'granted';
}

/**
 * Checks if advertising consent is granted client-side
 */
export function getAdsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return getCookie(ADS_CONSENT_KEY) === 'granted';
}

/**
 * Saves the analytics choice in a cookie and updates Google Analytics (gtag) consent
 */
export function updateAnalyticsConsent(consent: ConsentState | boolean): void {
  const cookieValue = toConsentState(consent);

  setCookie(COOKIE_CONSENT_KEY, cookieValue, CONSENT_COOKIE_DAYS);

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: cookieValue,
    });
  }
}

/**
 * Saves the advertising choice in a cookie and starts or stops the TikTok and Meta pixels
 */
export function updateAdsConsent(consent: ConsentState | boolean): void {
  const cookieValue = toConsentState(consent);

  setCookie(ADS_CONSENT_KEY, cookieValue, CONSENT_COOKIE_DAYS);

  if (cookieValue === 'granted') {
    window.ttq?.grantConsent();
    window.loadTikTokPixel?.();
    window.fbq?.('consent', 'grant');
    window.loadMetaPixel?.();
  } else {
    window.ttq?.revokeConsent();
    window.fbq?.('consent', 'revoke');
  }
}
