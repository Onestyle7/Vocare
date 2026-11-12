import { beforeEach, describe, expect, it, vi } from 'vitest';

import { trackCheckoutCompleted, trackCheckoutStarted } from '@/features/billing/checkoutTracking';

const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));

vi.mock('@/lib/utils/tracking', () => ({ trackEvent }));

const tokens = { priceId: 'price_tokens', name: 'Tokeny', value: 14.25, isTrial: false };
const trial = { priceId: 'price_premium', name: 'Premium', value: 29, isTrial: true };

describe('checkoutTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
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
