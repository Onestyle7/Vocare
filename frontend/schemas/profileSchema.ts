import { z } from 'zod';

export const personalityTypes = {
  1: 'INFP - Mediator',
  2: 'INFJ - Advocate',
  3: 'INTP - Logician',
  4: 'INTJ - Architect',
  5: 'ENFP - Campaigner',
  6: 'ENFJ - Protagonist',
  7: 'ENTP - Debater',
  8: 'ENTJ - Commander',
  9: 'ISFP - Adventurer',
  10: 'ISFJ - Defender',
  11: 'ISTP - Virtuoso',
  12: 'ISTJ - Logistician',
  13: 'ESFP - Entertainer',
  14: 'ESFJ - Consul',
  15: 'ESTP - Entrepreneur',
  16: 'ESTJ - Executive',
};

export const profileSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  country: z.string().min(1, 'Required'),
  address: z.string().min(1, 'Required'),
  phoneNumber: z.string().optional(),
  education: z.string().min(1, 'Required'),
  workExperience: z.array(z.string()).nonempty('At least one required'),
  skills: z.array(z.string()).nonempty('At least one required'),
  certificates: z.array(z.string()).optional(),
  languages: z.array(z.string()).nonempty('At least one required'),
  additionalInformation: z.string().optional(),
  aboutMe: z.string().min(1, 'Required'),
  personalityType: z.number().int().min(1).max(16),
});

export type ProfileFormType = z.infer<typeof profileSchema>;
