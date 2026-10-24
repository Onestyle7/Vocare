// @vitest-environment node

import { describe, expect, it } from 'vitest';

import {
  decodeHtmlEntities,
  formatLocations,
  formatSalary,
  getCategoryLabel,
  getOfferPreview,
  getOfferSourceLabel,
  stripHtml,
} from '../utils/jobOfferDisplay';

const NBSP = ' ';
const LONG_BRIEF =
  '<p>We are looking for a <b>Senior Backend Developer</b> to join our team building payment APIs.</p>';

describe('decodeHtmlEntities', () => {
  it('decodes named and numeric entities found in offers', () => {
    expect(decodeHtmlEntities('Telephony &amp; Contact &lt;3 &quot;x&quot; it&#39;s')).toBe(
      'Telephony & Contact <3 "x" it\'s'
    );
    expect(decodeHtmlEntities('Kraj&oacute;w&#x21;')).toBe('Krajów!');
  });

  it('leaves unknown or invalid entities untouched', () => {
    expect(decodeHtmlEntities('&foo; &#0; &#xFFFFFFF;')).toBe('&foo; &#0; &#xFFFFFFF;');
  });
});

describe('stripHtml', () => {
  it('removes tags, decodes entities and collapses whitespace', () => {
    expect(stripHtml('<p>Hello&nbsp;<b>world</b></p>\n<br>  again')).toBe('Hello world again');
  });

  it('removes a tag cut in half at the end of a truncated preview', () => {
    expect(stripHtml('<p>Opis oferty</p><span style="color: rgb(5')).toBe('Opis oferty');
  });

  it('returns empty string for missing values', () => {
    expect(stripHtml(undefined)).toBe('');
    expect(stripHtml(null)).toBe('');
  });
});

describe('getOfferPreview', () => {
  const offer = (
    briefDescription: string,
    descriptionPreview?: string,
    title = 'Senior QA Java'
  ) => ({
    title,
    briefDescription,
    descriptionPreview,
  });

  it('uses a meaningful brief', () => {
    expect(getOfferPreview(offer(LONG_BRIEF, '<p>Pełny opis</p>'))).toBe(
      'We are looking for a Senior Backend Developer to join our team building payment APIs.'
    );
  });

  it('falls back to the description when the brief is only empty tags', () => {
    expect(getOfferPreview(offer('<p><b></b></p>\n<p><br></p>', '<p>Pełny opis</p>'))).toBe(
      'Pełny opis'
    );
  });

  it('falls back to the description when the brief repeats the title', () => {
    expect(getOfferPreview(offer('<h3>Senior QA Java</h3>', '<p>Pełny opis</p>'))).toBe(
      'Pełny opis'
    );
  });

  it('strips the SolidJobs description header', () => {
    const solidJobsDescription =
      '<div class="well job - description"><p><strong>Czym będziesz się zajmować?</strong><br><br><h1>Szukamy testera</h1>';
    expect(getOfferPreview(offer('', solidJobsDescription))).toBe('Szukamy testera');
  });

  it('keeps a short brief when there is no description', () => {
    expect(getOfferPreview(offer('<p>Rozwój systemów i oprogramowania.</p>'))).toBe(
      'Rozwój systemów i oprogramowania.'
    );
  });

  it('returns null when there is nothing to show', () => {
    expect(getOfferPreview(offer('<h3>Senior QA Java</h3>'))).toBeNull();
    expect(getOfferPreview(offer('', ''))).toBeNull();
  });
});

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
