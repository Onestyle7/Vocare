import { recordCookieConsent } from '@/features/legal/dal/commands';
import type { CookieConsentSource } from '@/features/legal/types';
import { getCookie, setCookie } from '@/lib/utils';
import { CONSENT_COOKIE_DAYS, CONSENT_ID_COOKIE } from '@/lib/utils/consent';

// randomUUID exists only on HTTPS and localhost; without it the choice is simply not recorded
function createConsentId(): string | null {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : null;
}

/**
 * Sends the cookie choices just saved by updateAnalyticsConsent / updateAdsConsent to the server's
 * record of consents (proof of consent, GDPR art. 7(1)). One random ID per browser, kept in the
 * consent_id cookie and renewed with every choice, links the records to this browser.
 *
 * Fire-and-forget: the choice already works from its cookies, so a failed record must not block it.
 */
export function recordCookieConsentChoice(source: CookieConsentSource): void {
  const consentId = getCookie(CONSENT_ID_COOKIE) ?? createConsentId();
  if (!consentId) return;

  setCookie(CONSENT_ID_COOKIE, consentId, CONSENT_COOKIE_DAYS);
  recordCookieConsent(source).catch(() => {
    // Network or server error: the choice itself is already saved and applied
  });
}
