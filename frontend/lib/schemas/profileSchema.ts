import { z } from 'zod';
import { PersonalityType } from '@/lib/enums/personalityTypes';

const certificateEntrySchema = z.object({
  name: z.string().min(1, 'Certificate name is required'),
  date: z.string().optional(),
  issuer: z.string().optional(),
});

const educationEntrySchema = z.object({
  institution: z.string().min(1, 'Institution name is required'),
  degree: z.string().optional(),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const workExperienceEntrySchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  position: z.string().min(1, 'Position is required'),
  description: z.string().min(1, 'Company name is required'),
  responsibilities: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const languageEntrySchema = z.object({
  language: z.string().min(1, 'Language name is required'),
  level: z.string().optional(),
});

const baseProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  country: z.string().min(1, 'Country is required'),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  education: z.array(educationEntrySchema).optional(),
  workExperience: z.array(workExperienceEntrySchema).optional(),
  skills: z.array(z.string()).optional(),
  certificates: z.array(certificateEntrySchema).optional(),
  languages: z.array(languageEntrySchema).optional(),
  additionalInformation: z.string().optional(),
  aboutMe: z.string().optional(),
  personalityType: z.nativeEnum(PersonalityType),
});

export const createProfileSchema = baseProfileSchema;

export const updateProfileSchema = baseProfileSchema;

export type CreateProfileFormType = z.infer<typeof createProfileSchema>;
export type UpdateProfileFormType = z.infer<typeof updateProfileSchema>;
