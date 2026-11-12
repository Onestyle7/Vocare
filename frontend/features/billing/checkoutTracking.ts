import { type ProductDetails, trackEvent } from '@/lib/utils/tracking';

const PENDING_CHECKOUT_KEY = 'pending_checkout';
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
 */
export function trackCheckoutStarted(checkout: Checkout): void {
  trackEvent('InitiateCheckout', toDetails(checkout));

  try {
    sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(checkout));
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
