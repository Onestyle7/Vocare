export interface CvDto {
  basics?: CvBasicsDto;
  work?: CvWorkEntryDto[];
  education?: CvEducationEntryDto[];
  certificates?: CvCertificateEntryDto[];
  skills?: string[];
  languages?: CvLanguageEntryDto[];
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
  description?: string;
}

export interface CvEducationEntryDto {
  institution?: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
}

export interface CvCertificateEntryDto {
  name: string;
  date?: string;
}

export interface CvLanguageEntryDto {
  language: string;
  fluency: string;
}

export interface CvLocationDto {
  city: string;
  country: string;
}
