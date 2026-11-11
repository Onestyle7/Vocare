import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADS_CONSENT_KEY,
  COOKIE_CONSENT_KEY,
  getAdsConsent,
  getAnalyticsConsent,
  updateAdsConsent,
  updateAnalyticsConsent,
} from './consent';

const clearCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

const installPixels = () => {
  window.ttq = { grantConsent: vi.fn(), revokeConsent: vi.fn(), track: vi.fn() };
  window.loadTikTokPixel = vi.fn();
  window.fbq = vi.fn();
  window.loadMetaPixel = vi.fn();
};

describe('consent utils', () => {
  beforeEach(() => {
    clearCookie(COOKIE_CONSENT_KEY);
    clearCookie(ADS_CONSENT_KEY);
    delete window.gtag;
    delete window.ttq;
    delete window.loadTikTokPixel;
    delete window.fbq;
    delete window.loadMetaPixel;
  });

  describe('getAnalyticsConsent', () => {
    it('should return false when consent cookie is missing', () => {
      expect(getAnalyticsConsent()).toBe(false);
    });

    it('should return true when consent cookie is granted', () => {
      document.cookie = `${COOKIE_CONSENT_KEY}=granted`;
      expect(getAnalyticsConsent()).toBe(true);
    });

    it('should return false when consent cookie is denied', () => {
      document.cookie = `${COOKIE_CONSENT_KEY}=denied`;
      expect(getAnalyticsConsent()).toBe(false);
    });
  });

  describe('updateAnalyticsConsent', () => {
    it('should set granted cookie and call window.gtag', () => {
      window.gtag = vi.fn();

      updateAnalyticsConsent('granted');

      expect(document.cookie).toContain(`${COOKIE_CONSENT_KEY}=granted`);
      expect(window.gtag).toHaveBeenCalledWith('consent', 'update', {
        analytics_storage: 'granted',
      });
    });

    it('should set denied cookie when boolean false is passed', () => {
      window.gtag = vi.fn();

      updateAnalyticsConsent(false);

      expect(document.cookie).toContain(`${COOKIE_CONSENT_KEY}=denied`);
      expect(window.gtag).toHaveBeenCalledWith('consent', 'update', {
        analytics_storage: 'denied',
      });
    });

    it('should set granted cookie when boolean true is passed', () => {
      window.gtag = vi.fn();

      updateAnalyticsConsent(true);

      expect(document.cookie).toContain(`${COOKIE_CONSENT_KEY}=granted`);
      expect(window.gtag).toHaveBeenCalledWith('consent', 'update', {
        analytics_storage: 'granted',
      });
    });

    it('should set denied cookie when string denied is passed', () => {
      window.gtag = vi.fn();

      updateAnalyticsConsent('denied');

      expect(document.cookie).toContain(`${COOKIE_CONSENT_KEY}=denied`);
      expect(window.gtag).toHaveBeenCalledWith('consent', 'update', {
        analytics_storage: 'denied',
      });
    });

    it('should not throw error when window.gtag is undefined', () => {
      expect(() => updateAnalyticsConsent('granted')).not.toThrow();
      expect(document.cookie).toContain(`${COOKIE_CONSENT_KEY}=granted`);
    });

    it('should leave the advertising choice and pixels untouched', () => {
      installPixels();

      updateAnalyticsConsent('granted');

      expect(document.cookie).not.toContain(`${ADS_CONSENT_KEY}=`);
      expect(window.ttq?.grantConsent).not.toHaveBeenCalled();
      expect(window.loadTikTokPixel).not.toHaveBeenCalled();
      expect(window.fbq).not.toHaveBeenCalled();
      expect(window.loadMetaPixel).not.toHaveBeenCalled();
    });
  });

  describe('getAdsConsent', () => {
    it('should return false when only analytics consent is granted', () => {
      document.cookie = `${COOKIE_CONSENT_KEY}=granted`;
      expect(getAdsConsent()).toBe(false);
    });

    it('should return true when advertising consent is granted', () => {
      document.cookie = `${ADS_CONSENT_KEY}=granted`;
      expect(getAdsConsent()).toBe(true);
    });
  });

  describe('updateAdsConsent', () => {
    it('should save the choice and start both pixels when consent is granted', () => {
      installPixels();

      updateAdsConsent(true);

      expect(document.cookie).toContain(`${ADS_CONSENT_KEY}=granted`);
      expect(window.ttq?.grantConsent).toHaveBeenCalledOnce();
      expect(window.loadTikTokPixel).toHaveBeenCalledOnce();
      expect(window.fbq).toHaveBeenCalledWith('consent', 'grant');
      expect(window.loadMetaPixel).toHaveBeenCalledOnce();
    });

    it('should save the choice and stop both pixels without loading them when consent is denied', () => {
      installPixels();

      updateAdsConsent('denied');

      expect(document.cookie).toContain(`${ADS_CONSENT_KEY}=denied`);
      expect(window.ttq?.revokeConsent).toHaveBeenCalledOnce();
      expect(window.fbq).toHaveBeenCalledWith('consent', 'revoke');
      expect(window.loadTikTokPixel).not.toHaveBeenCalled();
      expect(window.loadMetaPixel).not.toHaveBeenCalled();
    });

    it('should leave the analytics choice untouched', () => {
      updateAdsConsent('granted');

      expect(document.cookie).not.toContain(`${COOKIE_CONSENT_KEY}=`);
    });

    it('should not throw when the pixels are not installed', () => {
      expect(() => updateAdsConsent('denied')).not.toThrow();
    });
  });
});
