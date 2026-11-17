import { beforeEach, describe, expect, it } from 'vitest';

import { COOKIE_CONSENT_KEY } from './consent';
import { getGoogleAnalyticsScript } from './google-analytics';

const GA_ID = 'G-TEST123';
const DISABLE_KEY = `ga-disable-${GA_ID}`;

const runScript = () => new Function(getGoogleAnalyticsScript(GA_ID))();
const dataLayer = () => (window.dataLayer ?? []).map((args) => Array.from(args as IArguments));
const gtagScripts = () =>
  document.querySelectorAll('script[src^="https://www.googletagmanager.com/gtag/js"]');
const isDisabled = () => Reflect.get(window, DISABLE_KEY);

beforeEach(() => {
  document.cookie = `${COOKIE_CONSENT_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.head.innerHTML = '';
  delete window.dataLayer;
  delete window.gtag;
  delete window.loadGoogleAnalytics;
  delete window.disableGoogleAnalytics;
  Reflect.deleteProperty(window, DISABLE_KEY);
});

describe('getGoogleAnalyticsScript', () => {
  it('loads nothing and only sets the denied defaults before analytics consent', () => {
    runScript();

    expect(gtagScripts()).toHaveLength(0);
    expect(dataLayer()).toEqual([
      [
        'consent',
        'default',
        {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
        },
      ],
    ]);
  });

  it('loads gtag.js and configures GA4 on a page opened with analytics consent', () => {
    document.cookie = `${COOKIE_CONSENT_KEY}=granted`;

    runScript();

    expect(gtagScripts()).toHaveLength(1);
    expect(gtagScripts()[0].getAttribute('src')).toBe(
      `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
    );
    const commands = dataLayer().map(([command, action]) => [command, action]);
    expect(commands).toEqual([
      ['consent', 'default'],
      ['consent', 'update'],
      ['js', expect.any(Date)],
      ['config', GA_ID],
    ]);
    expect(dataLayer()[1]).toEqual(['consent', 'update', { analytics_storage: 'granted' }]);
    // 13 months, as the privacy policy says, instead of GA4's default 2 years
    expect(dataLayer()[3]).toEqual(['config', GA_ID, { cookie_expires: 395 * 24 * 60 * 60 }]);
  });

  it('loads gtag.js once, however many times consent is given on the page', () => {
    runScript();

    window.loadGoogleAnalytics?.();
    window.loadGoogleAnalytics?.();

    expect(gtagScripts()).toHaveLength(1);
    expect(dataLayer().filter(([command]) => command === 'config')).toHaveLength(1);
  });

  it('stops sending when consent is withdrawn and resumes when it is given again', () => {
    document.cookie = `${COOKIE_CONSENT_KEY}=granted`;
    runScript();

    window.disableGoogleAnalytics?.();

    expect(isDisabled()).toBe(true);
    expect(dataLayer().at(-1)).toEqual(['consent', 'update', { analytics_storage: 'denied' }]);

    window.loadGoogleAnalytics?.();

    expect(isDisabled()).toBe(false);
    expect(gtagScripts()).toHaveLength(1);
  });
});
