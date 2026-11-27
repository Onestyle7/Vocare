import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TrialOfferBanner } from '@/features/billing/components/TrialOfferBanner';
import {
  getSnoozeDays,
  isSnoozed,
  nextSnooze,
  parseSnooze,
  TRIAL_OFFER_SNOOZE_KEY,
} from '@/features/billing/trialOfferSnooze';
import type { SubscriptionStatuses } from '@/features/billing/types';
import { COOKIE_CONSENT_KEY } from '@/lib/utils/consent';

const tracking = vi.hoisted(() => ({ trackEvent: vi.fn() }));

vi.mock('@/lib/utils/tracking', () => tracking);

vi.mock('@/lib/env/client', () => ({
  default: {
    NEXT_PUBLIC_PERSONAL_PRICE_ID: 'price_test_500_tokens',
    NEXT_PUBLIC_GROWTH_PRICE_ID: 'price_test_premium_monthly',
    NEXT_PUBLIC_GROWTH_QUARTERLY_PRICE_ID: 'price_test_premium_quarterly',
  },
}));

// Node's experimental localStorage shadows jsdom's one and is undefined without a file
const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, String(value)),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
  },
  writable: true,
});

const DAY_MS = 24 * 60 * 60 * 1000;
const DELAY_MS = 20_000;

const answerCookieBanner = () => {
  document.cookie = `${COOKIE_CONSENT_KEY}=1; path=/`;
};

const clearCookies = () => {
  document.cookie = `${COOKIE_CONSENT_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

const renderBanner = (
  props: { trialDays?: number | null; subscriptionStatus?: SubscriptionStatuses } = {}
) =>
  render(
    <TrialOfferBanner
      trialDays={props.trialDays === undefined ? 14 : props.trialDays}
      subscriptionStatus={props.subscriptionStatus ?? 'None'}
      delayMs={DELAY_MS}
    />
  );

const offer = () => screen.queryByRole('complementary', { hidden: true });

const isShown = () => offer()?.getAttribute('aria-hidden') === 'false';

describe('trial offer snooze schedule', () => {
  it('hides the offer for 1 day, then 2, then a week for every later dismissal', () => {
    expect([1, 2, 3, 4, 10].map(getSnoozeDays)).toEqual([1, 2, 7, 7, 7]);
  });

  it('counts dismissals and keeps the offer hidden only until the snooze ends', () => {
    const first = nextSnooze(null, 0);
    expect(first).toEqual({ dismissCount: 1, hiddenUntil: DAY_MS });
    expect(isSnoozed(first, DAY_MS - 1)).toBe(true);
    expect(isSnoozed(first, DAY_MS)).toBe(false);

    const second = nextSnooze(first, DAY_MS);
    expect(second).toEqual({ dismissCount: 2, hiddenUntil: 3 * DAY_MS });
  });

  it('treats a missing or corrupted stored value as never dismissed', () => {
    expect(parseSnooze(null)).toBeNull();
    expect(parseSnooze('{not json')).toBeNull();
    expect(parseSnooze('{"dismissCount":"1"}')).toBeNull();
    expect(isSnoozed(null, Date.now())).toBe(false);
  });
});

describe('TrialOfferBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    answerCookieBanner();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    clearCookies();
    tracking.trackEvent.mockReset();
  });

  it('appears after the delay for a user who can start a trial, with the price after it', () => {
    renderBanner();
    expect(isShown()).toBe(false);

    act(() => vi.advanceTimersByTime(DELAY_MS));

    expect(isShown()).toBe(true);
    expect(screen.getByRole('link', { name: 'Testuj 14 dni za darmo' })).toHaveProperty(
      'pathname',
      '/pricing'
    );
    expect(screen.getByText(/potem 29 zł\/miesiąc, odnawiane automatycznie/)).toBeTruthy();
    expect(tracking.trackEvent).toHaveBeenCalledWith('TrialOfferView');
  });

  it.each([
    ['an active subscriber', { subscriptionStatus: 'Active' as const }],
    ['a user already on a trial', { subscriptionStatus: 'Trialing' as const }],
    ['a user who is not eligible for a trial', { trialDays: null }],
  ])('is never shown to %s', (_, props) => {
    renderBanner(props);
    act(() => vi.advanceTimersByTime(DELAY_MS));

    expect(offer()).toBeNull();
  });

  it('waits until the cookie banner is answered', () => {
    clearCookies();
    renderBanner();
    act(() => vi.advanceTimersByTime(DELAY_MS));
    expect(isShown()).toBe(false);

    answerCookieBanner();
    act(() => fireEvent.click(document.body));

    expect(isShown()).toBe(true);
  });

  it('hides on dismissal and stays hidden for a day', () => {
    vi.setSystemTime(0);
    renderBanner();
    act(() => vi.advanceTimersByTime(DELAY_MS));

    fireEvent.click(screen.getByRole('button', { name: 'Zamknij ofertę' }));

    expect(offer()).toBeNull();
    expect(tracking.trackEvent).toHaveBeenCalledWith('TrialOfferDismiss');
    expect(parseSnooze(window.localStorage.getItem(TRIAL_OFFER_SNOOZE_KEY))).toEqual({
      dismissCount: 1,
      hiddenUntil: DELAY_MS + DAY_MS,
    });

    cleanup();
    vi.setSystemTime(DAY_MS);
    renderBanner();
    act(() => vi.advanceTimersByTime(DELAY_MS));
    expect(offer()).toBeNull();
  });

  it('comes back once the snooze has ended', () => {
    window.localStorage.setItem(
      TRIAL_OFFER_SNOOZE_KEY,
      JSON.stringify({ dismissCount: 1, hiddenUntil: Date.now() - 1 })
    );
    renderBanner();
    act(() => vi.advanceTimersByTime(DELAY_MS));

    expect(isShown()).toBe(true);
  });

  it('snoozes after a click on the offer too, so it does not return right after checkout', () => {
    renderBanner();
    act(() => vi.advanceTimersByTime(DELAY_MS));

    fireEvent.click(screen.getByRole('link', { name: 'Testuj 14 dni za darmo' }));

    expect(tracking.trackEvent).toHaveBeenCalledWith('TrialOfferClick');
    expect(parseSnooze(window.localStorage.getItem(TRIAL_OFFER_SNOOZE_KEY))?.dismissCount).toBe(1);
  });
});
