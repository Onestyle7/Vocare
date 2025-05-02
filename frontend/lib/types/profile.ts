export type CertificateEntry = {
  name: string;
  date?: string; // Format: yyyy-MM-dd
  issuer?: string;
};

export type EducationEntry = {
  institution: string;
  degree?: string;
  field?: string;
  startDate?: string; // yyyy-MM-dd
  endDate?: string; // yyyy-MM-dd
};

export type WorkExperienceEntry = {
  company: string;
  position: string;
  description: string;
  responsibilities?: string[];
  startDate?: string; // yyyy-MM-dd
  endDate?: string; // yyyy-MM-dd lub 'Present'
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
};
