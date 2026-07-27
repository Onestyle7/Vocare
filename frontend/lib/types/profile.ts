import { Risk } from '@/lib/types/risk';

export const educationDegreeLabels: Record<string, string> = {
  Bachelor: 'Inżynier/Licencjat',
  Master: 'Magister',
  PhD: 'Doktor',
  Associate: 'Studia podyplomowe',
  'High School': 'Wykształcenie średnie',
  Other: 'Inne',
};

const educationDegreeLabelsEn: Record<string, string> = {
  Bachelor: 'Bachelor',
  Master: 'Master',
  PhD: 'PhD',
  Associate: 'Postgraduate',
  'High School': 'High School',
  Other: 'Other',
};

export const getEducationDegreeLabel = (
  degree?: string,
  language: 'pl' | 'en' = 'pl'
): string => {
  if (!degree) return '';

  const labels = language === 'pl' ? educationDegreeLabels : educationDegreeLabelsEn;
  return labels[degree] ?? degree;
};

export type CertificateEntry = {
  name: string;
  issuer?: string;
  issueDate?: string; // yyyy-MM-dd
  expiryDate?: string; // yyyy-MM-dd
  noExpiry?: boolean; // true if the certificate does not expire
};

export type EducationEntry = {
  institution: string;
  degree?: string;
  field?: string;
  startDate?: string; // yyyy-MM-dd
  endDate?: string; // yyyy-MM-dd
  current?: boolean;
};

export type WorkExperienceEntry = {
  company: string;
  position: string;
  description?: string | null;
  responsibilities?: string[];
  startDate?: string;
  endDate?: string;
  current?: boolean;
};

export type LanguageEntry = {
  language: string;
  level?: string; // B2, C1, native itd.
};

export enum PersonalityType {
  Mediator = 1,
  Advocate,
  Logician,
  Architect,
  Campaigner,
  Protagonist,
  Debater,
  Commander,
  Adventurer,
  Defender,
  Virtuoso,
  Logistician,
  Entertainer,
  Consul,
  Entrepreneur,
  Executive,
  Unknown,
}

export type FinancialSurvey = {
  currentSalary?: number;
  desiredSalary?: number;
  hasLoans: boolean;
  loanDetails?: string;
  riskAppetite: Risk;
  willingToRelocate: boolean;
};

export type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  address?: string;
  phoneNumber?: string;
  education?: EducationEntry[];
  workExperience?: WorkExperienceEntry[];
  skills?: string[];
  softSkills?: string[];
  certificates?: CertificateEntry[];
  languages?: LanguageEntry[];
  additionalInformation?: string;
  aboutMe?: string;
  willingToRebrand?: boolean;
  personalityType: PersonalityType;
  financialSurvey?: FinancialSurvey;
};
