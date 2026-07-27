import { beforeEach, describe, expect, it, vi } from 'vitest';

import { COOKIE_CONSENT_KEY, getAnalyticsConsent, updateAnalyticsConsent } from './consent';

describe('consent utils', () => {
  beforeEach(() => {
    document.cookie = `${COOKIE_CONSENT_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    delete window.gtag;
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
  });
});
