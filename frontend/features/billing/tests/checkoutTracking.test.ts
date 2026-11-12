import { beforeEach, describe, expect, it, vi } from 'vitest';

import { trackCheckoutCompleted, trackCheckoutStarted } from '@/features/billing/checkoutTracking';
import { ADS_CONSENT_KEY, COOKIE_CONSENT_KEY } from '@/lib/utils/consent';
import { PENDING_CHECKOUT_KEY } from '@/lib/utils/tracker-data';

const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));

vi.mock('@/lib/utils/tracking', () => ({ trackEvent }));

const tokens = { priceId: 'price_tokens', name: 'Tokeny', value: 14.25, isTrial: false };
const trial = { priceId: 'price_premium', name: 'Premium', value: 29, isTrial: true };

const setConsent = (analytics: string | null, ads: string | null) => {
  for (const [key, value] of [
    [COOKIE_CONSENT_KEY, analytics],
    [ADS_CONSENT_KEY, ads],
  ] as const) {
    document.cookie = value ? `${key}=${value}; path=/` : `${key}=; max-age=0; path=/`;
  }
};

describe('checkoutTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    // The checkout is remembered only with consent to at least one tool
    setConsent(null, 'granted');
  });

  it.each([
    ['before any decision', null, null],
    ['when both tools are refused', 'denied', 'denied'],
  ])('stores nothing on the device %s, so no purchase is reported', (_, analytics, ads) => {
    setConsent(analytics, ads);

    trackCheckoutStarted(tokens);
    vi.clearAllMocks();
    trackCheckoutCompleted();

    expect(sessionStorage.getItem(PENDING_CHECKOUT_KEY)).toBeNull();
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('remembers the checkout with consent to either tool alone', () => {
    setConsent('granted', 'denied');

    trackCheckoutStarted(tokens);

    expect(sessionStorage.getItem(PENDING_CHECKOUT_KEY)).not.toBeNull();
  });

  it('reports the start of a checkout with its amount', () => {
    trackCheckoutStarted(tokens);

    expect(trackEvent).toHaveBeenCalledWith('InitiateCheckout', {
      id: 'price_tokens',
      name: 'Tokeny',
      value: 14.25,
      currency: 'PLN',
    });
  });

  it('reports a paid checkout as a purchase with its amount', () => {
    trackCheckoutStarted(tokens);
    vi.clearAllMocks();

    trackCheckoutCompleted();

    expect(trackEvent).toHaveBeenCalledOnce();
    expect(trackEvent).toHaveBeenCalledWith('Purchase', {
      id: 'price_tokens',
      name: 'Tokeny',
      value: 14.25,
      currency: 'PLN',
    });
  });

  it('reports a trial as a trial start with no revenue and not as a purchase', () => {
    trackCheckoutStarted(trial);
    vi.clearAllMocks();

    trackCheckoutCompleted();

    expect(trackEvent).toHaveBeenCalledOnce();
    expect(trackEvent).toHaveBeenCalledWith('StartTrial', {
      id: 'price_premium',
      name: 'Premium',
      value: 0,
      currency: 'PLN',
    });
  });

  it('reports a completed checkout only once', () => {
    trackCheckoutStarted(tokens);
    vi.clearAllMocks();

    trackCheckoutCompleted();
    trackCheckoutCompleted();

    expect(trackEvent).toHaveBeenCalledOnce();
  });

  it('reports nothing when no checkout was started in this tab', () => {
    trackCheckoutCompleted();

    expect(trackEvent).not.toHaveBeenCalled();
  });
});
