// @vitest-environment node

import { describe, expect, it } from 'vitest';

import {
  formatLocations,
  formatSalary,
  getCategoryLabel,
  getOfferSourceLabel,
} from '../utils/jobOfferDisplay';

const NBSP = ' ';
describe('getOfferSourceLabel', () => {
  it('maps known sources to platform names', () => {
    expect(getOfferSourceLabel('NofluffJobs')).toBe('No Fluff Jobs');
    expect(getOfferSourceLabel('SolidJobs')).toBe('SOLID.Jobs');
  });

  it('returns null when the source is missing', () => {
    expect(getOfferSourceLabel(undefined)).toBeNull();
  });
});

describe('getCategoryLabel', () => {
  it('maps known categories to labels', () => {
    expect(getCategoryLabel('businessAnalyst')).toBe('Analiza biznesowa');
    expect(getCategoryLabel('backend')).toBe('Backend');
  });

  it('humanizes unknown categories', () => {
    expect(getCategoryLabel('someNewCategory')).toBe('Some new category');
  });
});

describe('formatLocations', () => {
  it('shows the city with remote work', () => {
    expect(formatLocations(['Warszawa', 'Remote'])).toBe('Warszawa · Zdalnie');
  });

  it('shows the number of other cities and removes duplicates', () => {
    expect(formatLocations(['Warszawa', 'Kraków', 'warszawa', 'Remote', 'Remote'])).toBe(
      'Warszawa +1 · Zdalnie'
    );
  });

  it('handles remote-only and empty lists', () => {
    expect(formatLocations(['Remote'])).toBe('Zdalnie');
    expect(formatLocations([])).toBe('');
    expect(formatLocations(undefined)).toBe('');
  });
});

describe('formatSalary', () => {
  it('appends the currency and period', () => {
    expect(
      formatSalary({ salaryMin: 100, salaryMax: 150, salaryCurrency: 'PLN', salaryPeriod: 'Hour' })
    ).toBe('100–150 PLN/h');
    expect(
      formatSalary({
        salaryMin: 16500,
        salaryMax: 20000,
        salaryCurrency: 'PLN',
        salaryPeriod: 'Month',
      })
    ).toBe(`16${NBSP}500–20${NBSP}000 PLN/mies.`);
  });

  it('groups 4-digit amounts the same way as 5-digit ones', () => {
    expect(
      formatSalary({
        salaryMin: 8000,
        salaryMax: 13000,
        salaryCurrency: 'PLN',
        salaryPeriod: 'Month',
      })
    ).toBe(`8${NBSP}000–13${NBSP}000 PLN/mies.`);
  });

  it('shows a single value when min equals max, keeping decimals', () => {
    expect(
      formatSalary({
        salaryMin: 52.5,
        salaryMax: 52.5,
        salaryCurrency: 'PLN',
        salaryPeriod: 'Hour',
      })
    ).toBe('52,5 PLN/h');
  });

  it('handles open ranges and missing period', () => {
    expect(formatSalary({ salaryMin: 120, salaryMax: null, salaryCurrency: 'PLN' })).toBe(
      'od 120 PLN'
    );
    expect(formatSalary({ salaryMin: null, salaryMax: 900, salaryCurrency: 'EUR' })).toBe(
      'do 900 EUR'
    );
  });

  it('returns a placeholder without salary data', () => {
    expect(formatSalary({ salaryMin: null, salaryMax: null })).toBe('Brak widełek');
  });
});
