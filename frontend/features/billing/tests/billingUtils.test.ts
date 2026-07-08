import { describe, expect, it } from 'vitest';

import {
  formatPaymentAmount,
  getStatusBadgeVariant,
  getTypeLabel,
  PAYMENT_DATE_FORMATTER,
} from '../billingUtils';

describe('Billing Utils', () => {
  describe('getStatusBadgeVariant', () => {
    it.each([
      ['succeeded', 'secondary'],
      ['paid', 'secondary'],
      ['SUCCEEDED', 'secondary'],
      ['pending', 'outline'],
      ['processing', 'outline'],
      ['open', 'outline'],
      ['PeNdInG', 'outline'],
      ['failed', 'destructive'],
      ['canceled', 'destructive'],
      ['unknown_status', undefined],
      ['', undefined],
    ])('dla statusu "%s" zwraca "%s"', (status, expected) => {
      expect(getStatusBadgeVariant(status)).toBe(expected);
    });
  });

  describe('formatPaymentAmount', () => {
    it.each([
      [NaN, 'USD', '—'],
      [Infinity, 'PLN', '—'],
      [1000, 'INVALID', '10.00 INVALID'],
    ])('dla kwoty %s i waluty "%s" zwraca tekst "%s"', (amount, currency, expected) => {
      expect(formatPaymentAmount(amount, currency)).toBe(expected);
    });

    it.each([
      [1500, 'USD', /15[.,]00/],
      [2550, 'PLN', /25[.,]50/],
      [500, undefined, /5[.,]00/],
    ])('poprawnie formatuje %s używając silnika Intl', (amount, currency, expectedRegex) => {
      // @ts-expect-error - test undefined variable handling
      expect(formatPaymentAmount(amount, currency)).toMatch(expectedRegex);
    });
  });

  describe('getTypeLabel', () => {
    it.each([
      ['subscription', 'Subskrypcja'],
      ['SUBSCRIPTION', 'Subskrypcja'],
      ['token_purchase', 'Zakup tokenów'],
      ['TOKEN_purchase', 'Zakup tokenów'],
      ['unknown_type', 'Nieznany typ płatności'],
      ['', 'Nieznany typ płatności'],
    ])('dla typu "%s" zwraca etykietę "%s"', (type, expected) => {
      expect(getTypeLabel(type)).toBe(expected);
    });
  });

  describe('PAYMENT_DATE_FORMATTER', () => {
    it('jest poprawnie zainicjalizowany z językiem pl-PL', () => {
      expect(PAYMENT_DATE_FORMATTER).toBeInstanceOf(Intl.DateTimeFormat);
      expect(PAYMENT_DATE_FORMATTER.resolvedOptions().locale).toBe('pl-PL');
    });
  });
});
