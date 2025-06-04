import { Risk } from '@/lib/enums/risk';

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
  description: string;
  responsibilities?: string[];
  startDate?: string; // yyyy-MM-dd
  endDate?: string; // yyyy-MM-dd lub 'Present'
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
  hasLoans?: boolean;
  loanDetails?: string;
  riskAppetite: Risk;
  willingToRelocate?: boolean;
};

export type UserProfile = {
  firstName: string;
  lastName: string;
  country: string;
  address?: string;
  phoneNumber?: string;
  education?: EducationEntry[];
  workExperience?: WorkExperienceEntry[];
  skills?: string[];
  certificates?: CertificateEntry[];
  languages?: LanguageEntry[];
  additionalInformation?: string;
  aboutMe?: string;
  personalityType: PersonalityType;
  financialSurvey?: FinancialSurvey;
};
