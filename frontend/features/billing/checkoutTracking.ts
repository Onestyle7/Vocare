import { getCookie } from '@/lib/utils';
import { ADS_CONSENT_KEY, COOKIE_CONSENT_KEY, hasTrackingConsent } from '@/lib/utils/consent';
import { PENDING_CHECKOUT_KEY } from '@/lib/utils/tracker-data';
import { type ProductDetails, trackEvent } from '@/lib/utils/tracking';

const CURRENCY = 'PLN';

type Checkout = {
  priceId: string;
  name: string;
  value: number;
  isTrial: boolean;
};

function toDetails({ priceId, name, value, isTrial }: Checkout): ProductDetails {
  // A trial charges nothing today, whatever the plan costs later
  return { id: priceId, name, value: isTrial ? 0 : value, currency: CURRENCY };
}

/**
 * Stripe returns to the same URL after every checkout, so what was bought is remembered in this
 * tab until the visitor comes back. A trial costs 0 zł and must not be reported as a purchase.
 *
 * It is remembered only with consent to at least one tracking tool: the note serves nothing but
 * this measurement, so without consent it isn't stored on the device at all.
 */
export function trackCheckoutStarted(checkout: Checkout): void {
  trackEvent('InitiateCheckout', toDetails(checkout));

  try {
    if (hasTrackingConsent(getCookie(COOKIE_CONSENT_KEY), getCookie(ADS_CONSENT_KEY))) {
      sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(checkout));
    } else {
      sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
    }
  } catch {
    // Storage unavailable (e.g. blocked by the browser) – the conversion just won't be reported
  }
}

/** Reports the remembered checkout once, so a repeated visit can't count the same purchase again. */
export function trackCheckoutCompleted(): void {
  let pending: Checkout | null;

  try {
    const stored = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
    sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
    pending = stored ? JSON.parse(stored) : null;
  } catch {
    return;
  }

  if (!pending) return;

  trackEvent(pending.isTrial ? 'StartTrial' : 'Purchase', toDetails(pending));
}
