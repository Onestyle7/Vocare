import { z } from 'zod';
import { PersonalityType } from '@/lib/enums/personalityTypes';
import { Risk } from '@/lib/enums/risk';

const certificateEntrySchema = z.object({
  name: z.string().min(1, 'Certificate name is required'),
  issuer: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  noExpiry: z.boolean().default(false),
});

const educationEntrySchema = z.object({
  institution: z.string().min(1, 'Institution name is required'),
  degree: z.string().optional(),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
});

const workExperienceEntrySchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  position: z.string().min(1, 'Position is required'),
  description: z.string().min(1, 'Company name is required'),
  responsibilities: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
});

const languageEntrySchema = z.object({
  language: z.string().min(1, 'Language name is required'),
  level: z.string().optional(),
});

const financialSurveySchema = z.object({
  currentSalary: z
    .preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number())
    .optional(),
  desiredSalary: z
    .preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number())
    .optional(),
  hasLoans: z.boolean().default(false),
  loanDetails: z.string().optional(),
  riskAppetite: z.nativeEnum(Risk).default(Risk.Unknown),
  willingToRelocate: z.boolean().default(false),
});

const baseProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  country: z.string().min(1, 'Country is required'),
  address: z.string().min(1, 'Address is required'),
  phoneNumber: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        return val.replace(/[\s\-]/g, '');
      }
      return val;
    },
    z
      .string()
      .min(1, 'Phone number is required')
      .regex(/^\d{9}$/, 'Nmber must be 9 digits long')
  ),
  education: z.array(educationEntrySchema).optional(),
  workExperience: z.array(workExperienceEntrySchema).optional(),
  skills: z.array(z.string()).optional(),
  softSkills: z.array(z.string()).optional(),
  certificates: z.array(certificateEntrySchema).optional(),
  languages: z.array(languageEntrySchema).optional(),
  additionalInformation: z.string().optional(),
  aboutMe: z.string().optional(),
  personalityType: z.nativeEnum(PersonalityType),
  financialSurvey: financialSurveySchema.optional(),
});

export const createProfileSchema = baseProfileSchema;

export const updateProfileSchema = baseProfileSchema;

export type CreateProfileFormType = z.infer<typeof createProfileSchema>;
export type UpdateProfileFormType = z.infer<typeof updateProfileSchema>;
