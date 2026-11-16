import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ADS_CONSENT_KEY, COOKIE_CONSENT_KEY, updateAdsConsent } from './consent';
import { getMetaPixelScript } from './meta-pixel';
import { getTikTokPixelScript } from './tiktok-pixel';
import { trackEvent } from './tracking';

const details = { id: 'price_tokens', name: 'Tokeny', value: 19, currency: 'PLN' };

const installMocks = () => {
  const ttq = { grantConsent: vi.fn(), revokeConsent: vi.fn(), track: vi.fn() };
  const fbq = vi.fn();
  const gtag = vi.fn();
  window.ttq = ttq;
  window.fbq = fbq;
  window.gtag = gtag;
  return { ttq, fbq, gtag };
};

const grantAnalytics = () => {
  document.cookie = `${COOKIE_CONSENT_KEY}=granted`;
};

beforeEach(() => {
  document.cookie = `${ADS_CONSENT_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.cookie = `${COOKIE_CONSENT_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.head.innerHTML = '<script></script>';
  delete window.ttq;
  delete window.fbq;
  delete window.gtag;
  delete window.loadTikTokPixel;
  delete window.loadMetaPixel;
  Reflect.deleteProperty(window, '_fbq');
});

describe('trackEvent', () => {
  it('should send the event to GA4 and both pixels in their own formats, under one event ID', () => {
    document.cookie = `${ADS_CONSENT_KEY}=granted`;
    grantAnalytics();
    const { ttq, fbq, gtag } = installMocks();

    trackEvent('Purchase', details);

    const [, , { event_id: eventId }] = ttq.track.mock.calls[0];
    expect(eventId).toEqual(expect.any(String));
    expect(ttq.track).toHaveBeenCalledWith(
      'Purchase',
      {
        contents: [{ content_id: 'price_tokens', content_type: 'product', content_name: 'Tokeny' }],
        value: 19,
        currency: 'PLN',
      },
      { event_id: eventId }
    );
    expect(fbq).toHaveBeenCalledWith(
      'track',
      'Purchase',
      {
        content_ids: ['price_tokens'],
        content_type: 'product',
        content_name: 'Tokeny',
        value: 19,
        currency: 'PLN',
      },
      { eventID: eventId }
    );
    expect(gtag).toHaveBeenCalledWith('event', 'purchase', {
      currency: 'PLN',
      value: 19,
      items: [{ item_id: 'price_tokens', item_name: 'Tokeny', price: 19, quantity: 1 }],
      transaction_id: eventId,
    });
  });

  it('should give every event its own ID', () => {
    const { ttq } = installMocks();

    trackEvent('CompleteRegistration');
    trackEvent('CompleteRegistration');

    const [first, second] = ttq.track.mock.calls.map(([, , options]) => options.event_id);
    expect(first).not.toBe(second);
  });

  it('should use a Stripe session as the one ID of the purchase in GA4 and both pixels', () => {
    document.cookie = `${ADS_CONSENT_KEY}=granted`;
    grantAnalytics();
    const { ttq, fbq, gtag } = installMocks();

    trackEvent('Purchase', { ...details, transactionId: 'cs_test_123' });

    expect(gtag).toHaveBeenCalledWith(
      'event',
      'purchase',
      expect.objectContaining({ transaction_id: 'cs_test_123' })
    );
    expect(ttq.track).toHaveBeenCalledWith('Purchase', expect.any(Object), {
      event_id: 'cs_test_123',
    });
    expect(fbq).toHaveBeenCalledWith('track', 'Purchase', expect.any(Object), {
      eventID: 'cs_test_123',
    });
    // The ID identifies the event; it is not sent as a product parameter
    expect(JSON.stringify(ttq.track.mock.calls[0][1])).not.toContain('cs_test_123');
  });

  it('should add a transaction ID to GA4 purchases only', () => {
    grantAnalytics();
    const { gtag } = installMocks();

    trackEvent('InitiateCheckout', details);

    expect(gtag).toHaveBeenCalledWith('event', 'begin_checkout', {
      currency: 'PLN',
      value: 19,
      items: [{ item_id: 'price_tokens', item_name: 'Tokeny', price: 19, quantity: 1 }],
    });
  });

  it('should send tool usage with the tool name only, as a custom event in Meta', () => {
    grantAnalytics();
    const { ttq, fbq, gtag } = installMocks();

    trackEvent('ToolUsed', { toolName: 'salary_calculator' });

    const params = { tool_name: 'salary_calculator' };
    expect(gtag).toHaveBeenCalledWith('event', 'tool_used', params);
    expect(ttq.track).toHaveBeenCalledWith('ToolUsed', params, { event_id: expect.any(String) });
    expect(fbq).toHaveBeenCalledWith('trackCustom', 'ToolUsed', params, {
      eventID: expect.any(String),
    });
  });

  it('should send a CV export to GA4 under its own name and to Meta as a custom event', () => {
    grantAnalytics();
    const { ttq, fbq, gtag } = installMocks();

    trackEvent('Download');

    expect(gtag).toHaveBeenCalledWith('event', 'cv_export', {});
    expect(ttq.track).toHaveBeenCalledWith('Download', {}, { event_id: expect.any(String) });
    expect(fbq).toHaveBeenCalledWith(
      'trackCustom',
      'Download',
      {},
      { eventID: expect.any(String) }
    );
  });

  it('should leave the pricing view to the automatic GA4 page_view', () => {
    grantAnalytics();
    const { ttq, gtag } = installMocks();

    trackEvent('ViewContent');

    expect(gtag).not.toHaveBeenCalled();
    expect(ttq.track).toHaveBeenCalledWith('ViewContent', {}, { event_id: expect.any(String) });
  });

  it('should drop the pixel events but still send to GA4 when only ads consent is denied', () => {
    document.cookie = `${ADS_CONSENT_KEY}=denied`;
    grantAnalytics();
    const { ttq, fbq, gtag } = installMocks();

    trackEvent('Purchase', details);

    expect(ttq.track).not.toHaveBeenCalled();
    expect(fbq).not.toHaveBeenCalled();
    expect(gtag).toHaveBeenCalledWith('event', 'purchase', expect.any(Object));
  });

  it.each([
    ['before the analytics decision', null],
    ['after analytics consent is denied', 'denied'],
  ])('should send nothing to GA4 %s, while the pixels follow their own consent', (_, choice) => {
    if (choice) document.cookie = `${COOKIE_CONSENT_KEY}=${choice}`;
    document.cookie = `${ADS_CONSENT_KEY}=granted`;
    const { ttq, gtag } = installMocks();

    trackEvent('Purchase', details);

    expect(gtag).not.toHaveBeenCalled();
    expect(ttq.track).toHaveBeenCalledWith('Purchase', expect.any(Object), {
      event_id: expect.any(String),
    });
  });

  it('should keep the event in the page without loading either SDK before a cookie decision', () => {
    new Function(getTikTokPixelScript('TT_ID'))();
    new Function(getMetaPixelScript('META_ID'))();

    trackEvent('CompleteRegistration');

    expect(document.querySelectorAll('script[src]')).toHaveLength(0);
    expect(window.ttq as unknown as unknown[][]).toContainEqual([
      'track',
      'CompleteRegistration',
      {},
      { event_id: expect.any(String) },
    ]);
    const metaQueue = (window.fbq as unknown as { queue: IArguments[] }).queue.map((args) =>
      Array.from(args)
    );
    expect(metaQueue).toContainEqual([
      'track',
      'CompleteRegistration',
      {},
      { eventID: expect.any(String) },
    ]);
  });

  describe('events waiting for the advertising decision', () => {
    const runPixelBaseCode = () => {
      new Function(getTikTokPixelScript('TT_ID'))();
      new Function(getMetaPixelScript('META_ID'))();
    };
    const tiktokQueue = () => window.ttq as unknown as unknown[][];
    const metaQueue = () =>
      (window.fbq as unknown as { queue: IArguments[] }).queue.map((args) => Array.from(args));
    const mentionsRegistration = (entry: unknown[]) => entry.includes('CompleteRegistration');

    it('should go out when the visitor accepts later on the same page', () => {
      runPixelBaseCode();
      trackEvent('CompleteRegistration');

      updateAdsConsent(true);

      expect(tiktokQueue().some(mentionsRegistration)).toBe(true);
      expect(metaQueue().some(mentionsRegistration)).toBe(true);
    });

    it('should be dropped on refusal, so a later consent on the page sends none of them', () => {
      runPixelBaseCode();
      trackEvent('CompleteRegistration');

      updateAdsConsent(false);
      updateAdsConsent(true);

      expect(tiktokQueue().some(mentionsRegistration)).toBe(false);
      expect(metaQueue().some(mentionsRegistration)).toBe(false);
      // The pixels still start configured as intended
      expect(metaQueue()).toEqual(
        expect.arrayContaining([
          ['set', 'autoConfig', false, 'META_ID'],
          ['init', 'META_ID'],
        ])
      );
    });
  });

  it('should not throw when no tool is installed', () => {
    expect(() => trackEvent('CompleteRegistration')).not.toThrow();
  });

  it('should send nothing anywhere when both consents are refused', () => {
    document.cookie = `${COOKIE_CONSENT_KEY}=denied`;
    document.cookie = `${ADS_CONSENT_KEY}=denied`;
    const { ttq, fbq, gtag } = installMocks();

    trackEvent('CompleteRegistration');

    expect(gtag).not.toHaveBeenCalled();
    expect(ttq.track).not.toHaveBeenCalled();
    expect(fbq).not.toHaveBeenCalled();
  });
});
