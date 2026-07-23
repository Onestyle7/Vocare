// @vitest-environment node

import { describe, expect, it } from 'vitest';

import {
  normalizeResponsibilitiesForPayload,
  responsibilityLinesToText,
  textToResponsibilityLines,
} from './workResponsibilities';

describe('work responsibilities utils', () => {
  describe('responsibilityLinesToText', () => {
    it('joins responsibilities with new lines for textarea editing', () => {
      expect(responsibilityLinesToText(['Build workflows', 'Monitor data quality'])).toBe(
        'Build workflows\nMonitor data quality'
      );
    });

    it.each([undefined, null])('returns empty text for %s responsibilities', (value) => {
      expect(responsibilityLinesToText(value)).toBe('');
    });
  });

  describe('textToResponsibilityLines', () => {
    it('splits textarea text by unix and windows new lines without trimming drafts', () => {
      expect(textToResponsibilityLines('Build workflows\r\n\n  Monitor data quality  ')).toEqual([
        'Build workflows',
        '',
        '  Monitor data quality  ',
      ]);
    });
  });

  describe('normalizeResponsibilitiesForPayload', () => {
    it('trims responsibilities and removes empty values before API payloads', () => {
      expect(
        normalizeResponsibilitiesForPayload([
          '  Build workflows  ',
          '',
          '   ',
          'Monitor data quality',
          null,
          undefined,
        ])
      ).toEqual(['Build workflows', 'Monitor data quality']);
    });

    it.each([undefined, null, []])('normalizes %s to an empty array', (value) => {
      expect(normalizeResponsibilitiesForPayload(value)).toEqual([]);
    });
  });
});
