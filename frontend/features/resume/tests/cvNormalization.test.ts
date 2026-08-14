// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { hasPersistedHobbies, normalizeCvDto } from '../dal/cvNormalization';

describe('normalizeCvDto', () => {
  it('defaults missing CV collections to empty arrays', () => {
    expect(normalizeCvDto({})).toEqual({
      basics: undefined,
      work: [],
      education: [],
      certificates: [],
      projects: [],
      social: [],
      skills: [],
      languages: [],
      hobbies: [],
    });
  });

  it('preserves the saved hobby order', () => {
    expect(normalizeCvDto({ hobbies: ['Fotografia', 'Bieganie'] }).hobbies).toEqual([
      'Fotografia',
      'Bieganie',
    ]);
  });

  it('distinguishes historical CVs from CVs with an intentionally empty hobby list', () => {
    expect(hasPersistedHobbies({})).toBe(false);
    expect(hasPersistedHobbies({ hobbies: null })).toBe(false);
    expect(hasPersistedHobbies({ hobbies: [] })).toBe(true);
  });

  it('normalizes null responsibilities to an empty array without falling back to description', () => {
    const result = normalizeCvDto({
      work: [
        {
          company: 'Erli.pl',
          position: 'Marketing Automation Specialist',
          description: 'Legacy description',
          responsibilities: null,
        },
      ],
    });

    expect(result.work[0].responsibilities).toEqual([]);
    expect(result.work[0].responsibilities).not.toEqual(['Legacy description']);
  });

  it('trims work responsibilities and removes empty items', () => {
    const result = normalizeCvDto({
      work: [
        {
          responsibilities: ['  Build workflows  ', '', 'Monitor customer data quality', '   '],
        },
      ],
    });

    expect(result.work[0].responsibilities).toEqual([
      'Build workflows',
      'Monitor customer data quality',
    ]);
  });
});
