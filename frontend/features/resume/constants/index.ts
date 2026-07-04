export type ResumePreviewLanguage = 'pl' | 'en';

type ResumePreviewSectionId =
  | 'profile'
  | 'experience'
  | 'projects'
  | 'education'
  | 'certificates'
  | 'skills'
  | 'languages'
  | 'hobbies'
  | 'privacy';

type ResumePreviewLabels = {
  current: string;
  locale: string;
  sections: Record<ResumePreviewSectionId, string>;
};

export const RESUME_PREVIEW_LABELS: Record<ResumePreviewLanguage, ResumePreviewLabels> = {
  pl: {
    current: 'obecnie',
    locale: 'pl-PL',
    sections: {
      profile: 'Profil osobisty',
      experience: 'Doświadczenie zawodowe',
      projects: 'Projekty',
      education: 'Edukacja',
      certificates: 'Certyfikaty',
      skills: 'Umiejętności',
      languages: 'Języki',
      hobbies: 'Zainteresowania',
      privacy: 'Klauzula informacyjna',
    },
  },
  en: {
    current: 'present',
    locale: 'en-US',
    sections: {
      profile: 'Personal profile',
      experience: 'Work experience',
      projects: 'Projects',
      education: 'Education',
      certificates: 'Certificates',
      skills: 'Skills',
      languages: 'Languages',
      hobbies: 'Hobby',
      privacy: 'Privacy statement',
    },
  },
};
