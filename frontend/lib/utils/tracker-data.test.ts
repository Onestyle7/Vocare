import { beforeEach, describe, expect, it } from 'vitest';

import {
  ADS_CONSENT_KEY,
  clearRefusedTrackerData,
  COOKIE_CONSENT_KEY,
  updateAdsConsent,
  updateAnalyticsConsent,
} from './consent';
import { getCookieDomains, NEW_OAUTH_USER_COOKIE, PENDING_CHECKOUT_KEY } from './tracker-data';

// Names as seen in Chromium after accepting everything (plus TikTok's ttcsid)
const GA_COOKIES = ['_ga', '_ga_HJB398K2LX'];
const AD_COOKIES = ['_fbp', '_fbc', '_ttp', '_tt_enable_cookie', 'ttclid', 'ttcsid_ABC'];
const AD_LOCAL_STORAGE = ['multiFbc', 'lastExternalReferrer', 'lastExternalReferrerTime'];
const AD_SESSION_STORAGE = ['tt_adInfo', 'tt_appInfo', 'tt_pixel_session_index', 'tt_sessionId'];
// Our own data, unrelated to tracking, which no withdrawal may touch
const OWN_KEY = 'own_draft';

const cookieNames = () =>
  document.cookie
    .split(';')
    .map((entry) => entry.split('=')[0].trim())
    .filter(Boolean);

const setCookies = (names: string[], value = '1') =>
  names.forEach((name) => {
    document.cookie = `${name}=${value}; path=/`;
  });

const helpersPresent = () => ({
  cookie: cookieNames().includes(NEW_OAUTH_USER_COOKIE),
  storage: sessionStorage.getItem(PENDING_CHECKOUT_KEY) !== null,
});

beforeEach(() => {
  cookieNames().forEach((name) => {
    document.cookie = `${name}=; max-age=0; path=/`;
  });
  localStorage.clear();
  sessionStorage.clear();

  setCookies([...GA_COOKIES, ...AD_COOKIES, NEW_OAUTH_USER_COOKIE, OWN_KEY]);
  [...AD_LOCAL_STORAGE, OWN_KEY].forEach((key) => localStorage.setItem(key, '1'));
  [...AD_SESSION_STORAGE, PENDING_CHECKOUT_KEY, OWN_KEY].forEach((key) =>
    sessionStorage.setItem(key, '1')
  );
});

describe('withdrawing consent', () => {
  it('removes only the Google Analytics cookies when analytics consent is withdrawn', () => {
    updateAnalyticsConsent(false);

    expect(cookieNames().filter((name) => GA_COOKIES.includes(name))).toEqual([]);
    expect(cookieNames()).toEqual(expect.arrayContaining([...AD_COOKIES, OWN_KEY]));
    expect(Object.keys(localStorage)).toHaveLength(AD_LOCAL_STORAGE.length + 1);
  });

  it("removes the pixels' cookies and storage, and none of our own data", () => {
    updateAdsConsent(false);

    expect(cookieNames().filter((name) => AD_COOKIES.includes(name))).toEqual([]);
    expect(cookieNames()).toEqual(
      expect.arrayContaining([...GA_COOKIES, OWN_KEY, ADS_CONSENT_KEY])
    );
    expect(Object.keys(localStorage)).toEqual([OWN_KEY]);
    expect(Object.keys(sessionStorage).filter((key) => AD_SESSION_STORAGE.includes(key))).toEqual(
      []
    );
    expect(sessionStorage.getItem(OWN_KEY)).toBe('1');
  });

  it('removes nothing when consent is given', () => {
    updateAnalyticsConsent(true);
    updateAdsConsent(true);

    expect(cookieNames()).toEqual(
      expect.arrayContaining([...GA_COOKIES, ...AD_COOKIES, NEW_OAUTH_USER_COOKIE])
    );
    expect(Object.keys(localStorage)).toHaveLength(AD_LOCAL_STORAGE.length + 1);
    expect(Object.keys(sessionStorage)).toHaveLength(AD_SESSION_STORAGE.length + 2);
  });
});

describe('measurement helpers', () => {
  it('stay while at least one tool is still accepted', () => {
    setCookies([COOKIE_CONSENT_KEY], 'granted');

    updateAdsConsent(false);

    expect(helpersPresent()).toEqual({ cookie: true, storage: true });
  });

  it('are removed once no tool is accepted any more', () => {
    setCookies([COOKIE_CONSENT_KEY, ADS_CONSENT_KEY], 'granted');

    updateAnalyticsConsent(false);
    expect(helpersPresent()).toEqual({ cookie: true, storage: true });

    updateAdsConsent(false);
    expect(helpersPresent()).toEqual({ cookie: false, storage: false });
    expect(sessionStorage.getItem(OWN_KEY)).toBe('1');
  });
});

describe('clearRefusedTrackerData', () => {
  it('cleans up after a tool refused earlier, leaving the accepted one', () => {
    setCookies([COOKIE_CONSENT_KEY], 'denied');
    setCookies([ADS_CONSENT_KEY], 'granted');

    clearRefusedTrackerData();

    expect(cookieNames().filter((name) => GA_COOKIES.includes(name))).toEqual([]);
    expect(cookieNames()).toEqual(expect.arrayContaining(AD_COOKIES));
    expect(helpersPresent()).toEqual({ cookie: true, storage: true });
  });

  it("leaves the tools' data alone before the visitor decides", () => {
    clearRefusedTrackerData();

    expect(cookieNames()).toEqual(expect.arrayContaining([...GA_COOKIES, ...AD_COOKIES]));
    expect(Object.keys(sessionStorage)).toEqual(expect.arrayContaining(AD_SESSION_STORAGE));
  });
});

describe('getCookieDomains', () => {
  it.each([
    ['localhost', [undefined]],
    ['vocare.pl', [undefined, 'vocare.pl']],
    ['www.vocare.pl', [undefined, 'www.vocare.pl', 'vocare.pl']],
  ])('covers %s and its parent domains, without the top-level one', (hostname, domains) => {
    expect(getCookieDomains(hostname)).toEqual(domains);
  });
});
