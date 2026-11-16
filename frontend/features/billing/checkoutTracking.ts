import type { CheckoutSessionSummary } from '@/features/billing/dal/api';
import { trackEvent } from '@/lib/utils/tracking';

const CURRENCY = 'PLN';

// Checkout sessions already reported on this page
const reportedSessions = new Set<string>();

type Checkout = {
  priceId: string;
  name: string;
  value: number;
  isTrial: boolean;
};

/** Reports the click that sends the visitor to Stripe. A trial charges nothing today. */
export function trackCheckoutStarted({ priceId, name, value, isTrial }: Checkout): void {
  trackEvent('InitiateCheckout', {
    id: priceId,
    name,
    value: isTrial ? 0 : value,
    currency: CURRENCY,
  });
}

/**
 * Reports the checkout the visitor has returned from, as verified by the backend: a purchase only
 * once Stripe has the money, a trial start for a trial, and nothing for an unpaid or open session
 * (e.g. a bank transfer still pending). The session ID is the transaction ID, so a reload or a
 * second tab can't count the same checkout twice.
 */
export function trackCheckoutCompleted(summary: CheckoutSessionSummary | null): void {
  if (!summary || summary.status !== 'complete') return;

  const event = summary.isTrial
    ? 'StartTrial'
    : summary.paymentStatus === 'paid'
      ? 'Purchase'
      : null;
  // Effects may run twice for one return (React Strict Mode in development, a re-render before the
  // address is cleaned up); the platforms would deduplicate by ID, but nothing needs to go twice
  if (!event || reportedSessions.has(summary.sessionId)) return;
  reportedSessions.add(summary.sessionId);

  trackEvent(event, {
    id: summary.priceId,
    name: summary.packageName,
    value: summary.isTrial ? 0 : summary.amountTotal,
    currency: summary.currency || CURRENCY,
    transactionId: summary.sessionId,
  });
}
