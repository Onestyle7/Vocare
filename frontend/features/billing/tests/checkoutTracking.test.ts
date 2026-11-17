import { beforeEach, describe, expect, it, vi } from 'vitest';

import { trackCheckoutCompleted, trackCheckoutStarted } from '@/features/billing/checkoutTracking';
import type { CheckoutSessionSummary } from '@/features/billing/dal/api';

const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));

vi.mock('@/lib/utils/tracking', () => ({ trackEvent }));

const paidTokens: CheckoutSessionSummary = {
  sessionId: 'cs_test_tokens',
  status: 'complete',
  paymentStatus: 'paid',
  mode: 'payment',
  isTrial: false,
  amountTotal: 14.25,
  currency: 'PLN',
  priceId: 'price_tokens',
  packageName: 'Pakiet 500 tokenów',
};

const trial: CheckoutSessionSummary = {
  sessionId: 'cs_test_trial',
  status: 'complete',
  paymentStatus: 'no_payment_required',
  mode: 'subscription',
  isTrial: true,
  amountTotal: 0,
  currency: 'PLN',
  priceId: 'price_premium',
  packageName: 'Premium',
};

describe('checkoutTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('reports the start of a checkout with its amount, and stores nothing on the device', () => {
    trackCheckoutStarted({ priceId: 'price_tokens', name: 'Tokeny', value: 14.25, isTrial: false });

    expect(trackEvent).toHaveBeenCalledWith('InitiateCheckout', {
      id: 'price_tokens',
      name: 'Tokeny',
      value: 14.25,
      currency: 'PLN',
    });
    expect(sessionStorage.length).toBe(0);
  });

  it('reports a trial checkout start with no revenue', () => {
    trackCheckoutStarted({ priceId: 'price_premium', name: 'Premium', value: 29, isTrial: true });

    expect(trackEvent).toHaveBeenCalledWith(
      'InitiateCheckout',
      expect.objectContaining({ value: 0 })
    );
  });

  it('reports a paid session as a purchase with the verified amount and the session as transaction', () => {
    trackCheckoutCompleted(paidTokens);

    expect(trackEvent).toHaveBeenCalledOnce();
    expect(trackEvent).toHaveBeenCalledWith('Purchase', {
      id: 'price_tokens',
      name: 'Pakiet 500 tokenów',
      value: 14.25,
      currency: 'PLN',
      transactionId: 'cs_test_tokens',
    });
  });

  it('reports a trial as a trial start with no revenue, never as a purchase', () => {
    trackCheckoutCompleted(trial);

    expect(trackEvent).toHaveBeenCalledOnce();
    expect(trackEvent).toHaveBeenCalledWith('StartTrial', {
      id: 'price_premium',
      name: 'Premium',
      value: 0,
      currency: 'PLN',
      transactionId: 'cs_test_trial',
    });
  });

  it.each([
    ['an unpaid session (payment still pending)', { paymentStatus: 'unpaid' }],
    ['an open session', { status: 'open' }],
    ['an expired session', { status: 'expired' }],
  ])('reports nothing for %s', (_, change) => {
    trackCheckoutCompleted({ ...paidTokens, ...change });

    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('reports a session only once, however many times the page asks', () => {
    const session = { ...paidTokens, sessionId: 'cs_test_twice' };

    trackCheckoutCompleted(session);
    trackCheckoutCompleted(session);

    expect(trackEvent).toHaveBeenCalledOnce();
  });

  it('still reports a session that was seen unpaid before and is paid now', () => {
    const session = { ...paidTokens, sessionId: 'cs_test_pending' };

    trackCheckoutCompleted({ ...session, paymentStatus: 'unpaid' });
    trackCheckoutCompleted(session);

    expect(trackEvent).toHaveBeenCalledOnce();
    expect(trackEvent).toHaveBeenCalledWith('Purchase', expect.objectContaining({ value: 14.25 }));
  });

  it('reports nothing without a verified session', () => {
    trackCheckoutCompleted(null);

    expect(trackEvent).not.toHaveBeenCalled();
  });
});
