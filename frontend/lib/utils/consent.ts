import { getCookie, setCookie } from '@/lib/utils';
import { clearAdsData, clearAnalyticsData, clearTrackingHelpers } from '@/lib/utils/tracker-data';
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
 * Whether these consent cookie values accept at least one tracking tool. Only then may our
 * measurement helpers (lib/utils/tracker-data.ts) be stored on the visitor's device: they serve no
 * other purpose, and storing them before a decision would need the consent not yet given.
 * Takes the values, so the server can check the request's cookies too.
 */
export function hasTrackingConsent(
  analyticsChoice: string | null | undefined,
  adsChoice: string | null | undefined
): boolean {
  return analyticsChoice === 'granted' || adsChoice === 'granted';
}

function clearHelpersWithoutConsent(): void {
  if (!hasTrackingConsent(getCookie(COOKIE_CONSENT_KEY), getCookie(ADS_CONSENT_KEY))) {
    clearTrackingHelpers();
  }
}

/**
 * Saves the analytics choice in a cookie and starts or stops Google Analytics
 * (see lib/utils/google-analytics.ts)
 */
export function updateAnalyticsConsent(consent: ConsentState | boolean): void {
  const cookieValue = toConsentState(consent);

  setCookie(COOKIE_CONSENT_KEY, cookieValue, CONSENT_COOKIE_DAYS);

  if (cookieValue === 'granted') {
    window.loadGoogleAnalytics?.();
  } else {
    window.disableGoogleAnalytics?.();
    clearAnalyticsData();
    clearHelpersWithoutConsent();
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
    clearAdsData();
    clearHelpersWithoutConsent();
  }
}

/**
 * Removes stored identifiers of every tool the visitor has refused. Run on each page load, so it
 * also cleans up after a refusal made in another tab or before this cleanup existed.
 */
export function clearRefusedTrackerData(): void {
  if (getCookie(COOKIE_CONSENT_KEY) === 'denied') clearAnalyticsData();
  if (getCookie(ADS_CONSENT_KEY) === 'denied') clearAdsData();
  clearHelpersWithoutConsent();
}
