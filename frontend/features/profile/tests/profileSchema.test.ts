// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { PersonalityType } from '@/lib/types/personalityTypes';

import { createProfileSchema } from '../profileSchema';

const baseProfile = {
  firstName: 'Jan',
  lastName: 'Kowalski',
  country: 'Polska',
  address: 'Krakow',
  phoneNumber: '123456789',
  personalityType: PersonalityType.Unknown,
};

describe('profileSchema workExperience', () => {
  it('does not require legacy description for work experience', () => {
    const result = createProfileSchema.parse({
      ...baseProfile,
      workExperience: [
        {
          company: 'Erli.pl',
          position: 'Marketing Automation Specialist',
        },
      ],
    });

    expect(result.workExperience?.[0]).toEqual({
      company: 'Erli.pl',
      position: 'Marketing Automation Specialist',
      responsibilities: [],
      current: false,
    });
  });

  it('strips legacy description and defaults responsibilities to an empty array', () => {
    const result = createProfileSchema.parse({
      ...baseProfile,
      workExperience: [
        {
          company: 'Erli.pl',
          position: 'Marketing Automation Specialist',
          description: 'Legacy description',
        },
      ],
    });

    expect(result.workExperience?.[0]).not.toHaveProperty('description');
    expect(result.workExperience?.[0].responsibilities).toEqual([]);
  });
});

describe('profileSchema phoneNumber', () => {
  const parsePhone = (phoneNumber: string) =>
    createProfileSchema.safeParse({ ...baseProfile, phoneNumber });

  it.each([
    ['600100200', '600100200'],
    ['600 100 200', '600100200'],
    ['600-100-200', '600100200'],
    ['+48 600 100 200', '600100200'],
    ['0048 600-100-200', '600100200'],
    ['(+48) 600.100.200', '600100200'],
  ])('accepts %s and stores 9 digits', (input, expected) => {
    const result = parsePhone(input);
    expect(result.success).toBe(true);
    expect(result.success && result.data.phoneNumber).toBe(expected);
  });

  it.each(['', '60010020', '6001002000', '+49 600 100 200'])('rejects %s', (input) => {
    expect(parsePhone(input).success).toBe(false);
  });
});
