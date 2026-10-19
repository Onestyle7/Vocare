// Data model of the CV editor, shared by the desktop editor and the mobile
// (phone) editor so both edit the same state.

export interface SocialLink {
  id: string;
  label: string;
  url: string;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  socialLinks: SocialLink[];
  profession: string;
  summary: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  responsibilities: string[];
  isCurrent: boolean;
  useBulletList: boolean;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

export interface Project {
  id: string;
  title: string;
  url: string;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
}

export interface Hobby {
  id: string;
  name: string;
}

export interface Language {
  id: string;
  name: string;
  level: string;
}

export interface Certificate {
  id: string;
  name: string;
  date: string;
  hasDate: boolean;
}

export interface PrivacyStatement {
  id: string;
  content: string;
}
