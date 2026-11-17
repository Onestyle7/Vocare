// @vitest-environment node

import { err, ok } from 'neverthrow';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { COOKIE_CONSENT_TEXT_VERSION } from '@/features/marketing/constants/legal';

import { recordCookieConsent } from '../dal/commands';

const CONSENT_ID = '0b9e6c2e-6f0a-4c39-9a51-2f7c1f0f4b11';

const mocks = vi.hoisted(() => ({
  cookies: new Map<string, string>(),
  recordCookieConsentService: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      mocks.cookies.has(name) ? { name, value: mocks.cookies.get(name) } : undefined,
  })),
}));

vi.mock('@/features/auth/auth-cookie', () => ({ AUTH_COOKIE_OPTIONS: {} }));
vi.mock('@/lib/tags', () => ({ invalidateUserTag: vi.fn() }));
vi.mock('../dal/services', () => ({
  recordCookieConsentService: mocks.recordCookieConsentService,
}));

const setCookies = (values: Record<string, string>) => {
  mocks.cookies.clear();
  Object.entries(values).forEach(([name, value]) => mocks.cookies.set(name, value));
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('recordCookieConsent', () => {
  it('records the choices the browser holds, with the consent ID, source and text version', async () => {
    setCookies({ consent_id: CONSENT_ID, cookie_consent: 'denied', ads_consent: 'granted' });
    mocks.recordCookieConsentService.mockResolvedValue(ok(undefined));

    const [error] = await recordCookieConsent('Banner');

    expect(error).toBeNull();
    expect(mocks.recordCookieConsentService).toHaveBeenCalledWith({
      consentId: CONSENT_ID,
      analyticsGranted: false,
      adsGranted: true,
      source: 'Banner',
      textVersion: COOKIE_CONSENT_TEXT_VERSION,
    });
  });

  it('records a choice not made yet as no consent', async () => {
    setCookies({ consent_id: CONSENT_ID, cookie_consent: 'granted' });
    mocks.recordCookieConsentService.mockResolvedValue(ok(undefined));

    await recordCookieConsent('Preferences');

    expect(mocks.recordCookieConsentService).toHaveBeenCalledWith(
      expect.objectContaining({ analyticsGranted: true, adsGranted: false, source: 'Preferences' })
    );
  });

  it.each([
    ['without a consent ID', {}, 'Banner'],
    ['with a malformed consent ID', { consent_id: 'not-a-uuid' }, 'Banner'],
    ['with an unknown source', { consent_id: CONSENT_ID }, 'Elsewhere'],
  ])('sends nothing %s', async (_, values, source) => {
    setCookies(values);

    const [error] = await recordCookieConsent(source as 'Banner');

    expect(error?.type).toBe('GenericApiError');
    expect(mocks.recordCookieConsentService).not.toHaveBeenCalled();
  });

  it('passes on an API failure as an error, without throwing', async () => {
    setCookies({ consent_id: CONSENT_ID, ads_consent: 'denied' });
    mocks.recordCookieConsentService.mockResolvedValue(
      err({ type: 'GenericApiError', message: 'Nie udało się zapisać' })
    );

    const [error] = await recordCookieConsent('Account');

    expect(error?.type).toBe('GenericApiError');
  });
});
