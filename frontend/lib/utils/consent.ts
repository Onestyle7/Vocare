import { getCookie, setCookie } from '@/lib/utils';
import { clearAdsData, clearAnalyticsData, clearTrackingHelpers } from '@/lib/utils/tracker-data';
import { ConsentState } from '@/types/gtag';

// Analytics (Google Analytics). The name predates the advertising choice and stays unchanged,
// so decisions made in the earlier analytics-only banner remain valid.
export const COOKIE_CONSENT_KEY = 'cookie_consent';
// Advertising pixels (TikTok, Meta) – a separate choice from analytics
export const ADS_CONSENT_KEY = 'ads_consent';
// Random ID of this browser's choices, linking them to the server-side record of each decision
// (proof of consent, GDPR art. 7(1)); see lib/utils/consent-record.ts
export const CONSENT_ID_COOKIE = 'consent_id';

export const CONSENT_COOKIE_DAYS = 365;

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
 * Removes the events waiting in the pixels' queues. Before the SDKs load, their base code
 * (lib/utils/tiktok-pixel.ts, meta-pixel.ts) only collects calls: TikTok in the `ttq` array itself,
 * Meta in `fbq.queue`. Setup calls (Meta's `set autoConfig` and `init`) stay, so a later consent
 * still starts the pixels configured as intended.
 */
function dropQueuedPixelEvents(): void {
  const queues = [window.ttq, (window.fbq as { queue?: unknown } | undefined)?.queue];

  for (const queue of queues) {
    if (!Array.isArray(queue)) continue;
    for (let i = queue.length - 1; i >= 0; i--) {
      const method = (queue[i] as ArrayLike<unknown> | undefined)?.[0];
      if (method === 'track' || method === 'trackCustom') queue.splice(i, 1);
    }
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
  const previousChoice = getCookie(ADS_CONSENT_KEY);

  setCookie(ADS_CONSENT_KEY, cookieValue, CONSENT_COOKIE_DAYS);

  if (cookieValue === 'granted') {
    window.ttq?.grantConsent();
    window.loadTikTokPixel?.();
    window.fbq?.('consent', 'grant');
    window.loadMetaPixel?.();
  } else {
    // Events kept while the visitor was deciding must not go out if they agree later on this page.
    // With an earlier consent the SDKs are loaded, send at once and keep no queue.
    if (previousChoice !== 'granted') dropQueuedPixelEvents();
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
