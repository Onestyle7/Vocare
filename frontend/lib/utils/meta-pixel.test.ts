import { beforeEach, describe, expect, it } from 'vitest';

import { ADS_CONSENT_KEY } from './consent';
import { getMetaPixelScript } from './meta-pixel';

const PIXEL_ID = '123456789';

const runBaseCode = () => new Function(getMetaPixelScript(PIXEL_ID))();
const sdkScripts = () => document.querySelectorAll('script[src*="connect.facebook.net"]');
const queuedCalls = () =>
  (window.fbq as unknown as { queue: IArguments[] }).queue.map((args) => Array.from(args));

beforeEach(() => {
  document.cookie = `${ADS_CONSENT_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.head.innerHTML = '<script></script>';
  delete window.fbq;
  delete window.loadMetaPixel;
  Reflect.deleteProperty(window, '_fbq');
});

describe('getMetaPixelScript', () => {
  it('should not load the SDK when the consent cookie is missing', () => {
    runBaseCode();

    expect(sdkScripts()).toHaveLength(0);
    expect(queuedCalls()).toEqual([['init', PIXEL_ID]]);
  });

  it('should not load the SDK when consent is denied', () => {
    document.cookie = `${ADS_CONSENT_KEY}=denied`;

    runBaseCode();

    expect(sdkScripts()).toHaveLength(0);
    expect(queuedCalls()).toEqual([['init', PIXEL_ID]]);
  });

  it('should load the SDK and queue a page view after init when consent is granted', () => {
    document.cookie = `${ADS_CONSENT_KEY}=granted`;

    runBaseCode();

    expect(sdkScripts()).toHaveLength(1);
    expect(queuedCalls()).toEqual([
      ['init', PIXEL_ID],
      ['track', 'PageView'],
    ]);
  });

  it('should load the SDK only once when consent is given after page load', () => {
    runBaseCode();

    window.loadMetaPixel?.();
    window.loadMetaPixel?.();

    expect(sdkScripts()).toHaveLength(1);
    expect(queuedCalls().filter(([, event]) => event === 'PageView')).toHaveLength(1);
  });
});
