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
