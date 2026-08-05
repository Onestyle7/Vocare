export interface CvLocationDto {
  city: string;
  country: string;
}

export interface CvBasicsDto {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  summary: string;
  location: CvLocationDto;
}

export interface CvWorkEntryDto {
  company?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  description?: string | null;
  responsibilities?: string[] | null;
}

export interface CvEducationEntryDto {
  institution?: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface CvCertificateEntryDto {
  name: string;
  date?: string;
}

export interface CvProjectDto {
  name: string;
  description: string;
  link: string;
}

export interface CvSocialDto {
  social: string;
  link: string;
}

export interface CvLanguageEntryDto {
  language: string;
  fluency: string;
}

export interface CvDto {
  basics?: CvBasicsDto;
  work: CvWorkEntryDto[];
  education: CvEducationEntryDto[];
  certificates: CvCertificateEntryDto[];
  projects: CvProjectDto[];
  social: CvSocialDto[];
  skills: string[];
  languages: CvLanguageEntryDto[];
}

export interface CvDetailsDto {
  id: string;
  name: string;
  targetPosition?: string;
  cvData: CvDto;
  isDefault: boolean;
  createdAt: string;
  lastModifiedAt: string;
  version: number;
  notes?: string;
}

export interface CvListItemDto {
  id: string;
  name: string;
  targetPosition?: string;
  isDefault: boolean;
  createdAt: string;
  lastModifiedAt: string;
  version: number;
  notes?: string;
}

export interface CvLimits {
  canCreateNew: boolean;
  currentCount: number;
  maxLimit: number;
}

export interface CvAnalysisSectionScore {
  sectionName: string;
  score: number;
  insights: string[];
}

export interface CvAnalysisResult {
  overallScore: number;
  targetPositionScore: number;
  sectionScores: CvAnalysisSectionScore[];
  topImprovements: string[];
}

export interface CreateCvDto {
  name: string;
  targetPosition?: string;
  createFromProfile?: boolean;
  initialData?: CvDto;
  notes?: string;
}

export interface UpdateCvDto {
  id: string;
  name: string;
  targetPosition?: string;
  cvData: CvDto;
  notes?: string;
}

export interface GenerateCvFromProfileDto {
  name: string;
  jobDescription: string;
}

export interface TailorCvDto {
  cvId: string;
  jobDescription: string;
}
