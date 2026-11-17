import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CONSENT_ID_COOKIE } from './consent';
import { recordCookieConsentChoice } from './consent-record';

const { recordCookieConsent } = vi.hoisted(() => ({ recordCookieConsent: vi.fn() }));

vi.mock('@/features/legal/dal/commands', () => ({ recordCookieConsent }));

const consentId = () =>
  document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${CONSENT_ID_COOKIE}=`))
    ?.split('=')[1];

beforeEach(() => {
  vi.clearAllMocks();
  recordCookieConsent.mockResolvedValue([null, { success: true }]);
  document.cookie = `${CONSENT_ID_COOKIE}=; max-age=0; path=/`;
});

describe('recordCookieConsentChoice', () => {
  it('gives the browser a random consent ID and records the choice with its source', () => {
    recordCookieConsentChoice('Banner');

    expect(consentId()).toMatch(/^[0-9a-f-]{36}$/);
    expect(recordCookieConsent).toHaveBeenCalledWith('Banner');
  });

  it('keeps the same ID for later choices, so all records link to one browser', () => {
    recordCookieConsentChoice('Banner');
    const first = consentId();

    recordCookieConsentChoice('Preferences');

    expect(consentId()).toBe(first);
    expect(recordCookieConsent).toHaveBeenLastCalledWith('Preferences');
  });

  it('does not throw when recording fails, as the choice already works from its cookies', async () => {
    recordCookieConsent.mockRejectedValue(new Error('network'));

    expect(() => recordCookieConsentChoice('Account')).not.toThrow();
    // Let the rejected promise settle inside the helper
    await Promise.resolve();
  });
});
