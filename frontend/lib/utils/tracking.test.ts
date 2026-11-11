import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ADS_CONSENT_KEY } from './consent';
import { getMetaPixelScript } from './meta-pixel';
import { getTikTokPixelScript } from './tiktok-pixel';
import { trackConversion } from './tracking';

const details = { id: 'price_tokens', name: 'Tokeny', value: 19, currency: 'PLN' };

const installPixelMocks = () => {
  const ttq = { grantConsent: vi.fn(), revokeConsent: vi.fn(), track: vi.fn() };
  const fbq = vi.fn();
  window.ttq = ttq;
  window.fbq = fbq;
  return { ttq, fbq };
};

beforeEach(() => {
  document.cookie = `${ADS_CONSENT_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.head.innerHTML = '<script></script>';
  delete window.ttq;
  delete window.fbq;
  delete window.loadTikTokPixel;
  delete window.loadMetaPixel;
  Reflect.deleteProperty(window, '_fbq');
});

describe('trackConversion', () => {
  it('should send the event to both pixels in their own parameter formats', () => {
    document.cookie = `${ADS_CONSENT_KEY}=granted`;
    const { ttq, fbq } = installPixelMocks();

    trackConversion('Purchase', details);

    expect(ttq.track).toHaveBeenCalledWith('Purchase', {
      contents: [{ content_id: 'price_tokens', content_type: 'product', content_name: 'Tokeny' }],
      value: 19,
      currency: 'PLN',
    });
    expect(fbq).toHaveBeenCalledWith('track', 'Purchase', {
      content_ids: ['price_tokens'],
      content_type: 'product',
      content_name: 'Tokeny',
      value: 19,
      currency: 'PLN',
    });
  });

  it('should send a download to Meta as a custom event', () => {
    const { ttq, fbq } = installPixelMocks();

    trackConversion('Download');

    expect(ttq.track).toHaveBeenCalledWith('Download', undefined);
    expect(fbq).toHaveBeenCalledWith('trackCustom', 'Download', undefined);
  });

  it('should drop the event when consent is denied', () => {
    document.cookie = `${ADS_CONSENT_KEY}=denied`;
    const { ttq, fbq } = installPixelMocks();

    trackConversion('Purchase', details);

    expect(ttq.track).not.toHaveBeenCalled();
    expect(fbq).not.toHaveBeenCalled();
  });

  it('should keep the event in the page without loading either SDK before a cookie decision', () => {
    new Function(getTikTokPixelScript('TT_ID'))();
    new Function(getMetaPixelScript('META_ID'))();

    trackConversion('CompleteRegistration');

    expect(document.querySelectorAll('script[src]')).toHaveLength(0);
    expect(window.ttq as unknown as unknown[][]).toContainEqual([
      'track',
      'CompleteRegistration',
      undefined,
    ]);
    const metaQueue = (window.fbq as unknown as { queue: IArguments[] }).queue.map((args) =>
      Array.from(args)
    );
    expect(metaQueue).toContainEqual(['track', 'CompleteRegistration', undefined]);
  });

  it('should not throw when no pixel is installed', () => {
    expect(() => trackConversion('CompleteRegistration')).not.toThrow();
  });
});
