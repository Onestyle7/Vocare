import { beforeEach, describe, expect, it } from 'vitest';

import { ADS_CONSENT_KEY } from './consent';
import { getTikTokPixelScript } from './tiktok-pixel';

const PIXEL_ID = 'TEST_PIXEL_ID';

const runBaseCode = () => new Function(getTikTokPixelScript(PIXEL_ID))();
const sdkScripts = () => document.querySelectorAll('script[src*="analytics.tiktok.com"]');
const queuedPageViews = () =>
  (window.ttq as unknown as unknown[][]).filter(([method]) => method === 'page');

beforeEach(() => {
  document.cookie = `${ADS_CONSENT_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.head.innerHTML = '<script></script>';
  delete window.ttq;
  delete window.loadTikTokPixel;
});

describe('getTikTokPixelScript', () => {
  it('should not load the SDK when the consent cookie is missing', () => {
    runBaseCode();

    expect(sdkScripts()).toHaveLength(0);
    expect(queuedPageViews()).toHaveLength(0);
  });

  it('should not load the SDK when consent is denied', () => {
    document.cookie = `${ADS_CONSENT_KEY}=denied`;

    runBaseCode();

    expect(sdkScripts()).toHaveLength(0);
    expect(queuedPageViews()).toHaveLength(0);
  });

  it('should load the SDK and queue a page view when consent is granted', () => {
    document.cookie = `${ADS_CONSENT_KEY}=granted`;

    runBaseCode();

    expect(sdkScripts()).toHaveLength(1);
    expect(sdkScripts()[0].getAttribute('src')).toContain(`sdkid=${PIXEL_ID}`);
    expect(queuedPageViews()).toHaveLength(1);
  });

  it('should load the SDK only once when consent is given after page load', () => {
    runBaseCode();

    window.loadTikTokPixel?.();
    window.loadTikTokPixel?.();

    expect(sdkScripts()).toHaveLength(1);
    expect(queuedPageViews()).toHaveLength(1);
  });
});
