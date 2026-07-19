import { z } from 'zod';

import { PersonalityType } from '@/lib/types/personalityTypes';
import { Risk } from '@/lib/types/risk';

const certificateEntrySchema = z.object({
  name: z.string().min(1, 'Nazwa certyfikatu jest wymagana'),
  issuer: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  noExpiry: z.boolean().default(false),
});

const educationEntrySchema = z.object({
  institution: z.string().min(1, 'Nazwa instytucji jest wymagana'),
  degree: z.string().optional(),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
});

const workExperienceEntrySchema = z.object({
  company: z.string().min(1, 'Nazwa firmy jest wymagana'),
  position: z.string().min(1, 'Stanowisko jest wymagane'),
  responsibilities: z.array(z.string()).default([]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
});

const languageEntrySchema = z.object({
  language: z.string().min(1, 'Nazwa języka jest wymagana'),
  level: z.string().optional(),
});

const financialSurveySchema = z.object({
  currentSalary: z
    .preprocess(
      (val) => (val === '' || val === null ? undefined : Number(val)),
      z
        .number({ invalid_type_error: 'Wprowadź poprawną liczbę' })
        .int('Pensja musi być liczbą całkowitą')
        .positive('Pensja musi być liczbą dodatnią')
        .optional()
    )
    .optional(),
  desiredSalary: z
    .preprocess(
      (val) => (val === '' || val === null ? undefined : Number(val)),
      z
        .number({ invalid_type_error: 'Wprowadź poprawną liczbę' })
        .int('Oczekiwana pensja musi być liczbą całkowitą')
        .positive('Oczekiwana pensja musi byc liczbą dodatnią')
        .optional()
    )
    .optional(),
  hasLoans: z.boolean().default(false),
  loanDetails: z.string().optional(),
  riskAppetite: z.nativeEnum(Risk).default(Risk.Unknown),
  willingToRelocate: z.boolean().default(false),
});

const baseProfileSchema = z.object({
  firstName: z.string().min(1, 'Imię jest wymagane'),
  lastName: z.string().min(1, 'Nazwisko jest wymagane'),
  country: z.string().min(1, 'Kraj jest wymagany'),
  address: z.string().min(1, 'Adres jest wymagany'),
  phoneNumber: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        return val.replace(/[\s\-]/g, '');
      }
      return val;
    },
    z
      .string()
      .min(1, 'Numer telefonu jest wymagany')
      .regex(/^\d{9}$/, 'Numer telefonu musi składać się dokładnie z 9 cyfr')
  ),
  education: z.array(educationEntrySchema).optional(),
  workExperience: z.array(workExperienceEntrySchema).optional(),
  skills: z.array(z.string()).optional(),
  softSkills: z.array(z.string()).optional(),
  certificates: z.array(certificateEntrySchema).optional(),
  languages: z.array(languageEntrySchema).optional(),
  additionalInformation: z.string().optional(),
  aboutMe: z.string().optional(),
  willingToRebrand: z.boolean().default(false),
  personalityType: z.nativeEnum(PersonalityType),
  financialSurvey: financialSurveySchema.optional(),
});

export const createProfileSchema = baseProfileSchema;

export const updateProfileSchema = baseProfileSchema;

export type CreateProfileFormType = z.infer<typeof createProfileSchema>;
export type UpdateProfileFormType = z.infer<typeof updateProfileSchema>;
