import { describe, expect, it } from 'vitest';

import {
  getMarketingConsentToastMessage,
  getRegistrationToastMessage,
} from '../utils/welcomeBonus';

describe('getMarketingConsentToastMessage', () => {
  it('announces the consent discount with its expiry date', () => {
    expect(
      getMarketingConsentToastMessage({
        welcomeBonusStatus: 'Disabled',
        welcomeTokensGranted: 0,
        consentDiscount: { percentOff: 25, expiresAt: '2026-10-29T12:00:00Z' },
      })
    ).toBe('Zgody marketingowe włączone. Masz -25% na pakiet tokenów, ważne do 29.10.2026.');
  });

  it('mentions the granted amount on the first consent', () => {
    expect(
      getMarketingConsentToastMessage({ welcomeBonusStatus: 'Granted', welcomeTokensGranted: 120 })
    ).toBe('Zgody marketingowe włączone, przyznano 120 tokenów. Będziemy w kontakcie!');
  });

  it.each([
    [1, '1 token'],
    [2, '2 tokeny'],
    [12, '12 tokenów'],
    [22, '22 tokeny'],
    [1000, '1000 tokenów'],
  ])('declines the amount %i in Polish', (amount, expected) => {
    expect(
      getMarketingConsentToastMessage({
        welcomeBonusStatus: 'Granted',
        welcomeTokensGranted: amount,
      })
    ).toContain(`przyznano ${expected}.`);
  });

  it('informs about delayed tokens when the grant is pending', () => {
    expect(
      getMarketingConsentToastMessage({ welcomeBonusStatus: 'Pending', welcomeTokensGranted: 0 })
    ).toBe('Zgody marketingowe włączone. Tokeny pojawią się na koncie za chwilę.');
  });

  it.each(['AlreadyClaimed', 'Disabled', 'Failed'] as const)(
    'does not mention tokens for %s',
    (status) => {
      expect(
        getMarketingConsentToastMessage({ welcomeBonusStatus: status, welcomeTokensGranted: 0 })
      ).toBe('Zgody marketingowe włączone. Będziemy w kontakcie!');
    }
  );

  it('falls back to the plain message without bonus data', () => {
    expect(getMarketingConsentToastMessage(null)).toBe(
      'Zgody marketingowe włączone. Będziemy w kontakcie!'
    );
  });
});

describe('getRegistrationToastMessage', () => {
  it('mentions the granted amount', () => {
    expect(getRegistrationToastMessage({ status: 'Granted', amount: 100 })).toBe(
      'Rejestracja ukończona, przyznano 100 tokenów'
    );
  });

  it('informs about delayed tokens when the grant is pending', () => {
    expect(getRegistrationToastMessage({ status: 'Pending', amount: 0 })).toBe(
      'Rejestracja ukończona. Tokeny pojawią się na koncie za chwilę.'
    );
  });

  it('keeps the plain message without marketing consent', () => {
    expect(getRegistrationToastMessage(null)).toBe('Rejestracja ukończona');
  });

  it('announces the consent discount instead of tokens', () => {
    expect(
      getRegistrationToastMessage(
        { status: 'Disabled', amount: 0 },
        { percentOff: 25, expiresAt: '2026-10-30T12:00:00Z' }
      )
    ).toBe('Rejestracja ukończona. Masz -25% na pakiet tokenów, ważne do 30.10.2026.');
  });
});
